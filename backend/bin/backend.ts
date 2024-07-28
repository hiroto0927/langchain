import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/vpc-stack";
import { EcrRepoStack } from "../lib/ecr-repo-stack";
import { EcsClusterStack } from "../lib/ecs-stack";
import { LoadBalancerStack } from "../lib/load-balancer-stack";
import { EcsTaskDefStack } from "../lib/ecs-task-def-stack";

const app = new cdk.App();
const vpc = new VpcStack(app, "VpcStack", {});
const ecrRepo = new EcrRepoStack(app, "EcrRepoStack", {});

const ecsCluster = new EcsClusterStack(app, "EcsClusterStack", {
  vpc: vpc.vpc,
});

ecsCluster.addDependency(vpc);

const ecsService = new EcsTaskDefStack(app, "EcsTaskDefStack", {
  vpc: vpc.vpc,
  ecrRepo: ecrRepo.repository,
  containerPort: 8000,
  cluster: ecsCluster.cluster,
});

const lb = new LoadBalancerStack(app, "LoadBalancerStack", {
  vpc: vpc.vpc,
  containerPort: 8000,
});

lb.targetGroup.addTarget(ecsService.service);
lb.addDependency(ecsCluster);
