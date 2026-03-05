#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BgvServerlessStack } from '../lib/bgv-serverless-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION || 'us-east-1';

new BgvServerlessStack(app, 'BgvServerlessDevStack', {
  env: { account, region },
  stage: 'dev'
});

// new BgvServerlessStack(app, 'BgvServerlessProdStack', {
//   env: { account, region },
//   stage: 'prod'
// });