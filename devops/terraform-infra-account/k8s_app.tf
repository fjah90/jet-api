locals {
  repo_base64 = {
    name          = base64encode("iberojet-backend")
    project       = base64encode("default")
    sshPrivateKey = var.repo_ssh_key_base64
    type          = base64encode("git")
    url           = base64encode("git@bitbucket.org:axtersoftware/iberojet-backend.git")
  }
}

resource "kubectl_manifest" "argocd_repo" {
  count     = local.env == "prod" ? 1 : 0
  provider  = kubectl.argocd
  # language=yaml
  yaml_body = <<YAML
    apiVersion: v1
    kind: Secret
    metadata:
      name: "repo-${local.name}"
      namespace: argocd
      labels:
        argocd.argoproj.io/secret-type: repository
      annotations:
        managed-by: argocd.argoproj.io
    data:
      name: "${local.repo_base64.name}"
      project: "${local.repo_base64.project}"
      sshPrivateKey: "${local.repo_base64.sshPrivateKey}"
      type: "${local.repo_base64.type}"
      url: "${local.repo_base64.url}"
    type: Opaque


  YAML
}
#
resource "kubectl_manifest" "argocd_project_infra" {
  provider  = kubectl.argocd
  # language=yaml
  yaml_body = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: AppProject
    metadata:
      name: "infra-${local.name}-${local.env}"
      namespace: argocd
    spec:
      clusterResourceWhitelist:
        - group: '*'
          kind: '*'
      destinations:
        - name: '*'
          namespace: '*'
          server: https://E8BE2C38B0E751D15000D5FDE4312BF4.gr7.eu-west-1.eks.amazonaws.com
        - name: '*'
          namespace: '*'
          server: https://kubernetes.default.svc
      namespaceResourceWhitelist:
        - group: '*'
          kind: '*'
      sourceRepos:
        - '*'

  YAML
}

resource "kubectl_manifest" "argocd_project_app" {
  provider  = kubectl.argocd
  # language=yaml
  yaml_body = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: AppProject
    metadata:
      name: "${local.name}-${local.env}"
      namespace: argocd
    spec:
      clusterResourceWhitelist:
        - group: '*'
          kind: '*'
      destinations:
        - name: '*'
          namespace: '*'
          server: https://E8BE2C38B0E751D15000D5FDE4312BF4.gr7.eu-west-1.eks.amazonaws.com
        - name: '*'
          namespace: '*'
          server: https://kubernetes.default.svc
      namespaceResourceWhitelist:
        - group: '*'
          kind: '*'
      sourceRepos:
        - '*'

  YAML
}

resource "kubectl_manifest" "eks_boostraping" {
  provider   = kubectl.argocd
  # language=yaml
  yaml_body  = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: Application
    metadata:
      name: eks-boostraping-${local.name}-${local.env}
      namespace: argocd
      labels:
        app.kubernetes.io/name: eks-boostraping-${local.name}-${local.env}
        app.kubernetes.io/part-of: infra
        app.kubernetes.io/env: ${local.env}
    spec:
      project: "infra-${local.name}-${local.env}"
      destination:
          server: 'https://kubernetes.default.svc'
          namespace: argocd
      source:
        chart: eks-boostraping
        repoURL: https://moreirodamian.github.io/helm-charts/
        targetRevision: 0.0.7
        helm:
          valueFiles:
            - values.yaml
          values: |
            env: ${local.env}
            region: ${local.region}
            clusterName: ${local.shortname}-${local.region_shorthand[local.region]}-${local.env}
            project: infra-${local.name}-${local.env}
            namespace: infra-${local.env}
            argo-rollouts:
              version: ${var.argo_rollouts_chart_version[local.env]}
            promtail:
              version: ${var.promtail_chart_version[local.env]}
              url: ${var.promtail_url[local.env]}
            prometheus:
              version: ${var.prometheus_chart_version[local.env]}
              remoteWrite:
                url: https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom/push
                secret:
                  password: ${var.prometheus_remote_write[local.env].password}
                  username: ${var.prometheus_remote_write[local.env].username}
                  clusterName: ${local.shortname}-${local.region_shorthand[local.region]}-${local.env}
            cluster-autoscaler:
              version: ${var.cluster_autoscaler_chart_version[local.env]}
              values:
                autoDiscovery:
                  clusterName: ${local.shortname}-${local.region_shorthand[local.region]}-${local.env}
                rbac:
                  serviceAccount:
                    name: cluster-autoscaler
                    annotations:
                      eks.amazonaws.com/role-arn: ${aws_iam_role.cluster_autoscaler.arn}
            ingress-nginx:
              version: ${var.ingress_nginx_chart_version[local.env]}
              values:
                controller:
                  kind: DaemonSet
                  service:
                    type: NodePort
                    nodePorts:
                      http: ${local.nginx.http_port}
                      https: ${local.nginx.https_port}
                  metrics:
                    enabled: true
                    service:
                      annotations:
                        prometheus.io/scrape: "true"
                        prometheus.io/port: "10254"

            metrics-server:
              version: ${var.metrics_chart_version[local.env]}
              values:
                replicas: 2
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
  YAML
  depends_on = [kubectl_manifest.argocd_project_infra]
}

