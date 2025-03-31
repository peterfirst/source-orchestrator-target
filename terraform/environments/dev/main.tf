terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "event-processor-tfstate-dev"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}

# API Gateway
resource "aws_api_gateway_rest_api" "event_api" {
  name = "event-processor-api"
}

# DynamoDB Table
resource "aws_dynamodb_table" "events" {
  name           = "events"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  stream_enabled = true

  attribute {
    name = "id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# SQS Queue
resource "aws_sqs_queue" "event_queue" {
  name = "event-processing-queue"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.event_dlq.arn
    maxReceiveCount     = 3
  })
}

# Dead Letter Queue
resource "aws_sqs_queue" "event_dlq" {
  name = "event-processing-dlq"
}

# S3 Bucket for archived events
resource "aws_s3_bucket" "event_archive" {
  bucket = "event-processor-archive-dev"
}