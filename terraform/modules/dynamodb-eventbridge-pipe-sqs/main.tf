resource "aws_pipes_pipe" "dynamodb_pipe" {
  name     = "${var.name_prefix}-${var.pipe_name}"
  description = var.pipe_description
  role_arn = aws_iam_role.pipe_role.arn
  source   = var.dynamodb_stream_arn
  target   = var.sqs_queue_arn
  source_parameters {
    dynamodb_stream_parameters {
      starting_position = "LATEST"
    }
  }
}

resource "aws_iam_role" "pipe_role" {
  name = "${var.name_prefix}-${var.pipe_name}-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "pipes.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "pipe_policy" {
  role = aws_iam_role.pipe_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = var.dynamodb_stream_arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = var.sqs_queue_arn
      }
    ]
  })
}

