import * as ec2 from "@aws-cdk/aws-ec2";
import * as es from "@aws-cdk/aws-elasticsearch";
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from "@aws-cdk/core";

export interface AnalyticsProps {
  readonly vpc: ec2.IVpc;
  readonly schedulerSecurityGroup: ec2.ISecurityGroup;
  readonly clusterId: string;
}

export class Analytics extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: AnalyticsProps) {
        super(scope, id);

        const region = cdk.Stack.of(this).region;
        const urlsuffix = cdk.Stack.of(this).urlSuffix;

        const esDomain = new es.Domain(this, "ElasticsearchDomain", {
          version: es.ElasticsearchVersion.V7_4,
          nodeToNodeEncryption: true,
          encryptionAtRest: {
            enabled: true,
          },
          ebs: {
            volumeSize: 100,
            volumeType: ec2.EbsDeviceVolumeType.GP2,
            enabled: true,
          },
          // capacity: {
          //     masterNodes: 5,
          //     dataNodes: 20
          // },
          zoneAwareness: {
            enabled: true,
          },
          automatedSnapshotStartHour: 0,
          // accessPolicies: {

          // },
          logging: {
            slowSearchLogEnabled: true,
            appLogEnabled: true,
            slowIndexLogEnabled: true,
          },
        });

        new cdk.CfnOutput(this, 'Elasticsearch:', { value: esDomain.domainName });

    }
}
