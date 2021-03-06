#!/bin/sh 
set -e
set -u

# check required env vars
( : $AWS_ACCOUNT )

echo linting
aws cloudformation validate-template --template-body file://S3ProxyECS.yaml >/dev/null
cfn-lint -t S3ProxyECS.yaml
echo linting done

echo update-stack
aws cloudformation update-stack \
    --parameters "ParameterKey=BucketName,ParameterValue=s3proxy-public" \
    --stack-name S3ProxyECS --template-body file://S3ProxyECS.yaml --capabilities CAPABILITY_NAMED_IAM

echo update-stack waiting
aws cloudformation wait stack-update-complete \
    --stack-name "arn:aws:cloudformation:us-east-1:${AWS_ACCOUNT}:stack/S3ProxyECS/087fa360-b5db-11eb-9c36-0a3071d8b5ff"
echo update-stack done

echo update-service
aws ecs update-service --cluster S3Proxy --service S3ProxyService --force-new-deployment >/dev/null
echo update-service operation in process
