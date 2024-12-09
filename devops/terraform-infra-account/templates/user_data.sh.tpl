#!/bin/bash
AWS_REGION=${region}
SHORTNAME=${short_name}
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
INSTANCEID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/instance-id)
NEWHOSTNAME=$SHORTNAME-$INSTANCEID

hostnamectl set-hostname --static $NEWHOSTNAME
aws --region $AWS_REGION ec2 create-tags --resources $INSTANCEID --tags Key=Name,Value=$NEWHOSTNAME

cat << EOF > /etc/default/infra.json
{
  "region": "${region}",
  "env": "${env}",
  "project": "${project}",
  "instance_id": "$INSTANCEID",
  "ec2_name": "$SHORTNAME"
}
EOF