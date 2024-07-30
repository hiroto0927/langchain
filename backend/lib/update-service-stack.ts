import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as path from "path";

type TProps = cdk.StackProps & {
  ecrRepo: ecr.Repository;
};

export class UpdateServiceStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, "LangchainFunction", {
      runtime: lambda.Runtime.PYTHON_3_10,
      architecture: lambda.Architecture.X86_64,
      code: lambda.Code.fromAsset(
        path.join(__dirname, "./functions/update-service")
      ),
      handler: "app.app.lambda_handler",
    });

    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ecs:UpdateService",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
        ],
        resources: ["*"],
      })
    );

    new events.Rule(this, "EcrPushRule", {
      eventPattern: {
        source: ["aws.ecr"],
        detailType: ["ECR Image Action"],
        detail: {
          result: ["SUCCESS"],
          "action-type": ["PUSH"],
          "repository-name": [props.ecrRepo.repositoryName],
        },
      },
      targets: [new targets.LambdaFunction(fn)],
    });
  }
}
