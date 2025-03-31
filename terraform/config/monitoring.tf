locals {
  name_prefix = "${var.project_prefix}-${var.environment}"
}

module "monitoring" {
  source = "../modules/monitoring"

  name_prefix = local.name_prefix
  aws_region  = var.aws_region
  common_tags = local.common_tags

  lambda_function_names = {
    processor  = module.event_processor.processor_function_name
    dispatcher = module.event_processor.dispatcher_function_name
  }
  
  queue_name = module.queue.queue_name
  dlq_name   = module.queue.dlq_name
}

# Remove duplicate alarms from main.tf as they're now in the monitoring module