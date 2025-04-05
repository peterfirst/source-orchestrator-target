terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "chalhoub-be-peter-tfstate"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "chalhoub-be-peter-terraform-locks"
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

# database Module (DynamoDB)
module "dynamodb_events" {
  source = "./modules/dynamodb-events"

  name_prefix  = var.name_prefix
  common_tags  = local.common_tags
  billing_mode = "PAY_PER_REQUEST"
}

# API Gateway Module
module "api_gateway_events" {
  source = "./modules/api-gateway-events"

  name_prefix                   = var.name_prefix
  aws_region                    = var.aws_region
  common_tags                   = local.common_tags
  processor_function_invoke_arn = module.lambda_functions.processor_function_arn
  health_function_invoke_arn    = module.lambda_functions.health_function_arn
  authorizer_function_arn       = module.lambda_functions.authorizer_function_arn
  account_id                    = data.aws_caller_identity.current.account_id
}

# Queue Module (SQS)
module "sqs_events" {
  source = "./modules/sqs-events"

  name_prefix            = var.name_prefix
  common_tags            = local.common_tags
  allowed_principal_arns = [module.lambda_functions.lambda_role_arn]
}

# # Use the EventBridge module to route DynamoDB changes to SQS
# module "dynamodb_eventbridge_sqs" {
#   source = "./modules/dynamodb-eventbridge-sqs"

#   name_prefix         = var.name_prefix
#   rule_name           = "dynamodb-to-sqs-rule"
#   rule_description    = "Rule to route DynamoDB events to SQS"
#   dynamodb_stream_arn = module.dynamodb_events.table_stream_arn
#   sqs_queue_arn       = module.sqs_events.queue_arn
#   target_id           = "sqs-target"
# }

# Use the EventBridge module to route DynamoDB changes to SQS
module "dynamodb_eventbridge_pipe_sqs" {
  source = "./modules/dynamodb-eventbridge-pipe-sqs"

  name_prefix         = var.name_prefix
  pipe_name           = "dynamodb-to-sqs-rule"
  pipe_description    = "Pipe to route DynamoDB events to SQS"
  dynamodb_stream_arn = module.dynamodb_events.table_stream_arn
  sqs_queue_arn       = module.sqs_events.queue_arn
}

# Event Processor Module (Lambda Functions
module "lambda_functions" {
  source = "./modules/lambda-functions"

  name_prefix       = var.name_prefix
  common_tags       = local.common_tags
  runtime           = var.lambda_runtime
  layer_description = var.lambda_layer_description

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  processor_name  = var.lambda_processor_name
  dispatcher_name = var.lamda_dispatcher_name
  health_name     = var.lambda_health_name
  authorizer_name = var.lambda_authorizer_name

  node_modules_zip_path = "${path.root}/../dist/node_modules.zip"
  processor_zip_path    = "${path.root}/../dist/processor.zip"
  dispatcher_zip_path   = "${path.root}/../dist/dispatcher.zip"
  health_zip_path       = "${path.root}/../dist/health.zip"
  authorizer_zip_path   = "${path.root}/../dist/authorizer.zip"

  queue_url                 = module.sqs_events.queue_url
  queue_arn                 = module.sqs_events.queue_arn
  dlq_arn                   = module.sqs_events.dlq_arn
  api_gateway_execution_arn = module.api_gateway_events.api_execution_arn

  api_key = var.api_key

  table_name         = module.dynamodb_events.table_name
  dynamodb_table_arn = module.dynamodb_events.table_arn

  target_graphql_url = var.target_graphql_url
}

# Monitoring Module
module "cloudwatch_monitoring" {
  source = "./modules/cloudwatch-monitoring"

  name_prefix = var.name_prefix
  aws_region  = var.aws_region
  common_tags = local.common_tags

  lambda_function_names = {
    processor  = module.lambda_functions.processor_function_name
    dispatcher = module.lambda_functions.dispatcher_function_name
  }

  queue_name = module.sqs_events.queue_name
  dlq_name   = module.sqs_events.dlq_name
}