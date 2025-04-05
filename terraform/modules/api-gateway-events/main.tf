resource "aws_apigatewayv2_api" "events_api" {
  name          = "${var.name_prefix}-events-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_origins = ["*"]
  }

  tags = var.common_tags
}

resource "aws_apigatewayv2_stage" "prod" {
  api_id      = aws_apigatewayv2_api.events_api.id
  name        = "prod"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_logs.arn
    format          = jsonencode({
      requestId       = "$context.requestId"
      ip              = "$context.identity.sourceIp"
      caller          = "$context.identity.caller"
      user            = "$context.identity.user"
      requestTime     = "$context.requestTime"
      httpMethod      = "$context.httpMethod"
      resourcePath    = "$context.resourcePath"
      status          = "$context.status"
      protocol        = "$context.protocol"
      responseLength  = "$context.responseLength"
    })
  }  

  tags = var.common_tags
}

resource "aws_iam_policy" "apigateway_logging_policy" {
  name   = "${var.name_prefix}-apigateway-logging-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${var.account_id}:*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "api_logs" {
  name              = "/aws/apigateway/${var.name_prefix}-events-api"
  retention_in_days = var.log_retention_days
  tags             = var.common_tags
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = var.processor_function_invoke_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.events_api.execution_arn}/*/*/events"
}

resource "aws_apigatewayv2_authorizer" "api_key_authorizer" {
  api_id            = aws_apigatewayv2_api.events_api.id
  authorizer_type   = "REQUEST"
  name              = "${var.name_prefix}-api-key-authorizer"
  authorizer_uri    = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions:${var.authorizer_function_arn}/invocations"
  identity_sources = ["$request.header.x-api-key"]
  authorizer_payload_format_version = "2.0"
}

# processor
resource "aws_apigatewayv2_integration" "processor_lambda" {
  api_id                 = aws_apigatewayv2_api.events_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.processor_function_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_event" {
  api_id    = aws_apigatewayv2_api.events_api.id
  route_key = "POST /events"
  target    = "integrations/${aws_apigatewayv2_integration.processor_lambda.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key_authorizer.id
}

# health check
resource "aws_apigatewayv2_integration" "health_lambda" {
  api_id                 = aws_apigatewayv2_api.events_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.health_function_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_health" {
  api_id    = aws_apigatewayv2_api.events_api.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.health_lambda.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.api_key_authorizer.id
}

resource "aws_lambda_permission" "api_gateway_health" {
  statement_id  = "AllowExecutionFromAPIGatewayHealth"
  action        = "lambda:InvokeFunction"
  function_name = var.health_function_invoke_arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.events_api.execution_arn}/*/*/health"
}
