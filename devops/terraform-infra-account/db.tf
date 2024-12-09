#resource "aws_elasticache_replication_group" "redis" {
#  replication_group_id       = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
#  description                = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
#  engine                     = "redis"
#  node_type                  = "cache.m4.large"
#  parameter_group_name       = "default.redis7.cluster.on"
#  engine_version             = "7.0"
#  security_group_ids         = [aws_security_group.redis.id]
#  port                       = 6379
#  subnet_group_name          = aws_elasticache_subnet_group.redis.name
#  transit_encryption_enabled = true
#  at_rest_encryption_enabled = true
#  automatic_failover_enabled = true
#  auth_token                 = random_password.redis_token.result
#  num_node_groups            = 2
#  replicas_per_node_group    = 1
#}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
  description                = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
  engine                     = "redis"
  node_type                  = "cache.t4g.medium"
  parameter_group_name       = "default.redis7"
  engine_version             = "7.0"
  security_group_ids         = [aws_security_group.redis.id]
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true
  automatic_failover_enabled = true
  auth_token                 = random_password.redis_token.result
  replicas_per_node_group    = 1
  #  number_cache_clusters      = 1
  multi_az_enabled           = false
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "db"
  }
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
  subnet_ids = aws_subnet.db.*.id
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "db"
  }
}

resource "random_password" "redis_token" {
  length           = 20
  special          = true
  override_special = "'@\"/"
}

resource "random_password" "redis_token_minimal_dev" {
  count            = var.minimal_resources == true && local.env == "prod" ? 1 : 0
  length           = 20
  special          = true
  override_special = "'@\"/"
}

resource "aws_elasticache_replication_group" "redis_minimal_dev" {
  count                      = var.minimal_resources == true && local.env == "prod" ? 1 : 0
  replication_group_id       = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-dev-minimal"
  description                = "db-redis-${local.shortname}-${local.region_shorthand[local.region]}-dev-minimal"
  engine                     = "redis"
  node_type                  = "cache.t4g.micro"
  parameter_group_name       = "default.redis7"
  engine_version             = "7.0"
  security_group_ids         = [aws_security_group.redis.id]
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true
  automatic_failover_enabled = false
  auth_token                 = random_password.redis_token_minimal_dev[0].result
  replicas_per_node_group    = 0
  multi_az_enabled           = false
  tags = {
    Minimal = true,
    Env = "dev"
    ServiceType = "db"
  }
}

#m5.xlarge, m4.xlarge, m5d.xlarge, m5n.xlarge, m5a.xlarge, m6a.xlarge, m6i.xlarge