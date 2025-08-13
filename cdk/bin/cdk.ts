#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StrandsChatStack } from '../lib/strands-chat-stack';
import { WafStack } from '../lib/waf-stack';
import { parameter } from '../parameter';

const app = new cdk.App();

const wafStack = new WafStack(app, 'StrandsChatWaf', {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

new StrandsChatStack(app, 'StrandsChat', {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: parameter.appRegion,
  },
  webAclArn: wafStack.webAclArn,
  parameter,
});
