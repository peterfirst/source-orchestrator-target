variable "project_prefix" {
  description = "Prefix for all resources"
  type        = string
  default     = "chaloub-be-peter"
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "target_graphql_url" {
  description = "URL of the target GraphQL API"
  type        = string
}

locals {
  common_tags = {
    Project     = "chaloub"
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = "peter"
  }
  
  name_prefix = "${var.project_prefix}-${var.environment}"
}