import * as cdk from '@aws-cdk/core';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import { Cluster, FargateTaskDefinition, FargateService, LogDrivers, ContainerImage, FargatePlatformVersion, ContainerDefinition } from '@aws-cdk/aws-ecs';
import { LogGroup, RetentionDays } from '@aws-cdk/aws-logs';
import { FileSystem, PerformanceMode, LifecyclePolicy } from '@aws-cdk/aws-efs';
import { Vpc, SecurityGroup, Port } from '@aws-cdk/aws-ec2';
import { Bucket } from '@aws-cdk/aws-s3';
import path = require('path');

const resolveRoot = (relativePath: string) => path.resolve(__dirname, '../', relativePath);


export class CloudPlotStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const context = scope.node.tryGetContext('chia');

    const vpc = new Vpc(this, 'VPC', { });

    const singleAZSubnet = vpc.privateSubnets.filter((net) => {return net.availabilityZone == vpc.availabilityZones[0]});

    const secGroup = new SecurityGroup(this, 'SecGroup', {
      vpc
    })

    const cluster = new Cluster(this, 'Cluster', { vpc });

    const taskLogGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/ecs/${this.stackName}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const s3Bucket = new Bucket(this, 'Bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const efsFS = new FileSystem(this, 'FileSystem', {
      vpc,
      lifecyclePolicy: LifecyclePolicy.AFTER_7_DAYS,
      performanceMode: PerformanceMode.GENERAL_PURPOSE,
      vpcSubnets: {
        subnets: singleAZSubnet
      },
      securityGroup: secGroup,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const volumeConfig = {
      name: 'efs-volume',
      efsVolumeConfiguration: {
        fileSystemId: efsFS.fileSystemId
      }
    }

    const taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      cpu: 2048,
      memoryLimitMiB: 6144,
      volumes: [
        volumeConfig
      ]
    });

    const image = new DockerImageAsset(this, 'Image', { directory: resolveRoot('modules/plotter/') });

    const containerDef = new ContainerDefinition(this, 'Container', {
      taskDefinition,
      image: ContainerImage.fromDockerImageAsset(image),
      logging: LogDrivers.awsLogs({ logGroup: taskLogGroup, streamPrefix: this.stackName }),
      environment: {
        FARM_KEY: context.FARM_KEY,
        POOL_KEY: context.POOL_KEY,
        S3_BUCKET: s3Bucket.bucketName
      },
    });

    containerDef.addMountPoints({
      sourceVolume: volumeConfig.name,
      containerPath: '/mount/efs',
      readOnly: false
    });

    const service = new FargateService(this, 'Service', {
        serviceName: 'plotter-service',
        cluster: cluster,
        taskDefinition,
        desiredCount: context.parallelFactor,
        platformVersion: FargatePlatformVersion.VERSION1_4,
        vpcSubnets: {
          subnets: singleAZSubnet
        },
        securityGroups: [secGroup]
    });

    service.connections.allowFrom(efsFS, Port.tcp(2049));
    service.connections.allowTo(efsFS, Port.tcp(2049));

    s3Bucket.grantPut(taskDefinition.taskRole)
  }
}
