resource "aws_apigatewayv2_api" "events_api" {
  name          = "${var.name_prefix}-events-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_origins = ["*"]
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.name_prefix}-events-api"
  retention_in_days = var.log_retention_days
  tags             = var.common_tags
}


resource "aws_iam_role" "apigateway_dynamodb_role" {
  name = "${var.name_prefix}-apigateway-dynamodb-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_policy" "apigateway_dynamodb_policy" {
  name   = "${var.name_prefix}-apigateway-dynamodb-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "dynamodb:PutItem"
        Effect   = "Allow"
        Resource = var.dynamodb_table_arn
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "apigateway_dynamodb_attachment" {
  name       = "${var.name_prefix}-apigateway-dynamodb-attachment"
  policy_arn = aws_iam_policy.apigateway_dynamodb_policy.arn
  roles      = [aws_iam_role.apigateway_dynamodb_role.name]
}


resource "aws_apigatewayv2_integration" "dynamodb" {
  api_id                 = aws_apigatewayv2_api.events_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = "arn:aws:apigateway:${var.aws_region}:dynamodb:action/PutItem"
  credentials_arn        = aws_iam_role.apigateway_dynamodb_role.arn
  request_parameters = {
    "integration.request.header.Content-Type" = "application/json"
  }
  request_templates = {
    "application/json" = <<EOF
{
  "TableName": "${var.dynamodb_table}",
  "Item": {
    "id": {
      "S": "$context.requestId"
    },
    "eventData": {
      "S": "$input.body"
    }
  }
}
EOF
  }
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_event" {
  api_id    = aws_apigatewayv2_api.events_api.id
  route_key = "POST /events"
  target    = "integrations/${aws_apigatewayv2_integration.dynamodb.id}"
}