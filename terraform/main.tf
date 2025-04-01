terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "chaloub-be-peter-tfstate"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "chaloub-be-peter-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  common_tags = {
    Project     = "chalhoub"
    ManagedBy   = "terraform"
    Owner       = "peter"
    Environment = "single"
  }
}

# Storage Module (DynamoDB)
module "storage" {
  source = "./modules/storage"

  name_prefix  = var.name_prefix
  common_tags  = local.common_tags
  billing_mode = "PAY_PER_REQUEST" # Using on-demand as per requirements
}

# API Gateway Module
module "api_gateway" {
  source = "./modules/api-gateway"

  name_prefix        = var.name_prefix
  aws_region         = var.aws_region
  common_tags        = local.common_tags
  dynamodb_table     = module.storage.table_name
  dynamodb_table_arn = module.storage.table_arn
}

# Queue Module (SQS)
module "queue" {
  source = "./modules/queue"

  name_prefix            = var.name_prefix
  common_tags            = local.common_tags
  allowed_principal_arns = [module.event_processor.lambda_role_arn]
}

# Use the EventBridge module to route DynamoDB changes to SQS
module "dynamodb_to_sqs" {
  source = "./modules/dynamo-to-sqs" # Relative path to your module

  rule_name           = "dynamodb-to-sqs-rule"
  rule_description    = "Rule to route DynamoDB events to SQS"
  dynamodb_stream_arn = module.storage.table_stream_arn
  sqs_queue_arn       = module.queue.queue_arn
  account_id          = data.aws_caller_identity.current.account_id
}

# Event Processor Module (Lambda Functions)
module "event_dispatcher" {
  source = "./modules/event-dispatcherr"

  name_prefix = var.name_prefix
  common_tags = local.common_tags

  dispatcher_zip_path = "${path.root}/../dist/handlers/event-dispatcher.zip"

  queue_url = module.queue.queue_url
  queue_arn = module.queue.queue_arn
  dlq_arn   = module.queue.dlq_arn

  table_name         = module.storage.table_name
  dynamodb_table_arn = module.storage.table_arn

  target_graphql_url = var.target_graphql_url
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix = var.name_prefix
  aws_region  = var.aws_region
  common_tags = local.common_tags

  lambda_function_names = {
    processor  = module.event_processor.processor_function_name
    dispatcher = module.event_processor.dispatcher_function_name
  }

  queue_name = module.queue.queue_name
  dlq_name   = module.queue.dlq_name
}