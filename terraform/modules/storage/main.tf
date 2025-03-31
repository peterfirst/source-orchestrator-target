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

  tags = var.common_tags
}