resource "aws_ecr_repository" "main" {
  count                = local.env == "prod" ? 1 : 0
  name                 = "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "common"
  }
}