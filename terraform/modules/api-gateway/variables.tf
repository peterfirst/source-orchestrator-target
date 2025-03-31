variable "name_prefix" {
  description = "Prefix to be used in resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "lambda_invoke_arn" {
  description = "ARN of the Lambda function to invoke"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain API Gateway logs"
  type        = number
  default     = 14
}