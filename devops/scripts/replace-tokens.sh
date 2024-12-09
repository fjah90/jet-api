#!/usr/bin/env bash

# Exit immediately if a any command exits with a non-zero status
# e.g. pull-request merge fails because of conflict
set -e

find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{NAME}#/$APP_NAME/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{ENV}#/$ENV/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{DOMAIN}#/$DOMAIN/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{CPU_REQUEST}#/$CPU_REQUEST/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{MEM_REQUEST}#/$MEM_REQUEST/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{CPU_LIMIT}#/$CPU_LIMIT/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{MEM_LIMIT}#/$MEM_LIMIT/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{MAX_REPLICAS}#/$MAX_REPLICAS/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{MIN_REPLICAS}#/$MIN_REPLICAS/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{BITBUCKET_COMMIT}#/$BITBUCKET_COMMIT/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{AFIP_PRODUCTION}#/$AFIP_PRODUCTION/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{AFIP_CERT_NAME}#/$AFIP_CERT_NAME/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{APP_ANALYTICS}#/$APP_ANALYTICS/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{CUIT_AFIP}#/$CUIT_AFIP/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s|#{DO_INTEGRATION_BASE_URL}#|$DO_INTEGRATION_BASE_URL|g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s|#{DO_PORT}#|$DO_PORT|g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s|#{DO_CLUSTER_ID}#|$DO_CLUSTER_ID|g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s/#{APP_DEBUG}#/$APP_DEBUG/g" {} \;
find ./devops/kubernetes/ -type f -exec sed -i -e "s|#{IMAGE}#|$IMAGE|g" {} \;


find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{NAME}#/$APP_NAME/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{ENV}#/$ENV/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{DOMAIN}#/$DOMAIN/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{CPU_REQUEST}#/$CPU_REQUEST/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{MEM_REQUEST}#/$MEM_REQUEST/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{CPU_LIMIT}#/$CPU_LIMIT/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{MEM_LIMIT}#/$MEM_LIMIT/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{MAX_REPLICAS}#/$MAX_REPLICAS/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{MIN_REPLICAS}#/$MIN_REPLICAS/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{BITBUCKET_COMMIT}#/$BITBUCKET_COMMIT/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{AFIP_PRODUCTION}#/$AFIP_PRODUCTION/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{AFIP_CERT_NAME}#/$AFIP_CERT_NAME/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{APP_ANALYTICS}#/$APP_ANALYTICS/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{CUIT_AFIP}#/$CUIT_AFIP/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s|#{DO_INTEGRATION_BASE_URL}#|$DO_INTEGRATION_BASE_URL|g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s|#{DO_PORT}#|$DO_PORT|g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s|#{DO_CLUSTER_ID}#|$DO_CLUSTER_ID|g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s/#{APP_DEBUG}#/$APP_DEBUG/g" {} \;
find ./devops-secrets/dist/ -type f -exec sed -i -e "s|#{IMAGE}#|$IMAGE|g" {} \;