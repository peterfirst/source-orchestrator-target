output "eventbridge_rule_arn" {
  value = aws_cloudwatch_event_rule.dynamodb_stream_to_sqs_rule.arn
}