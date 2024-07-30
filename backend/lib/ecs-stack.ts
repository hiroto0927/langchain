import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as iam from "aws-cdk-lib/aws-iam";

type TProps = cdk.StackProps & {
  vpc: ec2.Vpc;
};

export class EcsClusterStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, "LangchainCluster", {
      clusterName: "langchain-cluster",
      vpc: props.vpc,
      containerInsights: true,
      defaultCloudMapNamespace: {
        name: "langchain.dev.space",
      },
    });

    const instanceRole = new iam.Role(this, "DefaultAutoScalingGroupRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      roleName: "DefaultAutoScalingGroupRole",
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2ContainerServiceforEC2Role"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2RoleforSSM"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2ContainerServiceAutoscaleRole"
        ),
      ],
    });

    const securityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
      vpc: props.vpc,
      description: "Allow all inbound traffic for ECS tasks",
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS traffic"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH traffic"
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8000),
      "Allow traffic on port 8000"
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      "DefaultLaunchTemplate",
      {
        instanceType: new ec2.InstanceType("t2.micro"),
        machineImage: ecs.EcsOptimizedImage.amazonLinux2023(),
        spotOptions: {
          interruptionBehavior: ec2.SpotInstanceInterruption.TERMINATE,
          requestType: ec2.SpotRequestType.ONE_TIME,
        },
        role: instanceRole,
        securityGroup: securityGroup,
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      "DefaultAutoScalingGroup",
      {
        vpc: props.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 1,
        maxCapacity: 2,
        healthCheck: autoscaling.HealthCheck.ec2(),
      }
    );

    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "GeneralCapacityProvider",
      {
        capacityProviderName: "GeneralCapacityProvider",
        autoScalingGroup,
        spotInstanceDraining: true,
      }
    );

    cluster.addAsgCapacityProvider(capacityProvider);

    this.cluster = cluster;
  }
}
