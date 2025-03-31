variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Prefix for all resource names"
  type        = string
  default     = "chaloub-be-peter"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_prefix))
    error_message = "Project prefix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "target_graphql_url" {
  description = "URL of the target GraphQL API"
  type        = string

  validation {
    condition     = can(regex("^https?://", var.target_graphql_url))
    error_message = "Target GraphQL URL must be a valid HTTP(S) URL."
  }
}