#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CloudPlotStack } from '../lib/cloud-plot-stack';

const app = new cdk.App();
new CloudPlotStack(app, 'CloudPlotStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
