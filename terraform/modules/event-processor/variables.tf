variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "processor_zip_path" {
  description = "Path to the event processor Lambda function zip"
  type        = string
}

variable "dispatcher_zip_path" {
  description = "Path to the event dispatcher Lambda function zip"
  type        = string
}

variable "queue_url" {
  description = "URL of the SQS queue"
  type        = string
}

variable "queue_arn" {
  description = "ARN of the SQS queue"
  type        = string
}

variable "dlq_arn" {
  description = "ARN of the dead letter queue"
  type        = string
}

variable "table_name" {
  description = "Name of the DynamoDB table"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  type        = string
}

variable "target_graphql_url" {
  description = "URL of the target GraphQL API"
  type        = string
}