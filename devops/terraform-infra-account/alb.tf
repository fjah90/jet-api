locals {
  nginx = {
    http_port  = "32080"
    https_port = "32443"
  }
}

resource "aws_lb" "public" {
  name               = "${local.shortname}-${local.env}-${local.region_shorthand[local.region]}-nginx"
  load_balancer_type = "application"
  internal           = false
  ip_address_type    = "ipv4"

  #  access_logs {
  #    bucket  = data.aws_s3_bucket.alb_logs.bucket
  #    prefix  = format("%s-public-alb-%s-%s", local.shortname, local.region, local.env)
  #    enabled = true
  #  }

  security_groups = [aws_security_group.lb_public.id]
  subnets         = aws_subnet.elb.*.id
  idle_timeout    = 60

  tags = {
    Minimal     = false,
    Env         = local.env
    ServiceType = "Computing"
  }
}

#resource "aws_lb_listener" "public_http" {
#  load_balancer_arn = aws_lb.public.arn
#  port              = "80"
#  protocol          = "HTTP"
#
#  default_action {
#    type = "redirect"
#
#    redirect {
#      port        = "443"
#      protocol    = "HTTPS"
#      status_code = "HTTP_301"
#    }
#  }
#  tags = {
#    Minimal     = false,
#    Env         = local.env
#    ServiceType = "Computing"
#  }
#}

resource "aws_lb_listener" "public_https" {
  load_balancer_arn = aws_lb.public.arn
  port              = "443"
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate_validation.wildcard.certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.public_http.arn
  }

  tags = {
    Minimal     = false,
    Env         = local.env
    ServiceType = "Computing"
  }
}


resource "aws_lb_target_group" "public_http" {
  name                 = format("%s-public-http-%s-%s", local.shortname, local.region_shorthand[local.region], local.env)
  port                 = local.nginx.http_port
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main.id
  deregistration_delay = var.alb_deregistration_delay[local.env]

  health_check {
    healthy_threshold   = 4
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 10
    path                = "/healthz"
  }
  tags = {
    Minimal     = false,
    Env         = local.env
    ServiceType = "Computing"
  }
}

resource "aws_lb_listener_certificate" "minimal_dev" {
  count           = var.minimal_resources == true && local.env == "prod" ? 1 : 0
  listener_arn    = aws_lb_listener.public_https.arn
  certificate_arn = aws_acm_certificate_validation.wildcard_minimal_dev[0].certificate_arn
}