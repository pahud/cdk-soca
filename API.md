# API Reference

**Classes**

Name|Description
----|-----------
[Analytics](#cdk-soca-analytics)|*No description*
[EfsStorage](#cdk-soca-efsstorage)|*No description*
[IamRoles](#cdk-soca-iamroles)|Create all required IAM roles.
[Network](#cdk-soca-network)|*No description*
[Scheduler](#cdk-soca-scheduler)|*No description*
[Workload](#cdk-soca-workload)|*No description*


**Structs**

Name|Description
----|-----------
[AnalyticsProps](#cdk-soca-analyticsprops)|*No description*
[EfsStorageProps](#cdk-soca-efsstorageprops)|*No description*
[IamRolesProps](#cdk-soca-iamrolesprops)|*No description*
[NetworkProps](#cdk-soca-networkprops)|*No description*
[SchedulerProps](#cdk-soca-schedulerprops)|*No description*
[WorkloadProps](#cdk-soca-workloadprops)|*No description*


**Enums**

Name|Description
----|-----------
[BaseOS](#cdk-soca-baseos)|*No description*



## class Analytics 🔹 <a id="cdk-soca-analytics"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Analytics(scope: Construct, id: string, props: AnalyticsProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[AnalyticsProps](#cdk-soca-analyticsprops)</code>)  *No description*
  * **clusterId** (<code>string</code>)  *No description* 
  * **schedulerSecurityGroup** (<code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code>)  *No description* 
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  *No description* 
  * **domainName** (<code>string</code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**vpc**🔹 | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>



## class EfsStorage 🔹 <a id="cdk-soca-efsstorage"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new EfsStorage(scope: Construct, id: string, props: EfsStorageProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[EfsStorageProps](#cdk-soca-efsstorageprops)</code>)  *No description*
  * **clusterId** (<code>string</code>)  *No description* 
  * **computeNodeSecurityGroup** (<code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code>)  *No description* 
  * **schedulerSecurityGroup** (<code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code>)  *No description* 
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  *No description* 



### Properties


Name | Type | Description 
-----|------|-------------
**efsAppsDns**🔹 | <code>string</code> | <span></span>
**efsDataDns**🔹 | <code>string</code> | <span></span>



## class IamRoles 🔹 <a id="cdk-soca-iamroles"></a>

Create all required IAM roles.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new IamRoles(scope: Construct, id: string, props: IamRolesProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[IamRolesProps](#cdk-soca-iamrolesprops)</code>)  *No description*
  * **network** (<code>[Network](#cdk-soca-network)</code>)  *No description* 
  * **s3InstallBucketName** (<code>string</code>)  *No description* 



### Properties


Name | Type | Description 
-----|------|-------------
**computeNodeIamRole**🔹 | <code>[IRole](#aws-cdk-aws-iam-irole)</code> | <span></span>
**computeNodeInstanceProfileName**🔹 | <code>string</code> | <span></span>
**schedulerIAMRole**🔹 | <code>[IRole](#aws-cdk-aws-iam-irole)</code> | <span></span>
**schedulerIamInstanceProfileName**🔹 | <code>string</code> | <span></span>



## class Network 🔹 <a id="cdk-soca-network"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Network(scope: Construct, id: string, props?: NetworkProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[NetworkProps](#cdk-soca-networkprops)</code>)  *No description*
  * **clusterId** (<code>string</code>)  *No description* __*Optional*__
  * **vpc** (<code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**clusterId**🔹 | <code>string</code> | <span></span>
**vpc**🔹 | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>



## class Scheduler 🔹 <a id="cdk-soca-scheduler"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Scheduler(scope: Construct, id: string, props: SchedulerProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[SchedulerProps](#cdk-soca-schedulerprops)</code>)  *No description*
  * **ldapUserName** (<code>string</code>)  *No description* 
  * **ldapUserPassword** (<code>string</code>)  *No description* 
  * **network** (<code>[Network](#cdk-soca-network)</code>)  *No description* 
  * **s3InstallBucket** (<code>string</code>)  *No description* 
  * **s3InstallFolder** (<code>string</code>)  *No description* 
  * **schedulerSecurityGroup** (<code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code>)  *No description* 
  * **storage** (<code>[EfsStorage](#cdk-soca-efsstorage)</code>)  *No description* 
  * **baseOs** (<code>[BaseOS](#cdk-soca-baseos)</code>)  *No description* __*Optional*__
  * **customAmi** (<code>string</code>)  *No description* __*Optional*__
  * **instanceType** (<code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code>)  *No description* __*Optional*__




## class Workload 🔹 <a id="cdk-soca-workload"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer




```ts
new Workload(scope: Construct, id: string, props?: WorkloadProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[WorkloadProps](#cdk-soca-workloadprops)</code>)  *No description*
  * **clientIpCidr** (<code>string</code>)  Default IP(s) allowed to directly SSH into the scheduler and access ElasticSearch. __*Default*__: not to add any client IP Cidr address
  * **customAmi** (<code>string</code>)  Custom AMI if available. __*Default*__: no custom AMI
  * **instanceType** (<code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code>)  Instance type for your master host(scheduler). __*Default*__: m5.xlarge
  * **ldapUserName** (<code>string</code>)  Username for your default LDAP user. __*Default*__: 'ldapUserName'
  * **ldapUserPassword** (<code>string</code>)  Password for your default LDAP user. __*Default*__: 'ldapUserPassword!123'
  * **linuxDistribution** (<code>[BaseOS](#cdk-soca-baseos)</code>)  Linux distribution. __*Default*__: amazonlinux2
  * **s3InstallBucket** (<code>string</code>)  S3 bucket with your SOCA installer. __*Default*__: solutions-reference
  * **s3InstallFolder** (<code>string</code>)  Name of the S3 folder where you uploaded SOCA. __*Default*__: scale-out-computing-on-aws/v2.5.0
  * **sshKeyName** (<code>string</code>)  Default SSH pem keys used to SSH into the scheduler. __*Optional*__
  * **vpcCidr** (<code>string</code>)  VPC Cidr for the new VPC. __*Default*__: 10.0.0.0/16




## struct AnalyticsProps 🔹 <a id="cdk-soca-analyticsprops"></a>






Name | Type | Description 
-----|------|-------------
**clusterId**🔹 | <code>string</code> | <span></span>
**schedulerSecurityGroup**🔹 | <code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code> | <span></span>
**vpc**🔹 | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>
**domainName**?🔹 | <code>string</code> | __*Optional*__



## struct EfsStorageProps 🔹 <a id="cdk-soca-efsstorageprops"></a>






Name | Type | Description 
-----|------|-------------
**clusterId**🔹 | <code>string</code> | <span></span>
**computeNodeSecurityGroup**🔹 | <code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code> | <span></span>
**schedulerSecurityGroup**🔹 | <code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code> | <span></span>
**vpc**🔹 | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | <span></span>



## struct IamRolesProps 🔹 <a id="cdk-soca-iamrolesprops"></a>






Name | Type | Description 
-----|------|-------------
**network**🔹 | <code>[Network](#cdk-soca-network)</code> | <span></span>
**s3InstallBucketName**🔹 | <code>string</code> | <span></span>



## struct NetworkProps 🔹 <a id="cdk-soca-networkprops"></a>






Name | Type | Description 
-----|------|-------------
**clusterId**?🔹 | <code>string</code> | __*Optional*__
**vpc**?🔹 | <code>[IVpc](#aws-cdk-aws-ec2-ivpc)</code> | __*Optional*__



## struct SchedulerProps 🔹 <a id="cdk-soca-schedulerprops"></a>






Name | Type | Description 
-----|------|-------------
**ldapUserName**🔹 | <code>string</code> | <span></span>
**ldapUserPassword**🔹 | <code>string</code> | <span></span>
**network**🔹 | <code>[Network](#cdk-soca-network)</code> | <span></span>
**s3InstallBucket**🔹 | <code>string</code> | <span></span>
**s3InstallFolder**🔹 | <code>string</code> | <span></span>
**schedulerSecurityGroup**🔹 | <code>[ISecurityGroup](#aws-cdk-aws-ec2-isecuritygroup)</code> | <span></span>
**storage**🔹 | <code>[EfsStorage](#cdk-soca-efsstorage)</code> | <span></span>
**baseOs**?🔹 | <code>[BaseOS](#cdk-soca-baseos)</code> | __*Optional*__
**customAmi**?🔹 | <code>string</code> | __*Optional*__
**instanceType**?🔹 | <code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code> | __*Optional*__



## struct WorkloadProps 🔹 <a id="cdk-soca-workloadprops"></a>






Name | Type | Description 
-----|------|-------------
**clientIpCidr**?🔹 | <code>string</code> | Default IP(s) allowed to directly SSH into the scheduler and access ElasticSearch.<br/>__*Default*__: not to add any client IP Cidr address
**customAmi**?🔹 | <code>string</code> | Custom AMI if available.<br/>__*Default*__: no custom AMI
**instanceType**?🔹 | <code>[InstanceType](#aws-cdk-aws-ec2-instancetype)</code> | Instance type for your master host(scheduler).<br/>__*Default*__: m5.xlarge
**ldapUserName**?🔹 | <code>string</code> | Username for your default LDAP user.<br/>__*Default*__: 'ldapUserName'
**ldapUserPassword**?🔹 | <code>string</code> | Password for your default LDAP user.<br/>__*Default*__: 'ldapUserPassword!123'
**linuxDistribution**?🔹 | <code>[BaseOS](#cdk-soca-baseos)</code> | Linux distribution.<br/>__*Default*__: amazonlinux2
**s3InstallBucket**?🔹 | <code>string</code> | S3 bucket with your SOCA installer.<br/>__*Default*__: solutions-reference
**s3InstallFolder**?🔹 | <code>string</code> | Name of the S3 folder where you uploaded SOCA.<br/>__*Default*__: scale-out-computing-on-aws/v2.5.0
**sshKeyName**?🔹 | <code>string</code> | Default SSH pem keys used to SSH into the scheduler.<br/>__*Optional*__
**vpcCidr**?🔹 | <code>string</code> | VPC Cidr for the new VPC.<br/>__*Default*__: 10.0.0.0/16



## enum BaseOS 🔹 <a id="cdk-soca-baseos"></a>



Name | Description
-----|-----
**CENTOS_7** 🔹|
**RHEL_7** 🔹|
**AMZN2** 🔹|


