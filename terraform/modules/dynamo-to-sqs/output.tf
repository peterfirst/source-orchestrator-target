# Output the EventBridge rule ARN
output "eventbridge_rule_arn" {
  value = aws_cloudwatch_event_rule.this.arn
}