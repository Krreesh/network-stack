const ec2 = require ('aws-cdk-lib/aws-ec2')
const cdk = require ('aws-cdk-lib')
const iam = require ('aws-cdk-lib/aws-iam')
// import * as cdk from '@aws-cdk/core';
class NetworkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create new VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      cidr: '13.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
            {
              cidrMask: 24,
              name: 'ingress',
              subnetType: ec2.SubnetType.PUBLIC,
              mapPublicIpOnLaunch: true
            },
            {
              cidrMask: 24,
              name: 'application',
              subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            {
              cidrMask: 28,
              name: 'rds',
              subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            }
        ],
        
    });

    // Open port 22 for SSH connection from anywhere
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: "ssh-sg",
      description: 'Allow ssh access to ec2 instances from anywhere',
      allowAllOutbound: true 
    });
    sshSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')
    
    const websg = new ec2.SecurityGroup(this, 'WebSg', {
      vpc,
      securityGroupName: 'http-sg',
      description: 'Allow all http traffic on port 80',
      allowAllOutbound: true
    })
    websg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow internet access')
    // We are using the latest AMAZON LINUX AMI
    const awsAMI = new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 });
    // Create IAM role to allow Security Manager access ec2 instance
    const role = new iam.Role (this, 'Role', {
      assumedBy: new iam.ServicePrincipal ('ec2.amazonaws.com'),
      description: 'Allow Security Manager access ec2 instance'
    })
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))
    // Instance details
    const ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: awsAMI,
      vpcSubnets: 'ingress',
      keyName: 'asmita23nv',
      role: role,
      securityGroup: sshSecurityGroup 
    });
    ec2Instance.addSecurityGroup(websg)
  }
}

module.exports = { NetworkStack }