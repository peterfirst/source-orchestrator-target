terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  common_tags = {
    Project     = "chaloub"
    ManagedBy   = "terraform"
    Owner       = "peter"
    Environment = "single"
  }
}

# Storage Module (DynamoDB)
module "storage" {
  source = "./modules/storage"

  name_prefix = var.project_prefix
  common_tags = local.common_tags
  billing_mode = "PAY_PER_REQUEST"  # Using on-demand as per requirements
}

# Queue Module (SQS)
module "queue" {
  source = "./modules/queue"

  name_prefix = var.project_prefix
  common_tags = local.common_tags
  allowed_principal_arns = [module.event_processor.lambda_role_arn]
}

# Event Processor Module (Lambda Functions)
module "event_processor" {
  source = "./modules/event-processor"

  name_prefix = var.project_prefix
  common_tags = local.common_tags
  
  processor_zip_path = "${path.root}/../dist/handlers/eventProcessor.zip"
  dispatcher_zip_path = "${path.root}/../dist/handlers/eventDispatcher.zip"
  
  queue_url = module.queue.queue_url
  queue_arn = module.queue.queue_arn
  dlq_arn = module.queue.dlq_arn
  
  table_name = module.storage.table_name
  dynamodb_table_arn = module.storage.table_arn
  
  target_graphql_url = var.target_graphql_url
}

# API Gateway Module
module "api_gateway" {
  source = "./modules/api-gateway"

  name_prefix = var.project_prefix
  common_tags = local.common_tags
  lambda_invoke_arn = module.event_processor.processor_invoke_arn
}