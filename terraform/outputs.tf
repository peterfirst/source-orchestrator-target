output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway_events.api_endpoint
}

output "api_stage_url" {
  description = "API Gateway stage URL"
  value       = module.api_gateway_events.stage_url
}

output "lambda_functions" {
  description = "Lambda function details"
  value = {
    dispatcher = {
      name = module.lambda_functions.dispatcher_function_name
      arn  = module.lambda_functions.dispatcher_function_arn
    }
  }
}

output "queues" {
  description = "SQS queue details"
  value = {
    main = {
      url = module.sqs_events.queue_url
      arn = module.sqs_events.queue_arn
    }
    dlq = {
      url = module.sqs_events.dlq_url
      arn = module.sqs_events.dlq_arn
    }
  }
}

output "dynamodb_table" {
  description = "DynamoDB table details"
  value = {
    name = module.dynamodb_events.table_name
    arn  = module.dynamodb_events.table_arn
  }
}

output "monitoring" {
  description = "Monitoring configuration details"
  value = {
    dashboard_url   = module.cloudwatch_monitoring.dashboard_url
    alert_topic_arn = module.cloudwatch_monitoring.alert_topic_arn
    alarms = {
      lambda_errors = module.cloudwatch_monitoring.lambda_error_alarm_arn
      dlq_messages  = module.cloudwatch_monitoring.dlq_alarm_arn
    }
  }
}