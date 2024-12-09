variable "vpc_cidr" {
  description = "VPC CIDR Blocks for VPC"
  default     = {
    dev  = "10.20.0.0/16"
    qa   = "10.21.0.0/16"
    prod = "10.23.0.0/16"
  }
}

variable "eks_cidr_blocks" {
  description = "The CIDR blocks for each EC2 subnet to be created"
  default     = {
    dev = [
      "10.20.0.0/24",
      "10.20.1.0/24",
      "10.20.2.0/24"
    ]
    qa = [
      "10.21.0.0/24",
      "10.21.1.0/24",
      "10.21.2.0/24"
    ]
    prod = [
      "10.23.0.0/24",
      "10.23.1.0/24",
      "10.23.2.0/24"
    ]
  }
}

variable "elb_cidr_blocks" {
  description = "The CIDR blocks for each NAt Gateway subnet to be created"
  default     = {

    dev  = ["10.20.11.0/24", "10.20.12.0/24", "10.20.13.0/24"]
    qa   = ["10.21.11.0/24", "10.21.12.0/24", "10.21.13.0/24"]
    prod = ["10.23.11.0/24", "10.23.12.0/24", "10.23.13.0/24"]
  }
}

variable "natgw_cidr_blocks" {
  description = "The CIDR blocks for each NAt Gateway subnet to be created"
  default     = {

    dev  = ["10.20.21.0/24", "10.20.22.0/24", "10.20.23.0/24"]
    qa   = ["10.21.21.0/24", "10.21.22.0/24", "10.21.23.0/24"]
    prod = ["10.23.21.0/24", "10.23.22.0/24", "10.23.23.0/24"]
  }
}

variable "db_cidr_blocks" {
  description = "The CIDR blocks for each NAt Gateway subnet to be created"
  default     = {

    dev  = ["10.20.31.0/24", "10.20.32.0/24", "10.20.33.0/24"]
    qa   = ["10.21.31.0/24", "10.21.32.0/24", "10.21.33.0/24"]
    prod = ["10.23.31.0/24", "10.23.32.0/24", "10.23.33.0/24"]
  }
}

variable "availability_zones_ids" {
  description = "Availability zones"
  type        = map(map(list(string)))
  default     = {
    us-east-1 = {
      dev = [
        "use1-az4",
        "use1-az6",
        "use1-az1",
        "use1-az5"
      ]
      qa = [
        "use1-az4",
        "use1-az6",
        "use1-az1",
        "use1-az5"
      ]
      prod = [
        "use1-az4",
        "use1-az6",
        "use1-az1",
        "use1-az5"
      ]
    }
    eu-west-1 = {
      dev = [
        "euw1-az1",
        "euw1-az2",
        "euw1-az3"
      ]
      qa = [
        "euw1-az1",
        "euw1-az2",
        "euw1-az3"
      ]
      prod = [
        "euw1-az1",
        "euw1-az2",
        "euw1-az3"
      ]
    }
    us-west-2 = {
      dev = [
        "usw2-az1",
        "usw2-az2",
        "usw2-az3"
      ]
      qa = [
        "usw2-az1",
        "usw2-az2",
        "usw2-az3"
      ]
      prod = [
        "usw2-az1",
        "usw2-az2",
        "usw2-az3"
      ]
    }
    ap-northeast-1 = {
      dev = [
        "apne1-az1",
        "apne1-az2",
        "apne1-az4"
      ]
      qa = [
        "apne1-az1",
        "apne1-az2",
        "apne1-az4"
      ]

      prod = [
        "apne1-az1",
        "apne1-az2",
        "apne1-az4"
      ]
    }
  }
}

variable "ipv6_subnet_prefixes" {
  default = {
    eu-west-1 = {
      dev     = [1, 2, 3, 4]
      qa      = [1, 2, 3, 4]
      release = [1, 2, 3, 4]
      prod    = [1, 2, 3, 4]
    }
    us-east-1 = {
      dev     = [1, 2, 3, 4]
      qa      = [1, 2, 3, 4]
      release = [1, 2, 3, 4]
      prod    = [1, 2, 3, 4]
    }
    us-west-2 = {
      dev     = [1, 2, 3, 4]
      qa      = [1, 2, 3, 4]
      release = [1, 2, 3, 4]
      prod    = [1, 2, 3, 4]
    }
    ap-northeast-1 = {
      dev     = [1, 2, 3, 4]
      qa      = [1, 2, 3, 4]
      release = [1, 2, 3, 4]
      prod    = [1, 2, 3, 4]
    }
  }
}

variable "alb_deregistration_delay" {
  description = "Amount time for ALB to wait before changing the state of a deregistering target from draining to unused"
  type        = map(number)
  default     = {
    dev     = 0
    qa      = 0
    release = 0
    prod    = 120
  }
}

variable "k8s_argocd_endpoint" {

}

variable "k8s_argocd_token" {

}

variable "k8s_argocd_ca" {

}