resource "kubectl_manifest" "sealed_secrets" {
  provider   = kubectl.argocd
  # language=yaml
  yaml_body  = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: Application
    metadata:
      name: sealed-secrets-${local.name}-${local.env}
      namespace: argocd
      labels:
        app.kubernetes.io/name: sealed-secrets-${local.name}-${local.env}
        app.kubernetes.io/part-of: infra
        app.kubernetes.io/env: ${local.env}
    spec:
      project: "infra-${local.name}-${local.env}"
      destination:
        name: "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
        namespace: kube-system
      source:
        chart: sealed-secrets
        repoURL: https://moreirodamian.github.io/helm-charts/
        targetRevision: 2.8.2
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
  YAML
  depends_on = [kubectl_manifest.argocd_project_infra]
}

resource "kubectl_manifest" "argocd_app" {
  provider      = kubectl.argocd
  # language=yaml
  yaml_body     = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: Application
    metadata:
      name: "api-${local.name}-${local.env}"
      namespace: argocd
      labels:
        app.kubernetes.io/name: ${local.name}-${local.env}
        app.kubernetes.io/part-of: "${local.name}-${local.env}"
        app.kubernetes.io/env: ${local.env}
    spec:
      destination:
        namespace: "${local.name}-${local.env}"
        name: "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
      project: "${local.name}-${local.env}"
      source:
        helm:
          parameters:
            - name: generic-app.app.image.tag
              value: '324'
          valueFiles:
            - values-${local.env}.yaml
        path: devops/helm/app
        repoURL: git@bitbucket.org:axtersoftware/iberojet-backend.git
        targetRevision: 43c100006f4d0182ae24cc5ced5546c9fffc089a
      syncPolicy:
        syncOptions:
          - CreateNamespace=true
  YAML
  ignore_fields = ["spec.source.helm.parameters.0.value", "spec.source.helm.targetRevision"]
  lifecycle {
    ignore_changes = [yaml_incluster]
  }
}

resource "kubectl_manifest" "argocd_project_app_minimal_dev" {
  count     = var.minimal_resources == true && local.env == "prod" ? 1 : 0
  provider  = kubectl.argocd
  # language=yaml
  yaml_body = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: AppProject
    metadata:
      name: "${local.name}-dev"
      namespace: argocd
    spec:
      clusterResourceWhitelist:
        - group: '*'
          kind: '*'
      destinations:
        - name: '*'
          namespace: '*'
          server: https://E8BE2C38B0E751D15000D5FDE4312BF4.gr7.eu-west-1.eks.amazonaws.com
        - name: '*'
          namespace: '*'
          server: https://kubernetes.default.svc
      namespaceResourceWhitelist:
        - group: '*'
          kind: '*'
      sourceRepos:
        - '*'

  YAML
}

resource "kubectl_manifest" "argocd_app_minimal_dev" {
  count         = var.minimal_resources == true && local.env == "prod" ? 1 : 0
  provider      = kubectl.argocd
  # language=yaml
  yaml_body     = <<YAML
    apiVersion: argoproj.io/v1alpha1
    kind: Application
    metadata:
      name: "api-${local.name}-dev"
      namespace: argocd
      labels:
        app.kubernetes.io/name: ${local.name}-dev
        app.kubernetes.io/part-of: "${local.name}-dev"
        app.kubernetes.io/env: dev
    spec:
      destination:
        namespace: "${local.name}-dev"
        name: "${local.shortname}-${local.region_shorthand[local.region]}-${local.env}"
      project: "${local.name}-dev"
      source:
        helm:
          parameters:
            - name: generic-app.app.image.tag
              value: '324'
          valueFiles:
            - values-dev.yaml
        path: devops/helm/app
        repoURL: git@bitbucket.org:axtersoftware/iberojet-backend.git
        targetRevision: 43c100006f4d0182ae24cc5ced5546c9fffc089a
      syncPolicy:
        syncOptions:
          - CreateNamespace=true
  YAML
  ignore_fields = ["spec.source.helm.parameters.0.value", "spec.source.helm.targetRevision"]
  lifecycle {
    ignore_changes = [yaml_incluster]
  }
}