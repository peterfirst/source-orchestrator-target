resource "aws_sqs_queue" "dlq" {
  name = "${var.name_prefix}-dlq"
  message_retention_seconds = 1209600  # 14 days
  tags = var.common_tags
  
  sqs_managed_sse_enabled = true
}

resource "aws_sqs_queue" "main" {
  name = "${var.name_prefix}-events"
  message_retention_seconds = 1209600  # 14 days
  visibility_timeout_seconds = 300     # 5 minutes
  delay_seconds = 0
  max_message_size = 262144          # 256 KB
  receive_wait_time_seconds = 20     # Enable long polling
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
  
  tags = var.common_tags
  sqs_managed_sse_enabled = true
}

resource "aws_sqs_queue_policy" "main" {
  queue_url = aws_sqs_queue.main.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.allowed_principal_arns
        }
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.main.arn
      }
    ]
  })
}
