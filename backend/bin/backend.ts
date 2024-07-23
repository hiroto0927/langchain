import * as cdk from "aws-cdk-lib";
import { LangChainStack } from "../lib/langchain-stack";
import { LambdaLayerImageCdkStack } from "../lib/lambda-layer-image";

const app = new cdk.App();
const LambdaLayerImage = new LambdaLayerImageCdkStack(
  app,
  "LambdaLayerImage",
  {}
);

new LangChainStack(app, "LangChainStack", {
  ecrRepo: LambdaLayerImage.repository,
}).addDependency(LambdaLayerImage);
