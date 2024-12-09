resource "aws_security_group" "lb_public" {
  name        = format("%s-public-alb-%s-%s", local.shortname, local.region_shorthand[local.region], local.env)
  vpc_id      = aws_vpc.main.id
  description = format("Security group for %s-public-alb-%s-%s", local.name, local.region_shorthand[local.region], local.env)

  ingress {
    description = "Public ALB - Allow http traffic - Protected by WAF"
    to_port     = 80
    from_port   = 80
    cidr_blocks = ["0.0.0.0/0"]
    protocol    = "tcp"
  }

  ingress {
    description = "Public ALB - Allow https traffic - Protected by WAF"
    to_port     = 443
    from_port   = 443
    cidr_blocks = ["0.0.0.0/0"]
    protocol    = "tcp"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
  tags = {
    Name       = format("%s-public-alb-%s-%s", local.shortname, local.region_shorthand[local.region], local.env)
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }
}

resource "aws_security_group" "redis" {
  name        = format("%s-db-redis-%s-%s", local.shortname, local.region_shorthand[local.region], local.env)
  vpc_id      = aws_vpc.main.id
  description = format("Security group for %s-db-redis-%s-%s", local.name, local.region_shorthand[local.region], local.env)


  ingress {
    security_groups = [module.eks.node_security_group_id]
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = -1
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = format("%s-db-redis-%s-%s", local.shortname, local.region_shorthand[local.region], local.env)
  }

  lifecycle {
    create_before_destroy = true
  }

}



