locals {
  aws_managed_rules = {

    AWSManagedRulesCommonRuleSet = {
      priority = 10
      vendor   = "AWS"
    }
    AWSManagedRulesKnownBadInputsRuleSet = {
      priority = 20
      vendor   = "AWS"
    }
    AWSManagedRulesAmazonIpReputationList = {
      priority = 30
      vendor   = "AWS"
    }
    AWSManagedRulesAnonymousIpList = {
      priority = 40
      vendor   = "AWS"
    }
    #    AWSManagedRulesSQLiRuleSet = {
    #      priority = 70
    #    vendor = "AWS"

    #    }
    #    AWSManagedRulesLinuxRuleSet = {
    #      priority = 50
    #    vendor = "AWS"

    #    }
    #    AWSManagedRulesUnixRuleSet = {
    #      priority = 60
    #    vendor = "AWS"
    #    }
  }
}

resource "aws_wafv2_regex_pattern_set" "allow_domain" {
  name        = "${local.shortname}-domain-${local.region_shorthand[local.region]}-${local.env}"
  description = "API Domain ${local.env} regex pattern set"
  scope       = "REGIONAL"

  regular_expression {
    regex_string = "${aws_route53_record.api_public.name}/*"
  }
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "WAF"
  }
}

resource "aws_wafv2_web_acl" "this" {
  name  = "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  tags = {
    Name = "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
    Minimal = false,
    Env = local.env
    ServiceType = "WAF"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
    sampled_requests_enabled   = true
  }


  rule {
    name     = "AWSRateBasedRuleDomesticDOS"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"

        scope_down_statement {
          geo_match_statement {
            country_codes = ["JP"]
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSRateBasedRuleDomesticDOS"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSRateBasedRuleGlobalDOS"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 500
        aggregate_key_type = "IP"

        scope_down_statement {
          not_statement {
            statement {
              geo_match_statement {
                country_codes = ["JP"]
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSRateBasedRuleGlobalDOS"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "PreventHostInjections"
    priority = 0

    statement {
      regex_pattern_set_reference_statement {
        arn = aws_wafv2_regex_pattern_set.allow_domain.arn

        field_to_match {
          single_header {
            name = "host"
          }
        }

        text_transformation {
          priority = 0
          type     = "NONE"
        }
      }
    }

    action {
      allow {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "PreventHostInjections-${local.env}"
      sampled_requests_enabled   = true
    }
  }

  dynamic "rule" {
    for_each = local.aws_managed_rules
    content {
      name     = rule.key
      priority = rule.value["priority"]

      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = rule.value["vendor"]

        }
      }
      override_action {
        none {}
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${rule.key}Metric-${local.env}"
        sampled_requests_enabled   = true
      }
    }
  }
}

resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = aws_lb.public.arn
  web_acl_arn  = aws_wafv2_web_acl.this.arn
}
