import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as aws_apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ecr from "aws-cdk-lib/aws-ecr";

type TProps = cdk.StackProps & {
  ecrRepo: ecr.Repository;
};

export class LangChainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const role = new iam.Role(this, "LangChainExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    const apigateway = new aws_apigateway.RestApi(this, "LangChainApi", {
      restApiName: "LangChainApi",
      defaultCorsPreflightOptions: {
        allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: aws_apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    });

    const db = new dynamodb.Table(this, "LangChainTable", {
      partitionKey: { name: "SessionId", type: dynamodb.AttributeType.STRING },
      tableName: "ChatMessageHistory",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    role.attachInlinePolicy(
      new iam.Policy(this, "LangChainExecutionPolicy", {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "bedrock:InvokeModel",
              "bedrock:InvokeModelWithResponseStream",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "dynamodb:getItem",
              "dynamodb:putItem",
              "dynamodb:deleteItem",
            ],
            resources: [db.tableArn],
          }),
        ],
      })
    );

    const fn = new lambda.Function(this, "LangchainLambdaFunction", {
      functionName: "LangchainLambdaFunction",
      runtime: lambda.Runtime.FROM_IMAGE,
      architecture: lambda.Architecture.X86_64,
      timeout: cdk.Duration.seconds(60),
      memorySize: 128,
      code: lambda.Code.fromEcrImage(props.ecrRepo),
      handler: lambda.Handler.FROM_IMAGE,
      role: role,
      environment: {
        DB_NAME: db.tableName,
      },
    });

    const apiResource = apigateway.root.addResource("talks");
    apiResource.addMethod("POST", new aws_apigateway.LambdaIntegration(fn));
  }
}
