PROFILE=default
LAMBDA_FUNCTION_NAME=LangchainLambdaFunction
ACCOUNT_ID=$(shell aws sts get-caller-identity --query "Account" --output text)
ECR_URI=$(ACCOUNT_ID).dkr.ecr.ap-northeast-1.amazonaws.com/lambda-layer-repo:latest

update-lambda:
	aws lambda update-function-code --profile $(PROFILE) --function-name $(LAMBDA_FUNCTION_NAME) --image-uri $(ECR_URI)