variable "name_prefix" {
  description = "Prefix to be used in resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "max_capacity" {
  description = "Maximum read/write capacity units"
  type        = number
  default     = 100
}

variable "min_capacity" {
  description = "Minimum read/write capacity units"
  type        = number
  default     = 1
}