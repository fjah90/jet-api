locals {
  principal_domain = "iberojet.eu"
}

resource "aws_route53_record" "validation" {

  for_each = {
  for dvo in aws_acm_certificate.wildcard.domain_validation_options : dvo.domain_name => {
    name   = dvo.resource_record_name
    record = dvo.resource_record_value
    type   = dvo.resource_record_type
  }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_route53_record" "validation_minimal_dev" {

  for_each = var.minimal_resources == true && local.env == "prod" ? {
  for dvo in aws_acm_certificate.wildcard_minimal_dev[0].domain_validation_options : dvo.domain_name => {
    name   = dvo.resource_record_name
    record = dvo.resource_record_value
    type   = dvo.resource_record_type
  }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

resource "aws_route53_record" "api_public" {
  zone_id         = data.aws_route53_zone.main.id
  allow_overwrite = true
  name            = local.env != "prod" ? format("api.%s.%s", local.env, local.principal_domain) : format("api.%s", local.principal_domain)
  type            = "A"
  set_identifier  = local.env != "prod" ? format("api.%s.%s", local.env, local.principal_domain) : format("api.%s", local.principal_domain)

  weighted_routing_policy {
    weight = 100
  }

  alias {
    evaluate_target_health = false
    name                   = aws_lb.public.dns_name
    zone_id                = aws_lb.public.zone_id
  }
}

resource "aws_route53_record" "api_public_minimal_dev" {
  count            = var.minimal_resources == true && local.env == "prod" ? 1 : 0

  zone_id         = data.aws_route53_zone.main.id
  allow_overwrite = true
  name            = format("api.%s.%s", "dev", local.principal_domain)
  type            = "A"
  set_identifier  = format("api.%s.%s", "dev", local.principal_domain)

  weighted_routing_policy {
    weight = 100
  }

  alias {
    evaluate_target_health = false
    name                   = aws_lb.public.dns_name
    zone_id                = aws_lb.public.zone_id
  }
}