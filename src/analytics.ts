import * as ec2 from '@aws-cdk/aws-ec2';
import * as es from '@aws-cdk/aws-elasticsearch';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export interface AnalyticsProps {
  readonly vpc: ec2.IVpc;
  readonly schedulerSecurityGroup: ec2.ISecurityGroup;
  readonly clusterId: string;
  readonly domainName?: string;
  readonly clientIpCidr?: string;
  readonly sechedulerPublicIp: string;
  // readonly eipNat?: string;
}

export class Analytics extends cdk.Construct {
  readonly vpc: ec2.IVpc;
  constructor(scope: cdk.Construct, id: string, props: AnalyticsProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const account = cdk.Stack.of(this).account;
    const esDomainName = props.domainName ?? props.clusterId;

    this.vpc = props.vpc;

    // PolicyName: ElasticsearchPermissions
    const trustedSourceIpCidr = [
      `${props.sechedulerPublicIp}/32`,
    ];
    if (props.clientIpCidr) trustedSourceIpCidr.push(props.clientIpCidr);
    const elasticsearchPermissionsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'es:ESHttp*',
      ],
      principals: [new iam.AccountRootPrincipal()],
      conditions: {
        IpAddress: { 'aws:SourceIp': trustedSourceIpCidr },
      },
      resources: [`arn:aws:es:${region}:${account}:domain/${esDomainName}/*`],
    });

    //Create Elasticsearch service
    const esDomain = new es.Domain(this, 'ElasticsearchDomain', {
      version: es.ElasticsearchVersion.V7_4,
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
}
