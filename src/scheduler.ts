
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { RegionMap, SocaInfo } from './info';
import { Network } from './network';
import { EfsStorage } from './storage';

export enum BaseOS {
  CENTOS_7 = 'centos7',
  RHEL_7 = 'rhel7',
  AMZN2 = 'amazonlinux2',
}

export interface SchedulerProps {
  readonly customAmi?: string;
  readonly baseOs?: BaseOS;
  readonly network: Network;
  readonly instanceType?: ec2.InstanceType;
  readonly s3InstallBucket: string;
  readonly s3InstallFolder: string;
  readonly ldapUserName: string;
  readonly ldapUserPassword: string;
  readonly schedulerSecurityGroup: ec2.ISecurityGroup;
  readonly storage: EfsStorage;
}

export class Scheduler extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: SchedulerProps) {
    super(scope, id);

    const urlsuffix = cdk.Stack.of(this).urlSuffix;
    const stack = cdk.Stack.of(this);
    const region = cdk.Stack.of(this).region;
    const s3InstallBucket = props.s3InstallBucket;
    const s3InstallFolder = props.s3InstallFolder;
    const baseOs = props.baseOs ? props.baseOs.toString() : BaseOS.AMZN2.toString();
    const clusterId = props.network.clusterId;
    const socaVersion = SocaInfo.Data.Version;
    const ldapUserName = props.ldapUserName;
    const ldapUserPassword = props.ldapUserPassword;
    const socaInstallAmi = props.customAmi ?ec2.MachineImage.genericLinux({
      [region]: props.customAmi,
    }) : ec2.MachineImage.genericLinux({
      [region]: RegionMap[region][baseOs],
    });
    const socaInstallAmiId = socaInstallAmi.getImage(this).imageId;
    // const bootscript: string = fs.readFileSync(path.join(__dirname, '../assets/user-data'), 'utf-8');
    const userData = ec2.UserData.forLinux();
    // userData.addCommands(bootscript)
    userData.addCommands(`
export PATH=$PATH:/usr/local/bin
# Deactivate shell to make sure users won't access the cluster if it's not ready
echo '
************* SOCA FIRST TIME CONFIGURATION *************
Hold on, cluster is not ready yet.
Please wait ~30 minutes as SOCA is being installed.
Once cluster is ready to use, this message will be replaced automatically and you will be able to SSH.
*********************************************************' > /etc/nologin

if [ "${baseOs}" == "amazonlinux2" ] || [ "${baseOs}" == "rhel7" ];
  then
    usermod --shell /usr/sbin/nologin ec2-user
fi

if [ "${baseOs}" == "centos7" ];
  then
    usermod --shell /usr/sbin/nologin centos
fi

# Install awscli
if [ "${baseOs}" == "centos7" ] || [ "${baseOs}" == "rhel7" ];
then
  EASY_INSTALL=$(which easy_install-2.7)
  $EASY_INSTALL pip
  PIP=$(which pip2.7)
  $PIP install awscli
fi

# Disable automatic motd update if using ALI
if [ "${baseOs}" == "amazonlinux2" ];
then
  /usr/sbin/update-motd --disable
  rm /etc/cron.d/update-motd
  rm -f /etc/update-motd.d/*
fi

AWS=$(which aws)
echo export "SOCA_BASE_OS=${baseOs}" >> /etc/environment
echo export "SOCA_CONFIGURATION=${clusterId}" >> /etc/environment
echo export "AWS_DEFAULT_REGION=${region} " >> /etc/environment
echo export "SOCA_INSTALL_BUCKET=${s3InstallBucket}" >> /etc/environment
echo export "SOCA_INSTALL_BUCKET_FOLDER=${s3InstallFolder}" >> /etc/environment
echo export "SOCA_VERSION=${socaVersion}" >> /etc/environment
echo export "SOCA_INSTALL_AMI=${socaInstallAmiId}" >> /etc/environment
source /etc/environment

# Tag EBS disks manually as CFN ASG does not support it
AWS_AVAIL_ZONE=$(curl http://169.254.169.254/latest/meta-data/placement/availability-zone)
AWS_REGION=$(echo \"$AWS_AVAIL_ZONE\" | sed "s/[a-z]$//")
AWS_INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
EBS_IDS=$(aws ec2 describe-volumes --filters Name=attachment.instance-id,Values="$AWS_INSTANCE_ID" --region $AWS_REGION --query "Volumes[*].[VolumeId]" --out text | tr "\n" " ")
$AWS ec2 create-tags --resources $EBS_IDS --region $AWS_REGION --tags Key=Name,Value="${clusterId} Root Disk" "Key=soca:ClusterId,Value=${clusterId}"

# Tag Network Adapter for the Scheduler
ENI_IDS=$(aws ec2 describe-network-interfaces --filters Name=attachment.instance-id,Values="$AWS_INSTANCE_ID" --region $AWS_REGION --query "NetworkInterfaces[*].[NetworkInterfaceId]" --out text | tr "\n" " ")
$AWS ec2 create-tags --resources $ENI_IDS --region $AWS_REGION --tags Key=Name,Value="${clusterId} Scheduler Network Adapter" "Key=soca:ClusterId,Value=${clusterId}"

echo "@reboot /bin/aws s3 cp s3://${s3InstallBucket}/${s3InstallFolder}/scripts/SchedulerPostReboot.sh /root && /bin/bash /root/SchedulerPostReboot.sh ${s3InstallBucket} ${s3InstallFolder} ${ldapUserName} '${ldapUserPassword}' >> /root/PostRebootConfig.log 2>&1" | crontab -
AWS=$(which aws)
$AWS s3 cp s3://${s3InstallBucket}/${s3InstallFolder}/scripts/config.cfg /root/
$AWS s3 cp s3://${s3InstallBucket}/${s3InstallFolder}/scripts/requirements.txt /root/
$AWS s3 cp s3://${s3InstallBucket}/${s3InstallFolder}/scripts/Scheduler.sh /root/
/bin/bash /root/Scheduler.sh ${props.storage.efsDataDns} ${props.storage.efsAppsDns} >> /root/Scheduler.sh.log 2>&1
`);

