# Welcome to `cdk-soca`

`cdk-soca` is an AWS CDK construct library that allows you to create the [Scale-Out Computing on AWS](https://aws.amazon.com/tw/solutions/implementations/scale-out-computing-on-aws/) with AWS CDK in `TypeScript` or `Python`.


# Sample 

```ts
import * as soca from 'cdk-soca';

// create the CDK application
const app = new App();

// create the stack in the CDK app
const stack = new Stack(app, 'soca-testing-stack');

// create the workload in the CDK stack
new soca.Workload(stack, 'Workload');
```

That's all!



