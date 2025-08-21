#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StrandsChatStack } from '../lib/strands-chat-stack';
import { WafStack } from '../lib/waf-stack';
import { Parameter, ParameterSchema } from '../parameter.types';
import { parameter } from '../parameter';

const validatedParameter: Parameter = ParameterSchema.parse(parameter);
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
    region: validatedParameter.appRegion,
  },
  webAclArn: wafStack.webAclArn,
  parameter: validatedParameter,
});
