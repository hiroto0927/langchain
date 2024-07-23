import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";
import * as ecrdeploy from "cdk-ecr-deployment";

export class LambdaLayerImageCdkStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const ecrRepository = new ecr.Repository(this, "EcrRepo", {
      repositoryName: `lambda-layer-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [
        {
          maxImageCount: 2,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    const dockerImage = new DockerImageAsset(this, "DockerImage", {
      directory: path.join(__dirname, "./functions/langchain"),
      platform: Platform.LINUX_AMD64,
    });

    new ecrdeploy.ECRDeployment(this, `DeployDockerImage`, {
      src: new ecrdeploy.DockerImageName(dockerImage.imageUri),
      dest: new ecrdeploy.DockerImageName(
        `${cdk.Aws.ACCOUNT_ID}.dkr.ecr.${cdk.Aws.REGION}.amazonaws.com/${ecrRepository.repositoryName}:latest`
      ),
    });

    this.repository = ecrRepository;
  }
}
