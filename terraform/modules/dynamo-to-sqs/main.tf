resource "aws_cloudwatch_event_rule" "this" {
  name        = var.rule_name
  description = var.rule_description
  event_pattern = jsonencode({
    "source"        = ["aws.dynamodb"],
    "detail-type"   = ["DynamoDB Stream Record"],
    "resources"     = [var.dynamodb_stream_arn]
  })
}

resource "aws_cloudwatch_event_target" "this" {
  rule      = aws_cloudwatch_event_rule.this.name
  arn       = var.sqs_queue_arn
  target_id = "sqs-target"
}