variable "repo_ssh_key_base64" {

}

variable "ingress_nginx_chart_version" {
  default = {
    dev     = "4.6.1"
    qa      = "4.6.1"
    release = "4.6.1"
    prod    = "4.6.1"
  }
}

variable "metrics_chart_version" {
  default = {
    dev     = "3.10.0"
    qa      = "3.10.0"
    release = "3.10.0"
    prod    = "3.10.0"
  }
}

variable "cluster_autoscaler_chart_version" {
  default = {
    dev     = "9.28.0"
    qa      = "9.28.0"
    release = "9.28.0"
    prod    = "9.28.0"
  }
}


variable "ebs_csi_driver_chart_version" {
  default = {
    dev     = "2.18.0"
    qa      = "2.18.0"
    release = "2.18.0"
    prod    = "2.18.0"
  }
}

variable "efs_csi_driver_chart_version" {
  default = {
    dev     = "2.4.1"
    qa      = "2.4.1"
    release = "2.4.1"
    prod    = "2.4.1"
  }
}


variable "argo_rollouts_chart_version" {
  default = {
    dev     = "2.28.0"
    qa      = "2.28.0"
    release = "2.28.0"
    prod    = "2.28.0"
  }
}

variable "promtail_chart_version" {
  default = {
    dev     = "6.11.3"
    qa      = "6.11.3"
    release = "6.11.3"
    prod    = "6.11.3"
  }
}

variable "promtail_url" {

}

