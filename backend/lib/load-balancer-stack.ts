import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";

type TProps = cdk.StackProps & {
  vpc: ec2.Vpc;
  containerPort: number;
};

export class LoadBalancerStack extends cdk.Stack {
  public listener: elbv2.ApplicationListener;
  public targetGroup: elbv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    const securityGroupELB = new ec2.SecurityGroup(this, "SecurityGroupELB", {
      vpc: props.vpc,
      allowAllOutbound: true,
      securityGroupName: `langchain-alb-sg`,
    });

    securityGroupELB.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));

    const alb = new elbv2.ApplicationLoadBalancer(this, `langchain-alb`, {
      loadBalancerName: `langchain-alb`,
      vpc: props.vpc,
      securityGroup: securityGroupELB,
      internetFacing: true,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `backend-target-group`,
      {
        targetGroupName: `backend-target-group`,
        vpc: props.vpc,
        port: props.containerPort,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: "/api/health-check",
          healthyHttpCodes: "200",
          protocol: elbv2.Protocol.HTTP,
        },
      }
    );

    const listener = alb.addListener("Listener", {
      port: 80,
      open: true,
      defaultTargetGroups: [targetGroup],
    });

    new elbv2.ApplicationListenerRule(this, "ListenerRule1", {
      listener: listener,
      priority: 1,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/docs*"])],
      targetGroups: [targetGroup],
    });

    new elbv2.ApplicationListenerRule(this, "ListenerRule2", {
      listener: listener,
      priority: 2,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/openapi.json*"])],
      targetGroups: [targetGroup],
    });

    new elbv2.ApplicationListenerRule(this, "ListenerRule3", {
      listener: listener,
      priority: 3,
      conditions: [elbv2.ListenerCondition.pathPatterns(["/api*"])],
      targetGroups: [targetGroup],
    });

    this.listener = listener;
    this.targetGroup = targetGroup;
  }
}
