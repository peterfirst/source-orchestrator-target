resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", var.lambda_function_names.dispatcher],
            ["AWS/Lambda", "Errors", "FunctionName", var.lambda_function_names.dispatcher],
            ["AWS/Lambda", "Duration", "FunctionName", var.lambda_function_names.dispatcher]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Dispatcher Metrics"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", var.queue_name],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.queue_name],
            ["AWS/SQS", "ApproximateAgeOfOldestMessage", "QueueName", var.queue_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "SQS Queue Metrics"
        }
      }
    ]
  })
}

resource "aws_sns_topic" "alerts" {
  name = "${var.name_prefix}-alerts"
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period             = 300
  statistic          = "Sum"
  threshold          = 0
  alarm_description  = "Lambda function error rate monitor"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = var.lambda_function_names.dispatcher
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.name_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period             = 300
  statistic          = "Average"
  threshold          = 0
  alarm_description  = "DLQ messages monitor"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = var.dlq_name
  }
}