
import { Peer, Port, InstanceType, SecurityGroup } from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { Analytics } from './analytics';
import { IamRoles } from './iam-roles';
import { Network } from './network';
import { Scheduler, BaseOS } from './scheduler';
import { EfsStorage } from './storage';

export interface WorkloadProps {
  /**
   * S3 bucket with your SOCA installer.
   * Name of your S3 Bucket where you uploaded your install files.
   * @default - solutions-reference
   */
  readonly s3InstallBucket?: string;
  /**
   * Name of the S3 folder where you uploaded SOCA
   * @default - scale-out-computing-on-aws/v2.5.0
   */
  readonly s3InstallFolder?: string;
  /**
   * Linux distribution
   * @default - amazonlinux2
   */
  readonly linuxDistribution?: BaseOS;
  /**
   * Custom AMI if available
   * @default - no custom AMI
   */
  readonly customAmi?: string;
  /**
   * Instance type for your master host(scheduler)
   * @default - m5.xlarge
   */
  readonly instanceType?: InstanceType;
  /**
   * VPC Cidr for the new VPC
   * @default - 10.0.0.0/16
   */
  readonly vpcCidr?: string;
  /**
   * Default IP(s) allowed to directly SSH into the scheduler and access ElasticSearch. 0.0.0.0/0 means
   * ALL INTERNET access. You probably want to change it with your own IP/subnet (x.x.x.x/32 for your own
   * ip or x.x.x.x/24 for range. Replace x.x.x.x with your own PUBLIC IP. You can get your public IP using
   * tools such as https://ifconfig.co/). Make sure to keep it restrictive!
   *
   * @default - not to add any client IP Cidr address
   */
  readonly clientIpCidr?: string;
  /**
   * Default SSH pem keys used to SSH into the scheduler
   */
  readonly sshKeyName?: string;

  /**
   * Username for your default LDAP user
   *
   * @default - 'ldapUserName'
   */
  readonly ldapUserName?: string;
  /**
   * Password for your default LDAP user
   *
   * @default - 'ldapUserPassword!123'
   */
  readonly ldapUserPassword?: string;

}

export class Workload extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: WorkloadProps = {}) {
    super(scope, id);
    const stack = cdk.Stack.of(this);

    const s3InstallBucket = props.s3InstallBucket ?? 'solutions-reference';
    const s3InstallFolder = props.s3InstallFolder ?? 'scale-out-computing-on-aws/v2.5.0';

    // network construct
    const network = new Network(stack, 'SocaNetwork');

    // assets construct
    // const assets = new Assets(stack, 'S3Assets');

    // iam roles
    new IamRoles(stack, 'IamRoles', {
      s3InstallBucketName: s3InstallBucket,
      network,
    });

    // compute node security group
    const computeNodeSecurityGroup = new SecurityGroup(this, 'ComputeNodeSecurityGroup', {
      vpc: network.vpc,
      allowAllOutbound: false,
    });

    // explicitly allow the egress of the security group
    computeNodeSecurityGroup.connections.allowToAnyIpv4(Port.allTcp());
    computeNodeSecurityGroup.connections.allowToAnyIpv4(Port.allUdp());
    computeNodeSecurityGroup.connections.allowToAnyIpv4(Port.allIcmp());

    /**
     * Allow all traffic internally
     */
    computeNodeSecurityGroup.connections.allowInternally(Port.allTcp());
    computeNodeSecurityGroup.connections.allowInternally(Port.allUdp());
    computeNodeSecurityGroup.connections.allowInternally(Port.allIcmp());

    const schedulerSecurityGroup = new SecurityGroup(this, 'SchedulerSecurityGroup', {
      vpc: network.vpc,
      allowAllOutbound: false,
    });

    // explicitly allow the egress of the security group
    schedulerSecurityGroup.connections.allowToAnyIpv4(Port.allTcp());
    schedulerSecurityGroup.connections.allowToAnyIpv4(Port.allUdp());
    schedulerSecurityGroup.connections.allowToAnyIpv4(Port.allIcmp());

    /**
     * SchedulerInboundRule
     * Allow all traffic from computeNodeSecurityGroup to schedulerSecurityGroup
     */
    schedulerSecurityGroup.connections.allowFrom(computeNodeSecurityGroup, Port.allTcp());
    schedulerSecurityGroup.connections.allowFrom(computeNodeSecurityGroup, Port.allUdp());
    schedulerSecurityGroup.connections.allowFrom(computeNodeSecurityGroup, Port.allIcmp());

    /**
     * SchedulerInboundRuleAllowClientIP
     * SchedulerInboundRuleAllowClientIPHTTPS
     * SchedulerInboundRuleAllowClientIPHTTP
     * 1. Allow SSH traffic from client IP to master host
     * 2. Allow HTTP traffic from client IP to ELB
     * 3. Allow HTTPS traffic from client IP to ELB
     */
    if (props.clientIpCidr) {
      schedulerSecurityGroup.connections.allowFrom(Peer.ipv4(props.clientIpCidr), Port.tcp(22));
      schedulerSecurityGroup.connections.allowFrom(Peer.ipv4(props.clientIpCidr), Port.tcp(80));
      schedulerSecurityGroup.connections.allowFrom(Peer.ipv4(props.clientIpCidr), Port.tcp(443));
    }

    /**
     * Allow traffic between Master agent and compute nodes
     */
    computeNodeSecurityGroup.connections.allowFrom(schedulerSecurityGroup, Port.allTcp());
    computeNodeSecurityGroup.connections.allowFrom(schedulerSecurityGroup, Port.allUdp());


    /**
     * Allow ELB healtcheck to communicate with web ui on master host
     */
    schedulerSecurityGroup.connections.allowInternally(Port.tcp(8443));

    const storage = new EfsStorage(stack, 'EfsStorage', {
      clusterId: network.clusterId,
      vpc: network.vpc,
      schedulerSecurityGroup,
      computeNodeSecurityGroup,
    });

    const scheduler = new Scheduler(stack, 'Scheduler', {
      s3InstallBucket,
      s3InstallFolder,
      schedulerSecurityGroup,
      network,
      storage,
      instanceType: new InstanceType('m5.large'),
      ldapUserName: props.ldapUserName ?? 'ldapUserName',
      ldapUserPassword: props.ldapUserPassword ?? 'ldapUserPassword!123',
    });

    // add elasticsearch stack
    new Analytics(stack, 'Analytics', {
      vpc: network.vpc,
      clientIpCidr: props.clientIpCidr,
      sechedulerPublicIp: scheduler.publicIp,
      schedulerSecurityGroup: schedulerSecurityGroup,
      clusterId: network.clusterId,
    });


  }
}
