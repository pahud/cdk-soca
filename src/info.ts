export const SocaInfo = {
  Data: {
    ClusterIdPrefix: 'soca',
    Version: '2.5.0',
  },
  User: {
    centos7: 'centos',
    amazonlinux2: 'ec2-user',
    rhel7: 'ec2-user',
  }
}

export const RegionMap: { [region: string]: { [dist: string]: string } } = {
  // Hong Kong
  'ap-east-1': {
    'rhel7': 'ami-1a453e6b',
    'centos7': 'ami-68e59c19',
    'amazonlinux2': 'ami-570c7726',
  },
  // Tokyo
  'ap-northeast-1': {
    'rhel7': 'ami-00b95502a4d51a07e',
    'centos7': 'ami-045f38c93733dd48d',
    'amazonlinux2': 'ami-0c3fd0f5d33134a76',
  },
}
