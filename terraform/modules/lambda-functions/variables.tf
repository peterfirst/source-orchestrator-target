variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "layer_description" {
  description = "Description for the Lambda layer"
  type        = string
}

variable "node_modules_zip_path" {
  description = "Path to the node modules for the Lambda layer"
  type        = string  
}

variable "processor_name" {
  description = "Name of the Lambda processor function"
  type        = string  
}

variable "processor_zip_path" {
  description = "Path to the event dispatcher Lambda function zip"
  type        = string
}

variable "dispatcher_name" {
  description = "Name of the Lambda dispatcher function"
  type        = string
}

variable "dispatcher_zip_path" {
  description = "Path to the event dispatcher Lambda function zip"
  type        = string
}

variable "health_name" {
  description = "Name of the Lambda health function"
  type        = string  
}

variable "health_zip_path" {
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

variable "runtime" {
  description = "Lambda runtime environment"
  type        = string
}

variable "memory_size" {
  description = "Memory size for the Lambda functions"
  type        = number
  default     = 256
}

variable "timeout" {
  description = "Timeout for the Lambda functions"
  type        = number
  default     = 30
}
