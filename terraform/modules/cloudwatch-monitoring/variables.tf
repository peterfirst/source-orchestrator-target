variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "lambda_function_names" {
  description = "Map of Lambda function names to monitor"
  type = object({
    processor = string
    dispatcher = string
  })
}

variable "queue_name" {
  description = "Name of the main SQS queue"
  type        = string
}

variable "dlq_name" {
  description = "Name of the dead letter queue"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}