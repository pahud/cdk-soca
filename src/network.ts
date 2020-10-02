
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { SocaInfo } from './info';

export interface NetworkProps {
  readonly vpc?: ec2.IVpc;
  readonly clusterId?: string;
}

export class Network extends cdk.Construct {
  readonly vpc: ec2.IVpc;
  readonly clusterId: string;
  constructor(scope: cdk.Construct, id: string, props: NetworkProps = {}) {
    super(scope, id);

    this.vpc = props.vpc ?? new ec2.Vpc(this, 'Vpc', { maxAzs: 3, natGateways: 1 });
    this.clusterId = props.clusterId ?? `${SocaInfo.Data.ClusterIdPrefix}-${cdk.Stack.of(this).stackName}`;

    new cdk.CfnOutput(this, 'ClusterID', { value: this.clusterId });
    new cdk.CfnOutput(this, 'VpcID', { value: this.vpc.vpcId });
  }
}
