variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "billing_mode" {
  description = "Billing mode for DynamoDB table"
  type        = string
  default     = "PAY_PER_REQUEST"
}