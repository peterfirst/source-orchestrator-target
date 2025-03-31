# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "event_processor_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Event Processor Lambda
resource "aws_lambda_function" "event_processor" {
  filename         = "../../../dist/handlers/eventProcessor.zip"
  function_name    = "event-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "eventProcessor.handler"
  runtime         = "nodejs18.x"
  timeout         = 30

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.event_queue.url
      TABLE_NAME = aws_dynamodb_table.events.name
    }
  }
}

# Event Dispatcher Lambda
resource "aws_lambda_function" "event_dispatcher" {
  filename         = "../../../dist/handlers/eventDispatcher.zip"
  function_name    = "event-dispatcher"
  role            = aws_iam_role.lambda_role.arn
  handler         = "eventDispatcher.handler"
  runtime         = "nodejs18.x"
  timeout         = 60

  environment {
    variables = {
      QUEUE_URL = aws_sqs_queue.event_queue.url
      TABLE_NAME = aws_dynamodb_table.events.name
      TARGET_GRAPHQL_URL = var.target_graphql_url
    }
  }
}