module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name                   = "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
  cluster_version                = var.eks_cluster_version[local.env]
  cluster_endpoint_public_access = true
  create_kms_key                 = true

  cluster_enabled_log_types     = []
  kms_key_description           = "KMS Secrets encryption for EKS cluster on ${local.region} ${local.env}"
  kms_key_enable_default_policy = true
  kms_key_administrators        = [
    local.env == "prod" ? aws_iam_role.devops_admins[0].arn : data.aws_iam_role.devops_admins[0].arn
  ]

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
  }

  vpc_id                   = aws_vpc.main.id
  subnet_ids               = aws_subnet.eks.*.id
  control_plane_subnet_ids = aws_subnet.eks.*.id

  aws_auth_roles = concat(
    [
      {
        # Role used by devops team
        rolearn  = local.env == "prod" ? aws_iam_role.devops_admins[0].arn : data.aws_iam_role.devops_admins[0].arn
        username = "devops-admin"
        groups   = [
          "system:masters"
        ]
      },
    ],
  )

  # EKS Managed Node Group(s)
  eks_managed_node_group_defaults = {
    ami_type       = "AL2_x86_64"
    disk_size      = 20
    instance_types = ["m1.xlarge", "m4.xlarge", "m5.xlarge"]

    #    vpc_security_group_ids = [aws_security_group.]
  }

  eks_managed_node_groups = {
    default = {
      min_size     = 1
      max_size     = 10
      desired_size = 2

      instance_types         = ["m1.xlarge", "m4.xlarge", "m5.xlarge"]
      capacity_type          = "SPOT"
      autoscaling_group_tags = {
        "k8s.io/cluster-autoscaler/enabled" : true,
        "k8s.io/cluster-autoscaler/${module.eks.cluster_name}" : "owned",
      }
      iam_role_additional_policies = {
        AmazonEC2RoleforSSM            = data.aws_iam_policy.AmazonEC2RoleforSSM.arn
        AutoScalingFullAccess          = data.aws_iam_policy.AutoScalingFullAccess.arn
        AWSCertificateManagerReadOnly  = data.aws_iam_policy.AWSCertificateManagerReadOnly.arn
        ElasticLoadBalancingFullAccess = data.aws_iam_policy.ElasticLoadBalancingFullAccess.arn
        CloudWatchAgentServerPolicy    = data.aws_iam_policy.CloudWatchAgentServerPolicy.arn
        ECRRead                        = aws_iam_policy.eks_ecr_read.arn
      }
    }
  }

  node_security_group_additional_rules = {
    allow_all_node_to_node = {
      description = "Allow all traffic between Nodes"
      type        = "ingress"
      from_port   = 0
      to_port     = 0
      protocol    = "all"
      self        = true
    }
    allow_all_public_lb = {
      description              = "Allow all traffic from Public LoadBalancer"
      type                     = "ingress"
      from_port                = 0
      to_port                  = 0
      protocol                 = "all"
      source_security_group_id = aws_security_group.lb_public.id
    }
  }
  tags = {
    Minimal     = false,
    Env         = local.env
    ServiceType = "Computing"
  }
}

resource "aws_autoscaling_attachment" "autoscaling_attachment" {
  count                  = length(module.eks.eks_managed_node_groups_autoscaling_group_names)
  autoscaling_group_name = module.eks.eks_managed_node_groups_autoscaling_group_names[count.index]
  lb_target_group_arn    = aws_lb_target_group.public_http.arn
  depends_on             = [module.eks]
}

#resource "kubernetes_annotations" "default_storageclass" {
#  api_version = "storage.k8s.io/v1"
#  kind        = "StorageClass"
#  force       = "true"
#
#  metadata {
#    name = "gp2"
#  }
#  annotations = {
#    "storageclass.kubernetes.io/is-default-class" = "false"
#  }
#} cache.t4g.micro dev cache.t4g.medium prod
