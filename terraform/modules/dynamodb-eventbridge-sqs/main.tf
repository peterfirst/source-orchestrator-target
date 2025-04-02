resource "aws_cloudwatch_event_rule" "dynamodb_stream_to_sqs_rule" {
  name        = var.rule_name
  description = var.rule_description
  event_pattern = jsonencode({
    "source"        = ["aws.dynamodb"],
    "detail-type"   = ["DynamoDB Stream Record"],
    "resources"     = [var.dynamodb_stream_arn]
  })
}

resource "aws_cloudwatch_event_target" "sqs_target" {
  rule      = aws_cloudwatch_event_rule.dynamodb_stream_to_sqs_rule.name
  arn       = var.sqs_queue_arn
  target_id = var.target_id
}
