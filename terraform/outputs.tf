output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.api_gateway.api_endpoint
}

output "api_stage_url" {
  description = "API Gateway stage URL"
  value       = module.api_gateway.stage_url
}

output "lambda_functions" {
  description = "Lambda function details"
  value = {
    processor = {
      name = module.event_processor.processor_function_name
      arn  = module.event_processor.processor_function_arn
    }
    dispatcher = {
      name = module.event_processor.dispatcher_function_name
      arn  = module.event_processor.dispatcher_function_arn
    }
  }
}

output "queues" {
  description = "SQS queue details"
  value = {
    main = {
      url = module.queue.queue_url
      arn = module.queue.queue_arn
    }
    dlq = {
      url = module.queue.dlq_url
      arn = module.queue.dlq_arn
    }
  }
}

output "dynamodb_table" {
  description = "DynamoDB table details"
  value = {
    name = module.storage.table_name
    arn  = module.storage.table_arn
  }
}

output "monitoring" {
  description = "Monitoring configuration details"
  value = {
    dashboard_url   = module.monitoring.dashboard_url
    alert_topic_arn = module.monitoring.alert_topic_arn
    alarms = {
      lambda_errors = module.monitoring.lambda_error_alarm_arn
      dlq_messages  = module.monitoring.dlq_alarm_arn
    }
  }
}