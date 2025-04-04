variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "pipe_name" {
  description = "The name of the EventBridge pipe"
  type        = string
}

variable "pipe_description" {
  description = "The description of the EventBridge pipe"
  type        = string
}

variable "dynamodb_stream_arn" {
  description = "The ARN of the DynamoDB Stream"
  type        = string
}

variable "sqs_queue_arn" {
  description = "The ARN of the SQS Queue to send events to"
  type        = string
}