    const scheduler = new ec2.Instance(this, 'Scheduler', {
      vpc: props.network.vpc,
      instanceType: props.instanceType ?? new ec2.InstanceType('m5.xlarge'),
      machineImage: socaInstallAmi,
      userData,
      securityGroup: props.schedulerSecurityGroup,
    });

    scheduler.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'pricing:GetProducts',
        'budgets:ViewBudget',
        'ec2:DescribeInstances',
        'ec2:DescribeSubnets',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeImages',
        'ec2:DescribeInstanceAttribute',
        'ec2:DescribeInstanceTypes',
        'ec2:DescribeReservedInstances',
        'ec2:DescribeSpotInstanceRequests',
        'ec2:DescribeVpcClassicLink',
        'ec2:DescribeVolumes',
        'ec2:DescribePlacementGroups',
        'ec2:DescribeKeyPairs',
        'ec2:DescribeLaunchTemplates',
        'ec2:DescribeLaunchTemplateVersions',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DescribeSpotFleetRequests',
        'ec2:DescribeSpotFleetInstances',
        'fsx:DescribeFileSystems',
        'autoscaling:DescribeAutoScalingGroups',
        'autoscaling:DescribeScalingActivities',
        'autoscaling:DescribeLaunchConfigurations',
        'elasticloadbalancing:DescribeRules',
        'elasticloadbalancing:DescribeListeners',
        'elasticloadbalancing:DescribeTargetGroups',
        'savingsplans:DescribeSavingsPlans',
        'servicequotas:ListServiceQuotas',
      ],
      resources: ['*'],
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'autoscaling:UpdateAutoScalingGroup',
        'autoscaling:DeleteAutoScalingGroup',
        'autoscaling:CreateAutoScalingGroup',
        'autoscaling:DetachInstances',
        'ec2:DeleteLaunchTemplate',
        'ec2:CreateLaunchTemplate',
        'fsx:CreateDataRepositoryTask',
      ],
      resources: ['*'],
      conditions: {
        StringLikeIfExists: {
          'autoscaling:LaunchConfigurationName': props.network.clusterId,
        },
      },
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ec2:CreateTags',
      ],
      resources: [
        stack.formatArn({ service: 'ec2', resource: 'volume' }),
        stack.formatArn({ service: 'ec2', resource: 'network-interface' }),
        stack.formatArn({ service: 'ec2', resource: 'instance' }),
      ],
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cloudformation:CreateStack',
        'cloudformation:DeleteStack',
        'cloudformation:DescribeStacks',
      ],
      resources: ['*'],
      conditions: {
        'ForAllValues:StringEquals': {
          'cloudformation:TemplateURL': `https://s3.${urlsuffix}/${s3InstallBucket}/${s3InstallFolder}/templates/ComputeNode.template`,
        },
      },
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ec2:RunInstances',
        'ec2:TerminateInstances',
        'ec2:CreatePlacementGroup',
        'ec2:DeletePlacementGroup',
      ],
      resources: [
        ...['subnet', 'key-pair', 'instance', 'launch-template', 'volume', 'security-group', 'placement-group', 'network-interface'].map(resource => stack.formatArn({ service: 'ec2', resource })).concat(
          ['snapshot', 'image'].map(resource => stack.formatArn({ service: 'ec2', resource, account: '' }))),
      ],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({ service: 'ec2', resource: 'vpc', resourceName: props.network.vpc.vpcId }),
        },
      },
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'lambda:InvokeFunction',
      ],
      resources: [
        stack.formatArn({
          service: 'lambda',
          resource: 'function',
          resourceName: `${props.network.clusterId}-Metrics`,
        }),
      ],
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'fsx:CreateFileSystem',
      ],
      resources: [
        stack.formatArn({
          service: 'fsx',
          resource: 'file-system',
        }),
      ],
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'fsx:DeleteFileSystem',
      ],
      resources: [
        stack.formatArn({
          service: 'fsx',
          resource: 'file-system',
        }),
      ],
      conditions: {
        StringLike: {
          'aws:ResourceTag/soca:ClusterId': props.network.clusterId,
        },
      },
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'iam:CreateServiceLinkedRole',
        'iam:AttachRolePolicy',
        'iam:PutRolePolicy',
      ],
      resources: [
        stack.formatArn({
          service: 'iam',
          resource: 'role',
          region: '',
          resourceName: 'aws-service-role/s3.data-source.lustre.fsx.amazonaws.com/*',
        }),
        stack.formatArn({
          service: 'iam',
          resource: 'role',
          region: '',
          resourceName: 'aws-service-role/autoscaling.amazonaws.com/*',
        }),
        stack.formatArn({
          service: 'iam',
          resource: 'role',
          region: '',
          resourceName: 'aws-service-role/spotfleet.amazonaws.com/*',
        }),
      ],
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ses:SendEmail',
      ],
      resources: [
        stack.formatArn({
          service: 'ses',
          resource: 'identity',
        }),
      ],
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ec2:CreatePlacementGroup',
        'ec2:DeletePlacementGroup',
        'ec2:RequestSpotFleet',
        'ec2:ModifySpotFleetRequest',
        'ec2:CancelSpotFleetRequests',
      ],
      resources: ['*'],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({
            service: 'ec2',
            resource: 'vpc',
            resourceName: props.network.vpc.vpcId,
          }),
        },
      },
    }));

    scheduler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:ListBucket',
        's3:PutObject',
      ],
      resources: [
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: props.s3InstallBucket,
        }),
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: `${props.s3InstallBucket}/*`,
        }),
      ],
    }));

    const eip = new ec2.CfnEIP(this, 'EIPScheduler', {
      instanceId: scheduler.instanceId,
      domain: props.network.vpc.vpcId,
    });

    new cdk.CfnOutput(this, 'SchedulerEIP', { value: eip.ref });
  }
}
