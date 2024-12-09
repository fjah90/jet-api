#!/usr/bin/env bash
set -e

kubectl -n $NAME-$ENV delete secret axterdev  --ignore-not-found
kubectl -n $NAME-$ENV create secret docker-registry axterdev --docker-server='docker.io' --docker-username="$DOCKERHUB_USERNAME" --docker-password="$DOCKERHUB_PASSWORD" --docker-email="DOCKERHUB_EMAIL"
