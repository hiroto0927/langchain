import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

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

    cluster.addCapacity("DefaultAutoScalingGroupCapacity", {
      // instanceType: new ec2.InstanceType("g4dn.xlarge"),
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage: ecs.EcsOptimizedImage.amazonLinux2(),
    });

    this.cluster = cluster;
  }
}
