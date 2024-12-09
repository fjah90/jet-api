resource "aws_subnet" "eks" {
  count = length(var.eks_cidr_blocks[local.env])

  vpc_id               = aws_vpc.main.id
  cidr_block           = element(var.eks_cidr_blocks[local.env], count.index)
  availability_zone_id = element(var.availability_zones_ids[local.region][local.env], count.index)

  tags = {
    Name = format("%s-eks-subnet-%s-%s", local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
    Type = "eks"
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "nat_gw" {
  count = length(var.natgw_cidr_blocks[local.env])

  vpc_id                  = aws_vpc.main.id
  cidr_block              = element(var.natgw_cidr_blocks[local.env], count.index)
  availability_zone_id    = element(var.availability_zones_ids[local.region][local.env], count.index)
  map_public_ip_on_launch = true

  tags = {
    Name = format("%s-natgw-subnet-%s-%s", local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
    Type = "natgw"
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "elb" {
  count = length(var.elb_cidr_blocks[local.env])

  vpc_id               = aws_vpc.main.id
  cidr_block           = element(var.elb_cidr_blocks[local.env], count.index)
  availability_zone_id = element(var.availability_zones_ids[local.region][local.env], count.index)
  ipv6_cidr_block      = cidrsubnet(aws_vpc.main.ipv6_cidr_block, 8, var.ipv6_subnet_prefixes[local.region][local.env][count.index])

  tags = {
    "kubernetes.io/role/elb" = 1
    "kubernetes.io/role/internal-elb" = 1
    Name = format("%s-alb-subnet-%s-%s", local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
    Type = "elb"
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_subnet" "db" {
  count = length(var.db_cidr_blocks[local.env])

  vpc_id               = aws_vpc.main.id
  cidr_block           = element(var.db_cidr_blocks[local.env], count.index)
  availability_zone_id = element(var.availability_zones_ids[local.region][local.env], count.index)

  tags = {
    Name = format("%s-db-subnet-%s-%s", local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
    Type = "db"
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }

  lifecycle {
    create_before_destroy = true
  }
}

