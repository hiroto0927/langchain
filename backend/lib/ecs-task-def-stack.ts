import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

type TProps = cdk.StackProps & {
  vpc: ec2.Vpc;
  ecrRepo: ecr.Repository;
  containerPort: number;
  cluster: ecs.Cluster;
};

export class EcsTaskDefStack extends cdk.Stack {
  public readonly service: ecs.Ec2Service;

  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const ecsExecutionRole = new iam.Role(this, "ecs-execution-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    const ecsTaskExecutionRole = new iam.Role(this, "ecs-task-execution-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    ecsTaskExecutionRole.attachInlinePolicy(
      new iam.Policy(this, "ecs-task-execution-policy", {
        statements: [
          new iam.PolicyStatement({
            actions: [
              "ecr:GetAuthorizationToken",
              "ecr:BatchCheckLayerAvailability",
              "ecr:GetDownloadUrlForLayer",
              "ecr:BatchGetImage",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            resources: ["*"],
          }),
        ],
      })
    );

    ecsExecutionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    const taskDefinition = new ecs.Ec2TaskDefinition(
      this,
      "task-def-langchain-app",
      {
        executionRole: ecsExecutionRole,
        taskRole: ecsTaskExecutionRole,
      }
    );

    taskDefinition.addContainer("DefaultContainer", {
      image: ecs.ContainerImage.fromEcrRepository(props.ecrRepo),
      memoryLimitMiB: 512,
      //   gpuCount: 1,
      portMappings: [
        {
          containerPort: props.containerPort,
          hostPort: props.containerPort,
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // Instantiate an Amazon ECS Service
    const ecsService = new ecs.Ec2Service(this, "Service", {
      cluster: props.cluster,
      taskDefinition: taskDefinition,
    });

    ecsService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 1,
    });

    this.service = ecsService;
  }
}
