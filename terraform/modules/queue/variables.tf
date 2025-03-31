variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "allowed_principal_arns" {
  description = "List of ARNs allowed to access the SQS queue"
  type        = list(string)
}