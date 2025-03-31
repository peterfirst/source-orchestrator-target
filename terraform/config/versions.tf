terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "chaloub-be-peter-tfstate"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "chaloub-be-peter-terraform-locks"
    encrypt        = true
    kms_key_id     = "alias/terraform-bucket-key"
  }
}