resource "aws_vpc" "main" {
  cidr_block                       = var.vpc_cidr[local.env]
  instance_tenancy                 = "default"
  enable_dns_hostnames             = true
  assign_generated_ipv6_cidr_block = true

  tags = {
    Name        = "vpc-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
    Minimal     = false,
    Env         = local.env
    ServiceType = "networking"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "internetgw-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
    Minimal     = false,
    Env         = local.env
    ServiceType = "networking"
  }

}

resource "aws_default_route_table" "main" {
  default_route_table_id = aws_vpc.main.default_route_table_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

}