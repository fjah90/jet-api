resource "aws_acm_certificate" "wildcard" {
  domain_name = local.env == "prod" ? local.principal_domain : "${local.env}.${local.principal_domain}"
  subject_alternative_names = local.env == "prod" ? ["*.${local.principal_domain}"] :  ["*.${local.env}.${local.principal_domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "ACM"
  }
}

resource "aws_acm_certificate_validation" "wildcard" {
  certificate_arn         = aws_acm_certificate.wildcard.arn
  validation_record_fqdns = [for record in aws_route53_record.validation : record.fqdn]
}

resource "aws_acm_certificate" "wildcard_minimal_dev" {
  count            = var.minimal_resources == true && local.env == "prod" ? 1 : 0

  domain_name =  "dev.${local.principal_domain}"
  subject_alternative_names =["*.dev.${local.principal_domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
  tags = {
    Minimal = true,
    Env = local.env
    ServiceType = "ACM"
  }
}

resource "aws_acm_certificate_validation" "wildcard_minimal_dev" {
  count            = var.minimal_resources == true && local.env == "prod" ? 1 : 0

  certificate_arn         = aws_acm_certificate.wildcard_minimal_dev[0].arn
  validation_record_fqdns = [for record in aws_route53_record.validation_minimal_dev : record.fqdn]
}


