const { AwsCdkConstructLibrary } = require('projen');
const { Automation } = require('projen-automate-it');

const AWS_CDK_LATEST_RELEASE = '1.77.0';
const PROJECT_NAME = 'cdk-soca';
const PROJECT_DESCRIPTION = 'cdk-soca is an AWS CDK construct library that allows you to create the Scale-Out Computing on AWS with AWS CDK in TypeScript or Python';
const AUTOMATION_TOKEN = 'AUTOMATION_GITHUB_TOKEN';

const project = new AwsCdkConstructLibrary({
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  repository: 'https://github.com/pahud/cdk-soca.git',
  authorName: 'Pahud Hsieh',
  authorEmail: 'pahudnet@gmail.com',
  stability: 'experimental',
  autoReleaseSchedule: 'never',
  dependabot: false,
  defaultReleaseBranch: 'main',
  devDeps: ['projen-automate-it'],
  keywords: [
    'cdk',
    'aws',
    'soca',
  ],

  catalog: {
    twitter: 'pahudnet',
    announce: false,
  },

  // creates PRs for projen upgrades
  //projenUpgradeSecret: 'AUTOMATION_GITHUB_TOKEN',

  cdkVersion: AWS_CDK_LATEST_RELEASE,
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-elasticsearch',
    '@aws-cdk/aws-efs',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-s3',
  ],

  python: {
    distName: 'cdk-soca',
    module: 'cdk_soca',
  },
});

const automation = new Automation(project, {
  automationToken: AUTOMATION_TOKEN,
});

// generate auto-approve workflow
automation.autoApprove();
// generate auto-merge workflow
automation.autoMerge();
// generate auto yarn and projen upgrade workflow
automation.projenYarnUpgrade();
automation.projenYarnUpgrade('ProjenYarnUpgradeTest', { yarnTest: true });


const common_exclude = ['cdk.out', 'cdk.context.json', 'images', 'yarn-error.log', '.devcontainer.json'];
project.npmignore.exclude(...common_exclude);
project.gitignore.exclude(...common_exclude);


project.synth();
