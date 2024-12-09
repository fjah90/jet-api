locals {
  grafana_account_id = "008923505280"
}

resource "aws_iam_role" "devops_admins" {
  count              = local.env == "prod"? 1 : 0
  name               = "devops-admins"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "iam.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "IAM"
  }
}

resource "aws_iam_role_policy_attachment" "devops_admins_administrator" {
  count      = local.env == "prod"? 1 : 0
  role       = aws_iam_role.devops_admins[0].name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_policy" "eks_ecr_read" {
  name   = "${local.shortname}-ecr-read-${local.env}"
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:GetLifecyclePolicy",
          "ecr:GetLifecyclePolicyPreview",
          "ecr:ListTagsForResource",
          "ecr:DescribeImageScanFindings",
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "IAM"
  }
}

resource "aws_iam_policy" "ecr_write" {
  name   = "${local.shortname}-ecr-write-${local.env}"
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "IAM"
  }
}

resource "aws_iam_role" "cluster_autoscaler" {
  name               = "${local.shortname}-cluster-autoscaler-${local.env}"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRoleWithWebIdentity"
        Effect    = "Allow"
        Sid       = ""
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Condition = {
          StringEquals = {
            "${module.eks.oidc_provider}:sub" : "system:serviceaccount:infra-${local.env}:cluster-autoscaler"
          }
        }
      },
    ]
  })
  inline_policy {
    name   = "${local.shortname}-cluster-autoscaler"
    policy = jsonencode({
      Version   = "2012-10-17"
      Statement = [
        {
          Action = [
            "autoscaling:DescribeAutoScalingGroups",
            "autoscaling:DescribeAutoScalingInstances",
            "autoscaling:DescribeLaunchConfigurations",
            "autoscaling:DescribeTags",
            "autoscaling:SetDesiredCapacity",
            "autoscaling:TerminateInstanceInAutoScalingGroup",
            "ec2:DescribeLaunchTemplateVersions"
          ]
          Effect   = "Allow"
          Resource = "*"
        }
      ]
    })
  }
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "IAM"
  }
}

resource "aws_iam_user" "cd" {
  count = local.env == "prod" ? 1 : 0
  name  = "bitbucket-user"
  path  = "/"


  tags = {
    Name = "Bitbucket User"
    Minimal = false,
    Env = local.env
    ServiceType = "IAM"
  }
}

resource "aws_iam_access_key" "cd" {
  count = local.env == "prod" ? 1 : 0
  user  = aws_iam_user.cd[0].name
}

resource "aws_iam_user_policy_attachment" "ecr_policy_attachment" {
  count      = local.env == "prod" ? 1 : 0
  user       = aws_iam_user.cd[0].name
  policy_arn = aws_iam_policy.ecr_write.arn
}

##Grafana

data "aws_iam_policy_document" "trust_grafana" {
  count = local.env == "prod" ? 1 : 0
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.grafana_account_id}:root"]
    }
    actions = ["sts:AssumeRole"]
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.grafana_external_id]
    }
  }
}

resource "aws_iam_role" "grafana_labs_cloudwatch_integration" {
  count              = local.env == "prod" ? 1 : 0
  name               = var.grafana_iam_role_name
  description        = "Role used by Grafana CloudWatch integration."
  # Allow Grafana Labs' AWS account to assume this role.
  assume_role_policy = data.aws_iam_policy_document.trust_grafana[0].json

  # This policy allows the role to discover metrics via tags and export them.
  inline_policy {
    name   = var.grafana_iam_role_name
    policy = jsonencode({
      Version   = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "tag:GetResources",
            "cloudwatch:GetMetricData",
            "cloudwatch:ListMetrics",
            "apigateway:GET",
            "aps:ListWorkspaces",
            "autoscaling:DescribeAutoScalingGroups",
            "dms:DescribeReplicationInstances",
            "dms:DescribeReplicationTasks",
            "ec2:DescribeTransitGatewayAttachments",
            "ec2:DescribeSpotFleetRequests",
            "storagegateway:ListGateways",
            "storagegateway:ListTagsForResource"
          ]
          Resource = "*"
        }
      ]
    })
  }
  tags = {
    Minimal = false,
    Env = local.env
    ServiceType = "IAM"
  }
}

