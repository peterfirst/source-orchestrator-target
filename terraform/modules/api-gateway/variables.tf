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


variable "dynamodb_table" {
  description = "Dynamodb table name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "Dynamodb arn of the table name"
  type        = string
}
