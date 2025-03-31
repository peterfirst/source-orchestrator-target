resource "aws_dynamodb_table" "events" {
  name           = "${var.name_prefix}-events"
  billing_mode   = var.billing_mode
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name               = "status-timestamp-index"
    hash_key          = "status"
    range_key         = "timestamp"
    projection_type    = "ALL"
  }

  ttl {
    attribute_name = "expiryTime"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.common_tags
}