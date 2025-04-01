variable "rule_name" {
  description = "The name of the EventBridge rule"
  type        = string
}

variable "rule_description" {
  description = "The description of the EventBridge rule"
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

variable "account_id" {
  description = "AWS account ID"
  type        = string
}
