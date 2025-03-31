output "processor_function_name" {
  description = "Name of the event processor Lambda function"
  value       = aws_lambda_function.event_processor.function_name
}

output "processor_function_arn" {
  description = "ARN of the event processor Lambda function"
  value       = aws_lambda_function.event_processor.arn
}

output "processor_invoke_arn" {
  description = "Invoke ARN of the event processor Lambda function"
  value       = aws_lambda_function.event_processor.invoke_arn
}

output "dispatcher_function_name" {
  description = "Name of the event dispatcher Lambda function"
  value       = aws_lambda_function.event_dispatcher.function_name
}

output "dispatcher_function_arn" {
  description = "ARN of the event dispatcher Lambda function"
  value       = aws_lambda_function.event_dispatcher.arn
}

output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_role.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_role.name
}