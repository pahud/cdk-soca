import * as soca from './'
import { App, Stack } from '@aws-cdk/core';

const AWS_DEFAULT_REGION = 'ap-northeast-1'

export class IntegTesting {
  readonly stack: Stack[];

  constructor() {
    const app = new App();

    const env = {
      region: process.env.CDK_DEFAULT_REGION ?? AWS_DEFAULT_REGION,
      account: process.env.CDK_DEFAULT_ACCOUNT,
    };

    const stack = new Stack(app, 'soca-testing-stack', { env });

    new soca.Workload(stack, 'Workload');

    this.stack = [stack]
  };
}

// run the integ testing
new IntegTesting();
