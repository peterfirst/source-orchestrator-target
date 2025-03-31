variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to be applied to all resources"
  type        = map(string)
}

variable "visibility_timeout" {
  description = "Queue visibility timeout in seconds"
  type        = number
  default     = 30
}

variable "message_retention" {
  description = "Message retention period in seconds"
  type        = number
  default     = 345600 # 4 days
}

variable "delay_seconds" {
  description = "Delay in seconds before delivering messages"
  type        = number
  default     = 0
}

variable "max_message_size" {
  description = "Maximum message size in bytes"
  type        = number
  default     = 262144 # 256 KB
}

variable "receive_wait_time" {
  description = "Long polling wait time in seconds"
  type        = number
  default     = 20
}

variable "max_receive_count" {
  description = "Maximum number of times a message can be received before going to DLQ"
  type        = number
  default     = 3
}

variable "dlq_message_retention" {
  description = "DLQ message retention period in seconds"
  type        = number
  default     = 1209600 # 14 days
}

variable "dlq_visibility_timeout" {
  description = "DLQ visibility timeout in seconds"
  type        = number
  default     = 30
}

variable "allowed_principal_arns" {
  description = "List of ARNs allowed to interact with the queue"
  type        = list(string)
}