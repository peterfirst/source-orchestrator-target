variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region for the provider"
  type        = string
  default     = "us-east-1"
}

variable "target_graphql_url" {
  description = "URL of the target GraphQL API"
  type        = string
}