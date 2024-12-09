#!/usr/bin/env bash
set -e
echo Installing ArgoCD CLI
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/download/v2.7.2/argocd-linux-amd64
install -m 555 argocd /usr/local/bin/argocd
rm argocd

ARGOCD_TIMEOUT=1200

echo "Deploy Timeout time $ARGOCD_TIMEOUT"
echo Deploy started on $(date)

while IFS=',' read -ra ADDR; do
  for ARGOCD_APP in "${ADDR[@]}"; do
    echo "Deploy App $ARGOCD_APP"
    argocd app set "$ARGOCD_APP" \
      --grpc-web \
      --server ${ARGOCD_URL} \
      --auth-token "${ARGOCD_TOKEN}" \
      --revision "${BITBUCKET_COMMIT}" \
      --helm-set "generic-app.app.image.tag=${VERSION}"
    argocd app sync "$ARGOCD_APP" \
      --grpc-web \
      --server ${ARGOCD_URL} \
      --auth-token "${ARGOCD_TOKEN}" \
      --timeout $ARGOCD_TIMEOUT
    echo Waiting for service to become healthy
    argocd app wait "$ARGOCD_APP" \
      --grpc-web \
      --server ${ARGOCD_URL} \
      --auth-token "${ARGOCD_TOKEN}" \
      --timeout $ARGOCD_TIMEOUT

  done
done <<<"$ARGOCD_APPS"

echo Deploy completed on $(date)
