data "aws_caller_identity" "current" {}

data "aws_iam_policy" "AmazonEC2RoleforSSM" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
}

data "aws_iam_policy" "AutoScalingFullAccess" {
  arn = "arn:aws:iam::aws:policy/AutoScalingFullAccess"
}

data "aws_iam_policy" "AWSCertificateManagerReadOnly" {
  arn = "arn:aws:iam::aws:policy/AWSCertificateManagerReadOnly"
}

data "aws_iam_policy" "ElasticLoadBalancingFullAccess" {
  arn = "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess"
}

data "aws_iam_policy" "CloudWatchAgentServerPolicy" {
  arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

data "aws_iam_role" "devops_admins" {
  count = local.env == "dev" ? 1 : 0
  name = "devops-admins"
}

data "aws_route53_zone" "main" {
  name = "${local.principal_domain}."
}