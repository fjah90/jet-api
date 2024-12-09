terraform {
  backend "s3" {
    bucket         = "tf-state-iberojet-dev"
    key            = "implementations/iberojet-backend"
    region         = "eu-west-1"
#    dynamodb_table = "tf-remote-state-lock"
    profile        = "iberojet-dev"
  }
}


locals {
  name             = "iberojet-backend"
  shortname        = "ibero-back"
  project          = "iberojet-backend"
  main_region      = "eu-west-1"
  env              = element(split("-", terraform.workspace), 0)
  region           = join("-", slice(split("-", terraform.workspace), 1, length(split("-", terraform.workspace))))
  region_shorthand = {
    us-east-1      = "use1"
    us-west-2      = "usw2"
    eu-west-1      = "euw1"
    ap-northeast-1 = "apne1"
  }
  common_tags      = jsondecode(file("../tags.json"))[local.env]

}

provider "aws" {
  profile = "iberojet-${local.env}"
  region  = local.region
  default_tags {
    tags = local.common_tags
  }
}

# Required by eks module
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = [
      "eks", "get-token", "--profile", "iberojet-${local.env}", "--cluster-name",
      module.eks.cluster_name
    ]
  }
}

provider "kubectl" {
  alias                  = "argocd"
  host                   = var.k8s_argocd_endpoint
  token                  = var.k8s_argocd_token
  cluster_ca_certificate = base64decode(var.k8s_argocd_ca)
}
provider "random" {}