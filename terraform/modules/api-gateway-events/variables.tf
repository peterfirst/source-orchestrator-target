variable "name_prefix" {
  description = "Prefix to be used in resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain API Gateway logs"
  type        = number
  default     = 14
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "processor_function_invoke_arn" {
  description = "ARN of the Lambda function to invoke"
  type        = string
}

variable "health_function_invoke_arn" {
  description = "ARN of the Lambda function to invoke"
  type        = string
}

variable "authorizer_function_arn" {
  description = "ARN of the Lambda function to use as an authorizer"
  type        = string
}
