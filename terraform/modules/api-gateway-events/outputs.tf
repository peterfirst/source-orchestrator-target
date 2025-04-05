output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.events_api.api_endpoint
}

output "stage_url" {
  description = "API Gateway stage invoke URL"
  value       = aws_apigatewayv2_stage.prod.invoke_url
}

output "api_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.events_api.id
}

output "api_execution_arn" {
  description = "API Gateway ARN"
  value       = aws_apigatewayv2_api.events_api.execution_arn
}