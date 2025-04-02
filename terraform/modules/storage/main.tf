resource "aws_dynamodb_table" "events" {
  name           = "${var.name_prefix}-events"
  billing_mode   = var.billing_mode
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "payload"
    type = "M"
  }

  stream_enabled  = true
  stream_view_type = "NEW_IMAGE"

  tags = var.common_tags
}