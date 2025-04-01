resource "aws_dynamodb_table" "events" {
  name           = "${var.name_prefix}-events"
  billing_mode   = var.billing_mode
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "name"
    type = "S"
  }

  attribute {
    name = "body"
    type = "S"
  }  

  attribute {
    name = "timestamp"
    type = "N"
  }

 stream_enabled  = true
 stream_view_type = "NEW_IMAGE"  # You can also use "NEW_AND_OLD_IMAGES" or "OLD_IMAGE"

  tags = var.common_tags
}