variable "prometheus_chart_version" {
  default = {
    dev     = "22.0.29"
    qa      = "22.0.29"
    release = "22.0.29"
    prod    = "22.0.29"
  }
}
variable "prometheus_remote_write" {
  default = {
    dev = {
      password = "AgBveFwfsgoUdeCECvxfWWsSlF7FKL5dp2Y+K2BQegJmX01TRAMLSmVaMNVkWLG7sLlSJmWyVd9eIplHRJaaXtN/XMPk1XSb5OlT/uUox0gjP+BrUywCFYazL+cWbbW307hmyO4P6//HMHPaCndNcDEbHH/7CYAT3Sti/iaTCJqSANI/EXx0Fm13id7khkgRs3j1Hwi8cZ4DsOsToqQLE9T7VwXwp92mCnBL66RV+nGxsk6qlUAMgH9qOxi5HFVfLmavgDLaLQW0I4+u+Z2ZqaBVf1mxUKMwkRzyn/RhhM0KqOqiXJT2KdAaxH4yTqesEjvKKnv4GiN+qWetohKfrXBBE5cE88NUQtijBHoWYywPmPdGUk473aITrTEExEne7Jq22H2xbs/vBLH9sXCCUIvzbTzlTysAG8W6CeFO0hNSXdrl7q3d+YCopARjjHDQr/ETU6xWG2407SjySHLVfoA950OzM8BAW2CVC8xcb/zWQFGk6AJdMnsKxT3TvgzRmeooac6NU0tA+yh2zcYCwiooEbYho8tZAVxTUh+v6T8csaCoXhr4E44IcvXWlb4jQBuCSUHUoAy+AmUv8j5/yuTkfKbV067+HJGQRYbHijfwHkWa2CvJgFAvUTsbSvbx8BHG9iRhLOOdGkKWprHxYca/MlEaH5CmLzXUFi6LyXxhCKoW6M4GWG3hJe4IGKgNQI2CjasAw86PtAYGrVP7lH0U//O7BGV3cF40KtKK1pLm6q0uyVM5HIQ3x4JfyvHUKAhH1quDy+pvE36+Uk6NoEJyKQE6iI7U+8sHA5KQHFnedcOOCFleTRMy00uyN4/zWNQdhiSEGaLlfQ=="
      username = "AgBQ/ff7s6VNmRVyXAmgbh9QMTlEYa8MNSSDWyzCMxRIeA1yqJVFSISUOhk3JJjmmJETcPIpTTPq92vffWM+wIckumYfW88vi0HyHngSSBXw3ozpwBMPDmtMkPDsfj7bRwGn2u5wKZzDASNrTzeCxj6xRVuEvNKrCi6U6xSzG4304gYaN1PKHd1IV/MWMJ43+Q0KxSoCP+eyYNrQesEfFyDrnCLjSCBAT9Ycge2mLePPNehYqwAehw0Doo7aEADI+A+KXg8+8pSa9V1G7uDsILWo4O3kVDcNDMSgJC+UzoZXXuBThrot+Dlj6KgHQAMt+TEjhmgVWy8iiXpM2P3y642PB9w5ZpTCPWsaAMT8hvjuITxGuGOn4BqUXA1/apV8NlsK1Dcui+YhZROxy6uql1PgA1CEwlM7DK3rm2e1Q+wmFdIOrwRK9dLYDYfLr7sMHBYnRQVxsduwvMLdTX62eA3YnP3uvhc666gq7ufGcCxjGQOVmFvzK9AqBkz3SIFCe0NIHVnTPg1NM4S7AJEW7zoAFzbHA2fAoJTacmXhStUNYjiFvFPh1+J8X9HkSmVnZ5V3Y9JKJcf/cqyy/6hd2o3uq5bDMyYF3g3IzvNvrkMVFL1eDu1JFEqnprjEIQPNOZogpv+zB+KKRJMOEHvrAtiqMhBnDVnG/IfJ4HKN/mP+cVzmwDJ248it7ak/gEE2KajpKScQ/roF"
    }
    prod = {
      password = "AgA14iY9GpbBHTPLIplDlSlot9RMaFoy1mRBZ4QhF0N7ISNf8T+ke9kgFiAkpbEZs3pQCMUxvEMo3TDUf78IaTXXK4bLpCETCDBgIAK+tFySdNIaW7hTVMUMTWzQvZrrU6ExLJ1mLjEXDRAO8VHRjsm2/93yXTZbJyumudxxN1DZ6xBja1BlDkZfKDIEBIzJOpbpNNsVx+/+lnjxpXgUhePjr6N1a7/Vuf9p+9Ham7j208qebQTsWEtRBwnW9JV0HwwjW33PIKC/j5t6vVWdaCWZc1Cn62zugCMC0VoIlpyIUqTXzOAZtpkamSuL9Oyr9iRsS3IK2NqvvmbBvJqWfC4U4xEkj3LU9prwb7nUN7wGo4gGtLCum5y5v5DmjlOJshlvYI3IcAA1xiYClmasFVegMmG4fuoR8eLzvl1sLLJKDVkV/ZsugmA/Eig9QTuUxXrZOf+vqydVT9viLHJFttd7p1mf98DPyoXyBzwdYimuMYccATcR9kAFQ7iCvmbSGiV1gizvWWyB4oB9OU9fS1Gvun7s8EIK4qZ3X95VQYdKtLKu6nJJ/44xu7o7FTsYt4JsWLgvK3LOoclXewpnJYM5gklE3sBAdl+jmSqy4s8dDA7umbiUAKbGuU5zU+GoYPixPrgwcuW6wbADYE765YycR1Q8FSx2/amuvNG6zrRavqaCCDdolVhWk1svWKELGGNnT7+CIVclWeuzHCHhIc3MYnXqBnOge6FdtRVlaQ3ndYtI2LV5MwfCpF24T95dGhLG9G2lwJcpMHfymxhuvliIlR8B5porxQVNyTwuCJrcudsMItBzcc4frA5GfRxbEtkoE9LOGMo0Fg=="
      username = "AgCvWuOnQfAXtLFMqZKaCj8B1NL9W4klbCG2cFOqeWHydXeo3OLjkOT61wDxtsVGAaF7sr973SYFSVKscReirfPgeXLzRB0Bk4dGLQxNGklQcBwTHXrvkgVPSbvYcGOK3MVSzworIG287xh4PIDNI22pBf9cwI1GS7WAc9TBh8CpGoYCvPDe7urMdUrtgvIbLU/ZjKNsyUlLXJv77G2jAqQYjj4t50OoKLSXf6tqEwZ+Bbb964TZ3LYLYK1ce+IhmNF96Q2rlMuDVo9CE+Cv1SAW4QEuq6tJ/S4INNqhhN+hzivcxD5SfdDbIqoqwHk9MgKhbNbnqeevI7SUg7wjCWIJLMiktSCfSRmxc0l1go7UBKLyNwFv7Cr4XBMH3HjYfrT3swBT5qv88HlDvjnwoWIKAgyWx0ndoaxZqTfVhjXn88IiNvfiVgpeJfXQZkeMYiYOh2LYzoohtBkDby0az05BRofP/x9ncu91bIsgDae1mJHMekSjea2no2MOY8/AkUZhDWwnzlN2AF/c8IIAKKIEGXqkGFP5fj/j6NpRLv115tsUX+ugvnsTF2sf51rdMFc3o4zaSM0KP7Zj+JFwC/p4oQpKbBgbPk7F/Bpp03ZL+9l7kC3KhviLGGsiSzyXAprVvN51Yp7iOjMCQpPzVcnp+fJCFTAwZPMszZG9V/WGChnJP3gWcbEl7JuUEViNyQmTjoDwHyoq"

    }
  }
}

variable "eks_cluster_version" {
  default = {
    dev     = "1.27"
    qa      = "1.27"
    release = "1.27"
    prod    = "1.27"
  }
}

variable "grafana_external_id" {
  type        = string
  description = "This is your Grafana Cloud identifier and is used for security purposes."
  default     = "1043857"

}

variable "grafana_iam_role_name" {
  type        = string
  default     = "GrafanaLabsCloudWatchIntegration"
  description = "Customize the name of the IAM role used by Grafana for the CloudWatch integration."
}

variable "minimal_resources" {
  default = true
}