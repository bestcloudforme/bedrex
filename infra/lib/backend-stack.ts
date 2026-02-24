import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface BackendStackProps extends cdk.StackProps {
  table: dynamodb.Table;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'BackendService', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../packages/backend')),
        containerPort: 3001,
        environment: {
          NODE_ENV: 'production',
          PORT: '3001',
          AWS_REGION: 'us-east-1',
        },
      },
      publicLoadBalancer: true,
    });

    // Grant permissions to read Bedrock and CloudWatch
    fargateService.taskDefinition.taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockReadOnly'),
    );
    fargateService.taskDefinition.taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchReadOnlyAccess'),
    );

    props.table.grantReadWriteData(fargateService.taskDefinition.taskRole);

    this.apiUrl = fargateService.loadBalancer.loadBalancerDnsName;

    new cdk.CfnOutput(this, 'ApiUrl', { value: `http://${this.apiUrl}` });
  }
}
