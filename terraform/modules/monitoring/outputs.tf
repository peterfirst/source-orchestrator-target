output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alert_topic_arn" {
  description = "ARN of the SNS alert topic"
  value       = aws_sns_topic.alerts.arn
}

output "lambda_error_alarm_arn" {
  description = "ARN of the Lambda error alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_errors.arn
}

output "dlq_alarm_arn" {
  description = "ARN of the DLQ messages alarm"
  value       = aws_cloudwatch_metric_alarm.dlq_messages.arn
}