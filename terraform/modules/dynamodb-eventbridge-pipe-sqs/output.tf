output "pipe_arn" {
  value       = aws_pipes_pipe.dynamodb_pipe.arn
  description = "The ARN of the EventBridge pipe"
}

output "pipe_role_arn" {
  value       = aws_iam_role.pipe_role.arn
  description = "The ARN of the IAM role used by the EventBridge pipe"
}
