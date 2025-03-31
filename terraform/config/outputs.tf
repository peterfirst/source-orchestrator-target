output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.event_api.api_endpoint
}

output "api_stage_url" {
  description = "API Gateway stage URL"
  value       = aws_apigatewayv2_stage.event_api.invoke_url
}

output "event_processor_lambda_arn" {
  description = "ARN of the event processor Lambda function"
  value       = aws_lambda_function.event_processor.arn
}

output "event_dispatcher_lambda_arn" {
  description = "ARN of the event dispatcher Lambda function"
  value       = aws_lambda_function.event_dispatcher.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB events table"
  value       = aws_dynamodb_table.events.name
}

output "sqs_queue_url" {
  description = "URL of the main SQS queue"
  value       = aws_sqs_queue.event_queue.url
}

output "sqs_dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.event_dlq.url
}

output "archive_bucket_name" {
  description = "Name of the S3 archive bucket"
  value       = aws_s3_bucket.archive.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_groups" {
  description = "Names of all CloudWatch Log Groups"
  value = {
    api          = aws_cloudwatch_log_group.api_logs.name
    processor    = aws_cloudwatch_log_group.event_processor_logs.name
    dispatcher   = aws_cloudwatch_log_group.event_dispatcher_logs.name
  }
}