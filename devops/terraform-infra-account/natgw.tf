resource "aws_eip" "nat_gateway_eip" {
  count = length(aws_subnet.nat_gw.*.id)
  vpc   = true
  tags  =  {
    Name = format("%s-eip-%s-%s",local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
  }
}

resource "aws_nat_gateway" "default" {
  count         = length(aws_subnet.nat_gw.*.id)
  allocation_id = element(aws_eip.nat_gateway_eip.*.id, count.index)
  subnet_id     = element(aws_subnet.nat_gw.*.id, count.index)
  tags  = {
    Name = format("%s-natgw-%s-%s",local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }
}

resource "aws_route_table" "nat_gateway_route_table" {
  count  = length(aws_subnet.nat_gw.*.id)
  vpc_id               = aws_vpc.main.id


  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = element(aws_nat_gateway.default.*.id, count.index)
  }
  tags  = {
    Name = format("%s-route-table-%s-%s",local.shortname, element(var.availability_zones_ids[local.region][local.env], count.index), local.env )
    Minimal = false,
    Env = local.env
    ServiceType = "networking"
  }
}


resource "aws_route_table_association" "eks_subnet_rt" {
  count          = length(aws_subnet.eks.*.id)
  subnet_id      = element(aws_subnet.eks.*.id, count.index)
  route_table_id = element(aws_route_table.nat_gateway_route_table.*.id, count.index)

}