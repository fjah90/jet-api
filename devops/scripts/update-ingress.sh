#!/usr/bin/env bash

# Exit immediately if a any command exits with a non-zero status
# e.g. pull-request merge fails because of conflict

set -e
echo $ALTERNATE_DOMAINS
IFS=',' #setting space as delimiter
read -ra ADDR <<<"$ALTERNATE_DOMAINS"
for i in "${ADDR[@]}"; do #accessing each element of array

  echo "$i"
  cp devops/templates/alternate-domain-snippet.template devops/templates/alternate-domain-snippet
  cp devops/templates/alternate-domain-host.template devops/templates/alternate-domain-host
  cp devops/templates/alternate-domain-rules.template devops/templates/alternate-domain-rules

  sed -i -e "s/#{ALTDOMAIN}#/$i/g" ./devops/templates/alternate-domain-snippet
  sed -i -e "s/#{ALTDOMAIN}#/$i/g" ./devops/templates/alternate-domain-host
  sed -i -e "s/#{ALTDOMAIN}#/$i/g" ./devops/templates/alternate-domain-rules

  sed -i -e '/#ALTERNATEDOMAINSNIPPET/r devops/templates/alternate-domain-snippet' ./devops/kubernetes/03-nginx-ingress.yaml
  sed -i -e '/#ALTERNATEDOMAINHOST/r devops/templates/alternate-domain-host' ./devops/kubernetes/03-nginx-ingress.yaml
  sed -i -e '/#ALTERNATEDOMAINRULES/r devops/templates/alternate-domain-rules' ./devops/kubernetes/03-nginx-ingress.yaml

done
  sed -i -e '/#ALTERNATEDOMAINSNIPPET/d' ./devops/kubernetes/03-nginx-ingress.yaml
  sed -i -e '/#ALTERNATEDOMAINHOST/d' ./devops/kubernetes/03-nginx-ingress.yaml
  sed -i -e '/#ALTERNATEDOMAINRULES/d' ./devops/kubernetes/03-nginx-ingress.yaml
cat ./devops/kubernetes/03-nginx-ingress.yaml
