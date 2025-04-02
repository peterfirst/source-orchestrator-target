output "queue_name" {
  description = "name of the main queue"
  value = aws_sqs_queue.main.name
}

output "queue_url" {
  description = "URL of the main SQS queue"
  value       = aws_sqs_queue.main.id
}

output "queue_arn" {
  description = "ARN of the main SQS queue"
  value       = aws_sqs_queue.main.arn
}

output "dlq_name" {
  description = "Name og the dlq queue"
  value = aws_sqs_queue.dlq.name
}

output "dlq_url" {
  description = "URL of the main SQS queue"
  value       = aws_sqs_queue.dlq.id
}

output "dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.dlq.arn
}
