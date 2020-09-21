import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { Network } from './network';

export interface IamRolesProps {
  // readonly assets: Assets;
  readonly s3InstallBucketName: string;
  readonly network: Network;
}

/**
 * Create all required IAM roles
 */
export class IamRoles extends cdk.Construct {
  readonly computeNodeIamRole: iam.IRole;
  readonly schedulerIAMRole: iam.IRole;
  readonly computeNodeInstanceProfileName: string;
  readonly schedulerIamInstanceProfileName: string;
  constructor(scope: cdk.Construct, id: string, props: IamRolesProps) {
    super(scope, id);

    const urlsuffix = cdk.Stack.of(this).urlSuffix
    const stack = cdk.Stack.of(this)
    const region = cdk.Stack.of(this).region

    // ComputeNodeIAMRole
    const computeNodeIamRole = new iam.Role(this, 'ComputeNodeIamRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal(`ec2.${urlsuffix}`),
        new iam.ServicePrincipal(`ssm.${urlsuffix}`),
      ),
    })

    computeNodeIamRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

    // PolicyName: ComputeNodePermissions
    const computeNodePermissionsPolicy = new iam.Policy(this, 'ComputeNodePermissionsPolicy');
    computeNodePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:ListBucket',
        's3:PutObject',
      ],
      resources: [
        // S3InstallBucket/*
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: `${props.s3InstallBucketName}/*`,
        }),
        // S3InstallBucket
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: `${props.s3InstallBucketName}`,
        }),
      ]
    }))
    computeNodePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: [
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: `dcv-license.${region}/*`,
        }),
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: 'ec2-linux-nvidia-drivers/*',
        }),
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: 'ec2-linux-nvidia-drivers',
        }),
      ]
    }))
    computeNodePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: ['ses:SendEmail'],
      resources: [
        stack.formatArn({ service: 'ses', resource: 'identity' }),
      ]
    }))
    computeNodePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: ['ec2:CreateTags'],
      resources: [
        stack.formatArn({ service: 'ec2', resource: 'volume' }),
        stack.formatArn({ service: 'ec2', resource: 'network-interface' }),
      ]
    }))
    computeNodePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'ec2:DescribeVolumes',
        'ec2:DescribeNetworkInterfaces',
        'fsx:CreateDataRepositoryTask',
        'fsx:DescribeFileSystems',
        'tag:GetResources',
        'tag:GetTagValues',
        'tag:GetTagKeys',
      ],
      resources: ['*']
    }))


    // attach to the role
    computeNodePermissionsPolicy.attachToRole(computeNodeIamRole)
    this.computeNodeIamRole = computeNodeIamRole

    // ComputeNodeInstanceProfile
    this.computeNodeInstanceProfileName = new iam.CfnInstanceProfile(this, 'ComputeNodeInstanceProfile', {
      roles: [this.computeNodeIamRole.roleName],
    }).ref

    // SpotFleetIAMRole
    const spotFleetIAMRole = new iam.Role(this, 'SpotFleetIAMRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal(`spotfleet.${urlsuffix}`),
      ),
    })

    // PolicyName: SpotFleetPermissions
    const spotFleetPermissionsPolicy = new iam.Policy(this, 'SpotFleetPermissionsPolicy');
    spotFleetPermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'ec2:DescribeImages',
        'ec2:DescribeSubnets',
        'ec2:DescribeInstanceStatus',
      ],
      resources: ['*'],
    }))
    spotFleetPermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'ec2:RequestSpotInstances',
        'ec2:TerminateInstances',
        'ec2:CreateTags',
      ],
      resources: [
        stack.formatArn({ service: 'ec2', resource: 'instance' }),
      ],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({ service: 'ec2', resource: 'vpc', resourceName: props.network.vpc.vpcId })
        }
      }
    }))
    spotFleetPermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'iam:PassRole',
      ],
      resources: [
        computeNodeIamRole.roleArn,
      ],
      conditions: {
        'StringEquals': {
          'iam:PassedToService': [
            'ec2.amazonaws.com',
            'ec2.amazonaws.com.cn',
          ],
        }
      }
    }))

    spotFleetPermissionsPolicy.attachToRole(spotFleetIAMRole)

    // SchedulerIAMRole
    const schedulerIAMRole = new iam.Role(this, 'SchedulerIAMRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal(`ec2.${urlsuffix}`),
        new iam.ServicePrincipal(`ssm.${urlsuffix}`),
      ),
    })

    schedulerIAMRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

    // PolicyName: SchedulerReadPermissions
    const schedulerReadPermissionsPolicy = new iam.Policy(this, 'SchedulerReadPermissionsPolicy');
    schedulerReadPermissionsPolicy.addStatements(new iam.PolicyStatement({
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
    }))
    // PolicyName: SchedulerWritePermissions
    const schedulerWritePermissionsPolicy = new iam.Policy(this, 'SchedulerWritePermissionsPolicy');
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
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
        'StringLikeIfExists': {
          'autoscaling:LaunchConfigurationName': props.network.clusterId,
        }
      }
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'ec2:CreateTags',
      ],
      resources: [
        stack.formatArn({ service: 'ec2', resource: 'volume' }),
        stack.formatArn({ service: 'ec2', resource: 'network-interface' }),
        stack.formatArn({ service: 'ec2', resource: 'instance' }),
      ],
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'cloudformation:CreateStack',
        'cloudformation:DeleteStack',
        'cloudformation:DescribeStacks',
      ],
      resources: ['*'],
      // conditions: {
      // }
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'ec2:RunInstances',
        'ec2:TerminateInstances',
        'ec2:CreatePlacementGroup',
        'ec2:DeletePlacementGroup',
      ],
      resources: [
        stack.formatArn({ service: 'ec2', resource: 'subnet' }),
        stack.formatArn({ service: 'ec2', resource: 'key-pair' }),
        stack.formatArn({ service: 'ec2', resource: 'instance' }),
        stack.formatArn({ service: 'ec2', resource: 'snapshot', account: '' }),
        stack.formatArn({ service: 'ec2', resource: 'launch-template' }),
        stack.formatArn({ service: 'ec2', resource: 'volume' }),
        stack.formatArn({ service: 'ec2', resource: 'security-group' }),
        stack.formatArn({ service: 'ec2', resource: 'placement-group' }),
        stack.formatArn({ service: 'ec2', resource: 'network-interface' }),
        stack.formatArn({ service: 'ec2', resource: 'image', account: '' }),
      ],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({ service: 'ec2', resource: 'vpc', resourceName: props.network.vpc.vpcId })
        },
      }
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [
        stack.formatArn({
          service: 'lambda',
          resource: 'function',
          resourceName: `${props.network.clusterId}-Metrics`,
        }),
      ],
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: ['fsx:CreateFileSystem'],
      resources: [
        stack.formatArn({
          service: 'fsx',
          resource: 'file-system',
        }),
      ],
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: ['fsx:DeleteFileSystem'],
      resources: [
        stack.formatArn({
          service: 'fsx',
          resource: 'file-system',
        }),
      ],
      conditions: {
        'StringLike': {
          'aws:ResourceTag/soca:ClusterId': props.network.clusterId,
        }
      }
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
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
          resourceName: 'aws-service-role/s3.data-source.lustre.fsx.amazonaws.com',
        }),
        stack.formatArn({
          service: 'iam',
          resource: 'role',
          region: '',
          resourceName: 'aws-service-role/autoscaling.amazonaws.com',
        }),
        stack.formatArn({
          service: 'iam',
          resource: 'role',
          region: '',
          resourceName: 'aws-service-role/spotfleet.amazonaws.com',
        }),
      ],
    }))
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
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
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'ec2:CreatePlacementGroup',
        'ec2:DeletePlacementGroup',
        'ec2:RequestSpotFleet',
        'ec2:ModifySpotFleetRequest',
        'ec2:CancelSpotFleetRequests',
      ],
      resources: [ '*' ],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({ service: 'ec2', resource: 'vpc', resourceName: props.network.vpc.vpcId })
        }
      }
    }));
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        's3:GetObject',
        's3:ListBucket',
        's3:PutObject',
      ],
      resources: [
        // S3InstallBucket/*
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: `${props.s3InstallBucketName}/*`,
        }),
        // S3InstallBucket
        stack.formatArn({
          service: 's3',
          account: '',
          resource: '',
          region: '',
          resourceName: `${props.s3InstallBucketName}`,
        }),
      ],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({ service: 'ec2', resource: 'vpc', resourceName: props.network.vpc.vpcId })
        }
      }
    }));
    schedulerWritePermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'iam:PassRole',
        'iam:CreateServiceLinkedRole',
      ],
      resources: [
        computeNodeIamRole.roleArn,
        spotFleetIAMRole.roleArn,
      ],
      conditions: {
        'ForAllValues:ArnEqualsIfExists': {
          'ec2:Vpc': stack.formatArn({ service: 'ec2', resource: 'vpc', resourceName: props.network.vpc.vpcId })
        }
      }
    }));

    // attach to the role
    schedulerWritePermissionsPolicy.attachToRole(schedulerIAMRole)
    this.schedulerIAMRole = schedulerIAMRole

    // SchedulerIAMInstanceProfile
    this.schedulerIamInstanceProfileName = new iam.CfnInstanceProfile(this, 'SchedulerIamInstanceProfileName', {
      roles: [this.schedulerIAMRole.roleName ],
    }).ref

    // LambdaSolutionMetricRole
    const lambdaSolutionMetricRole = new iam.Role(this, 'LambdaSolutionMetricRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal(`lambda.${urlsuffix}`),
      ),
    })

    // PolicyName: SolutionMetric
    const solutionMetricPolicy = new iam.Policy(this, 'SolutionMetricPolicy');
    spotFleetPermissionsPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
      ],
      resources: [
        stack.formatArn({ 
          service: 'logs',
          resource: 'log-group',
          resourceName: `/aws/lambda/${props.network.clusterId}*`
        }),
      ],
    }))
    solutionMetricPolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DeleteLogStream',
      ],
      resources: [
        stack.formatArn({
          service: 'logs',
          resource: 'log-group',
          resourceName: `/aws/lambda/${props.network.clusterId}*:log-stream:*`
        }),
      ],
    }))
    solutionMetricPolicy.attachToRole(lambdaSolutionMetricRole)

    // LambdaACMIAMRole
    const lambdaACMIAMRole = new iam.Role(this, 'LambdaACMIAMRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal(`lambda.${urlsuffix}`),
      ),
    })

    // PolicyName: ${clusterId}-LambdaACMIamRole-Policy
    const lambdaACMIamRolePolicy = new iam.Policy(this, 'LambdaACMIamRolePolicy');
    lambdaACMIamRolePolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
      ],
      resources: [
        stack.formatArn({
          service: 'logs',
          resource: 'log-group',
          resourceName: `/aws/lambda/${props.network.clusterId}*`
        }),
      ],
    }))
    lambdaACMIamRolePolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        stack.formatArn({
          service: 'logs',
          resource: 'log-group',
          resourceName: `/aws/lambda/${props.network.clusterId}*:log-stream:*`
        }),
      ],
    }))
    lambdaACMIamRolePolicy.addStatements(new iam.PolicyStatement({
      actions: [
        'acm:ImportCertificate',
        'acm:ListCertificates',
        'acm:AddTagsToCertificate',
      ],
      resources: [ '*' ],
    }))
    lambdaACMIamRolePolicy.attachToRole(lambdaACMIAMRole)
  }
}
