import * as ec2 from '@aws-cdk/aws-ec2';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export interface AnalyticsProps {
  readonly vpc: ec2.IVpc;
  readonly schedulerSecurityGroup: ec2.ISecurityGroup;
  readonly clusterId: string;
  readonly domainName?: string;
}

export class Analytics extends cdk.Construct {
  readonly vpc: ec2.IVpc;
  constructor(scope: cdk.Construct, id: string, props: AnalyticsProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;
    // const stack = cdk.Stack.of(this);
    const esDomainName = props.domainName ?? props.clusterId;

    this.vpc = props.vpc;

    // PolicyName: ElasticsearchPermissions
    const elasticsearchPermissionsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'es:ESHttp*',
      ],
      principals: [
        new iam.AnyPrincipal(),
      ],
      resources: [`arn:aws:es:${region}:${account}:domain/${esDomainName}/*`],
    });

    //Create Elasticsearch service
    const esDomain = new es.Domain(this, 'ElasticsearchDomain', {
      version: es.ElasticsearchVersion.V7_4,
      vpcOptions: {
        subnets: this.vpc.privateSubnets,
        securityGroups: [
          this._createSecurityGroup('ESSecurityGroup', 'Default security group for ES'),
        ],
      },
      domainName: esDomainName,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      ebs: {
        volumeSize: 100,
        volumeType: ec2.EbsDeviceVolumeType.GP2,
        enabled: true,
      },
      capacity: {
        masterNodes: 3,
        masterNodeInstanceType: 'm5.large.elasticsearch',
        dataNodes: 2,
        dataNodeInstanceType: 'm5.large.elasticsearch',
      },
      zoneAwareness: {
        enabled: true,
      },
      automatedSnapshotStartHour: 0,
      accessPolicies: [
        elasticsearchPermissionsPolicy,
      ],
      enforceHttps: true,
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
    });

    new cdk.CfnOutput(this, 'ESDomainArn:', { value: esDomain.domainArn });
    new cdk.CfnOutput(this, 'ESDomainEndpoint:', { value: esDomain.domainEndpoint });

  }
  private _createSecurityGroup(id: string, description?: string): ec2.ISecurityGroup {
    const sg = new ec2.SecurityGroup(this, id, {
      vpc: this.vpc,
      allowAllOutbound: false,
      description,
    });
    sg.connections.allowToAnyIpv4(ec2.Port.allTcp());
    sg.connections.allowToAnyIpv4(ec2.Port.allUdp());
    sg.connections.allowToAnyIpv4(ec2.Port.allIcmp());
    return sg;
  }


}
