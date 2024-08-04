import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

type TProps = cdk.StackProps & {
  tableNames?: string;
};

export class MemoryDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TProps) {
    super(scope, id, props);

    new dynamodb.Table(this, "LangChainTable", {
      partitionKey: { name: "SessionId", type: dynamodb.AttributeType.STRING },
      tableName: props.tableNames ?? "ChatMessageHistory",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
