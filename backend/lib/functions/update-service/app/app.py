import boto3
import json

ecs_client = boto3.client('ecs')
ecr_client = boto3.client('ecr')


def lambda_handler(event, context):

    request = json.loads(event)

    print(event)

    return json.dumps(event)
