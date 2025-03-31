resource "aws_iam_role" "lambda_role" {
  name = "${var.name_prefix}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [var.queue_arn, var.dlq_arn]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = var.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_lambda_function" "event_processor" {
  filename         = var.processor_zip_path
  function_name    = "${var.name_prefix}-processor"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  
  memory_size     = 256
  timeout         = 30

  environment {
    variables = {
      TABLE_NAME = var.table_name
      QUEUE_URL = var.queue_url
    }
  }

  tags = var.common_tags
}

resource "aws_lambda_function" "event_dispatcher" {
  filename         = var.dispatcher_zip_path
  function_name    = "${var.name_prefix}-dispatcher"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  
  memory_size     = 256
  timeout         = 30

  environment {
    variables = {
      TABLE_NAME = var.table_name
      TARGET_GRAPHQL_URL = var.target_graphql_url
    }
  }

  tags = var.common_tags
}

resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  event_source_arn = var.queue_arn
  function_name    = aws_lambda_function.event_dispatcher.arn
  batch_size       = 10
  maximum_batching_window_in_seconds = 5
}