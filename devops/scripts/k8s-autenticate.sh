#!/usr/bin/env bash
set -e
# Download and install `doctl` so that we can refresh configs for k8s
apk --no-cache add curl
curl -sL https://github.com/digitalocean/doctl/releases/download/v$DOCTL_VERSION/doctl-$DOCTL_VERSION-linux-amd64.tar.gz | tar -xzv
mv ./doctl /usr/local/bin
# Get the config file
doctl auth init -t "$DOCTL_TOKEN"
doctl k8s cluster kubeconfig save $K8S_NAME
kubectl get pods --all-namespaces
