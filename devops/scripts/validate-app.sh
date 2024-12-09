#!/usr/bin/env bash
set -e
sleep 20
echo $BITBUCKET_COMMIT
APP_VERSION=$(curl -k https://$DOMAIN/api/version)
echo $APP_VERSION
if [[ "$APP_VERSION" == "$BITBUCKET_COMMIT" ]] ; then echo "Deploy OK"; else echo "Deploy Failed" && exit 1; fi
