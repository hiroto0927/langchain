import * as cdk from "aws-cdk-lib";
import { VpcStack } from "../lib/vpc-stack";
import { EcrRepoStack } from "../lib/ecr-repo-stack";
import { EcsClusterStack } from "../lib/ecs-stack";
import { LoadBalancerStack } from "../lib/load-balancer-stack";
import { EcsTaskDefStack } from "../lib/ecs-task-def-stack";
import { UpdateServiceStack } from "../lib/update-service-stack";

const app = new cdk.App();
const vpc = new VpcStack(app, "VpcStack", {});
const ecrRepo = new EcrRepoStack(app, "EcrRepoStack", {});
// new UpdateServiceStack(app, "UpdateServiceStack", {
//   ecrRepo: ecrRepo.repository,
// });

const lb = new LoadBalancerStack(app, "LoadBalancerStack", {
  vpc: vpc.vpc,
  containerPort: 8000,
});

const ecsCluster = new EcsClusterStack(app, "EcsClusterStack", {
  vpc: vpc.vpc,
  lbPubSecurityGroup: lb.lbSecurityGroup,
});

ecsCluster.addDependency(vpc);

const ecsService = new EcsTaskDefStack(app, "EcsTaskDefStack", {
  vpc: vpc.vpc,
  ecrRepo: ecrRepo.repository,
  containerPort: 8000,
  cluster: ecsCluster.cluster,
});

lb.targetGroup.addTarget(ecsService.service);
