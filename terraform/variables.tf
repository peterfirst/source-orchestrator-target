variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "chalhoub"
}

variable "aws_region" {
  description = "AWS region for the provider"
  type        = string
  default     = "us-east-1"
}

variable "target_graphql_url" {
  description = "URL of the target GraphQL API"
  type        = string
  default     = "http://ec2-13-218-254-77.compute-1.amazonaws.com:8080/graphql"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_layer_description" {
  description = "Description for the Lambda layer"
  type        = string
  default     = "Node.js modules layer"
}

variable "lambda_memory_size" {
  description = "Memory size for the Lambda functions"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for the Lambda functions"
  type        = number
  default     = 30
}

variable "lamda_dispatcher_name" {
  description = "Name of the Lambda dispatcher function"
  type        = string
  default     = "dispatcher"
}

variable "lambda_processor_name" {
  description = "Name of the Lambda processor function"
  type        = string
  default     = "processor"

}

variable "lambda_health_name" {
  description = "Name of the Lambda health function"
  type        = string
  default     = "health"
}

variable "lambda_authorizer_name" {
  description = "Name of the Lambda authorizer function"
  type        = string
  default     = "authorizer"
}

variable "api_key" {
  description = "API key for the API Gateway"
  type        = string
  default     = ""
}