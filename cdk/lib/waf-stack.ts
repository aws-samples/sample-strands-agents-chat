import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class WafStack extends cdk.Stack {
  public readonly webAclArn: string;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const allIpv4 = new wafv2.CfnIPSet(this, 'AllowedIpv4Set', {
      name: 'StrandsChatIpv4',
      scope: 'CLOUDFRONT',
      ipAddressVersion: 'IPV4',
      addresses: ['0.0.0.0/1', '128.0.0.0/1'],
    });

    const allIpv6 = new wafv2.CfnIPSet(this, 'AllowedIpv6Set', {
      name: 'StrandsChatIpv6',
      scope: 'CLOUDFRONT',
      ipAddressVersion: 'IPV6',
      addresses: ['::/1', '8000::/1'],
    });

    const webAcl = new wafv2.CfnWebACL(this, 'GlobalWebAcl', {
      name: 'StrandsChatGlobalWaf',
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'GlobalWebAcl',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'BlockIpNotInAllowList',
          priority: 0,
          action: { block: {} },
          statement: {
            notStatement: {
              statement: {
                orStatement: {
                  statements: [
                    { ipSetReferenceStatement: { arn: allIpv4.attrArn } },
                    { ipSetReferenceStatement: { arn: allIpv6.attrArn } },
                  ],
                },
              },
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'IpRangeEnforce',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 10,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
              excludedRules: [{ name: 'SizeRestrictions_BODY' }],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    this.webAclArn = webAcl.attrArn;
  }
}
