
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as efs from '@aws-cdk/aws-efs';

export interface EfsStorageProps {
  readonly vpc: ec2.IVpc;
  readonly schedulerSecurityGroup: ec2.ISecurityGroup;
  readonly computeNodeSecurityGroup: ec2.ISecurityGroup;
  readonly clusterId: string;
}

export class EfsStorage extends cdk.Construct {
  readonly efsDataDns: string
  readonly efsAppsDns: string
  constructor(scope: cdk.Construct, id: string, props: EfsStorageProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region
    const urlsuffix = cdk.Stack.of(this).urlSuffix

    const efsApps = new efs.FileSystem(this, 'EFSApps', {
      vpc: props.vpc,
      encrypted: true,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      securityGroup: props.computeNodeSecurityGroup,
    })
    efsApps.connections.addSecurityGroup(props.schedulerSecurityGroup)

    const efsData = new efs.FileSystem(this, 'EFSData', {
      vpc: props.vpc,
      encrypted: true,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE,
      },
      securityGroup: props.computeNodeSecurityGroup,
    })
    efsData.connections.addSecurityGroup(props.schedulerSecurityGroup)

    this.efsDataDns = `${efsData.fileSystemId}.efs.${region}.${urlsuffix}`
    this.efsAppsDns = `${efsApps.fileSystemId}.efs.${region}.${urlsuffix}`

    new cdk.CfnOutput(this, 'EFSAppsOutput', { value: efsApps.fileSystemId})
    new cdk.CfnOutput(this, 'EFSDataOutput', { value: efsData.fileSystemId })
    new cdk.CfnOutput(this, 'EFSAppsDnsOutput', { value: this.efsAppsDns })
    new cdk.CfnOutput(this, 'EFSDataDnsOutput', { value: this.efsDataDns })
    new cdk.CfnOutput(this, 'EFSMountParametersOutput', { 
      value: 'nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport'
    })
  }
}
