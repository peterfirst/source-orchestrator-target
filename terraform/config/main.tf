// Add KMS key configuration at the beginning after provider block
resource "aws_kms_key" "main" {
  description             = "${local.name_prefix} encryption key"
  deletion_window_in_days = 7
  enable_key_rotation    = true

  tags = merge(local.common_tags, {
    Service = "kms"
  })
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-key"
  target_key_id = aws_kms_key.main.key_id
}

// Update S3 bucket encryption to use KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "archive" {
  bucket = aws_s3_bucket.archive.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

// Add CloudWatch alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "Lambda function error rate monitor"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.event_processor.function_name
  }

  tags = merge(local.common_tags, {
    Service = "cloudwatch"
    Type    = "alarm"
  })
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.name_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "ApproximateNumberOfMessagesVisible"
  namespace          = "AWS/SQS"
  period             = "300"
  statistic          = "Average"
  threshold          = "0"
  alarm_description  = "Messages in DLQ monitor"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.event_dlq.name
  }

  tags = merge(local.common_tags, {
    Service = "cloudwatch"
    Type    = "alarm"
  })
}

// Add WAF for API Gateway
resource "aws_wafv2_web_acl" "api" {
  name        = "${local.name_prefix}-api-waf"
  description = "WAF for API Gateway"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limit"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${local.name_prefix}-rate-limit"
      sampled_requests_enabled  = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "${local.name_prefix}-waf"
    sampled_requests_enabled  = true
  }

  tags = merge(local.common_tags, {
    Service = "waf"
  })
}