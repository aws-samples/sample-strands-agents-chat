import 'dotenv/config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import {
  Runtime,
  SnapStartConf,
  LayerVersion,
  FunctionUrlAuthType,
  InvokeMode,
  Code,
  LambdaInsightsVersion,
} from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import {
  Bucket,
  BucketProps,
  BlockPublicAccess,
  BucketEncryption,
  ObjectOwnership,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import {
  IdentityPool,
  UserPoolAuthenticationProvider,
} from 'aws-cdk-lib/aws-cognito-identitypool';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsBuild } from 'deploy-time-build';
import {
  S3BucketOrigin,
  FunctionUrlOrigin,
} from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  Distribution,
  ViewerProtocolPolicy,
  AllowedMethods,
  CachePolicy,
  LambdaEdgeEventType,
  experimental,
  OriginRequestPolicy,
  Function,
  FunctionCode,
  FunctionRuntime,
  FunctionEventType,
  FunctionUrlOriginAccessControl,
  Signing,
  ResponseHeadersPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Parameter } from '../parameter.types';
import { v4 as uuid } from 'uuid';
import { execSync, spawnSync } from 'child_process';
import * as path from 'path';

export interface StrandsChatStackProps extends cdk.StackProps {
  readonly webAclArn: string;
  readonly parameter: Parameter;
}

export class StrandsChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StrandsChatStackProps) {
    super(scope, id, props);

    const userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: false,
        email: true,
      },
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
    });

    const userPoolClient = userPool.addClient('UserPoolClient', {
      idTokenValidity: cdk.Duration.days(1),
    });

    const identityPool = new IdentityPool(this, 'IdentityPool', {
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool,
            userPoolClient,
          }),
        ],
      },
    });

    const bucketCommonProps: BucketProps = {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: ObjectOwnership.OBJECT_WRITER,
      enforceSSL: true,
    };

    const fileBucket = new Bucket(this, 'FileBucket', bucketCommonProps);

    fileBucket.addCorsRule({
      allowedOrigins: ['*'],
      allowedMethods: [HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT],
      allowedHeaders: ['*'],
      exposedHeaders: [],
      maxAge: 3000,
    });

    const webBucket = new Bucket(this, 'WebBucket', bucketCommonProps);

    const logsBucket = new Bucket(this, 'LogsBucket', bucketCommonProps);

    const table = new Table(this, 'Table', {
      partitionKey: {
        name: 'queryId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'orderBy',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const resourceIndexName = 'ResourceIndex';

    table.addGlobalSecondaryIndex({
      indexName: resourceIndexName,
      partitionKey: {
        name: 'resourceId',
        type: AttributeType.STRING,
      },
    });

    const dataTypeIndexName = 'DataTypeIndex';

    table.addGlobalSecondaryIndex({
      indexName: dataTypeIndexName,
      partitionKey: {
        name: 'dataType',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'orderBy',
        type: AttributeType.STRING,
      },
    });

    const tavilyApiKey: string | null = props.parameter.tavilyApiKeySecretArn
      ? cdk.SecretValue.secretsManager(
          props.parameter.tavilyApiKeySecretArn
        ).unsafeUnwrap()
      : null;

    const handler = new PythonFunction(this, 'AppHandler', {
      entry: '../api',
      index: 'main.py',
      runtime: Runtime.PYTHON_3_13,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(15),
      snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
      ephemeralStorageSize: cdk.Size.mebibytes(512),
      bundling: {
        assetExcludes: ['.venv', '.ruff_cache', '**/__pycache__'],
      },
      environment: {
        AWS_LWA_INVOKE_MODE: 'RESPONSE_STREAM',
        AWS_LWA_READINESS_CHECK_PATH: '/api/',
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',
        PORT: '8080',
        BUCKET: fileBucket.bucketName,
        TABLE: table.tableName,
        RESOURCE_INDEX_NAME: resourceIndexName,
        DATA_TYPE_INDEX_NAME: dataTypeIndexName,
        PARAMETER: JSON.stringify(props.parameter),
        TAVILY_API_KEY: tavilyApiKey ?? '',
      },
      layers: [
        LayerVersion.fromLayerVersionArn(
          this,
          'LwaLayer',
          // https://github.com/awslabs/aws-lambda-web-adapter?tab=readme-ov-file#lambda-functions-packaged-as-zip-package-for-aws-managed-runtimes
          `arn:aws:lambda:${
            cdk.Stack.of(this).region
          }:753240598075:layer:LambdaAdapterLayerX86:25`
        ),
      ],
      insightsVersion: LambdaInsightsVersion.VERSION_1_0_333_0,
    });

    (handler.node.defaultChild as cdk.CfnResource).addPropertyOverride(
      'Handler',
      'run.sh'
    );

    handler.role?.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:InvokeModel',
        ],
        resources: ['*'],
      })
    );

    handler.role?.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['bedrock-agentcore:*'],
        resources: ['*'],
      })
    );

    fileBucket.grantReadWrite(handler);

    table.grantReadWriteData(handler);

    const apiFunctionUrl = handler.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
      invokeMode: InvokeMode.RESPONSE_STREAM,
    });

    const originRequest = new experimental.EdgeFunction(this, 'OriginRequest', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'index.handler',
      memorySize: 128,
      code: Code.fromAsset('./edge/originRequest', {
        bundling: {
          image: Runtime.NODEJS_22_X.bundlingImage,
          command: ['dummy'],
          local: {
            tryBundle(outputDir: string) {
              const sanitizedOutputDir = path.resolve(outputDir);
              const outfile = path.join(sanitizedOutputDir, 'index.js');

              // Install dependencies
              execSync('npm ci', {
                cwd: 'edge/originRequest',
                stdio: 'inherit',
              });

              // Build with esbuild using spawnSync for safer argument handling
              const result = spawnSync(
                'npx',
                [
                  'esbuild',
                  'index.ts',
                  '--bundle',
                  '--platform=node',
                  '--target=node22',
                  `--outfile=${outfile}`,
                  '--minify',
                ],
                {
                  cwd: 'edge/originRequest',
                  stdio: 'inherit',
                }
              );

              if (result.error) {
                throw result.error;
              }

              return true;
            },
          },
        },
      }),
    });

    const distribution = new Distribution(this, 'Distribution', {
      webAclId: props.webAclArn,
      defaultRootObject: 'index.html',
      enableLogging: true,
      logBucket: logsBucket,
      logFilePrefix: 'cloudfront-access-logs/',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        functionAssociations: [
          {
            eventType: FunctionEventType.VIEWER_REQUEST,
            function: new Function(this, 'Function', {
              runtime: FunctionRuntime.JS_2_0,
              autoPublish: true,
              code: FunctionCode.fromInline(`
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    if (uri.startsWith('/api')) { return request; }
    if (uri.includes('.')) { return request; }
    request.uri = '/index.html';
    return request;
}
`),
            }),
          },
        ],
        responseHeadersPolicy: new ResponseHeadersPolicy(
          this,
          'ResponseHeaderPolicy',
          {
            corsBehavior: {
              accessControlAllowOrigins: ['*'],
              accessControlAllowHeaders: ['*'],
              accessControlAllowMethods: ['ALL'],
              accessControlAllowCredentials: false,
              originOverride: true,
            },
          }
        ),
      },
      additionalBehaviors: {
        'api/*': {
          origin: FunctionUrlOrigin.withOriginAccessControl(apiFunctionUrl, {
            customHeaders: {
              'x-user-pool-id': userPool.userPoolId,
              'x-user-pool-client-id': userPoolClient.userPoolClientId,
            },
            originAccessControl: new FunctionUrlOriginAccessControl(
              this,
              'OAC',
              {
                signing: Signing.SIGV4_ALWAYS,
              }
            ),
            readTimeout: cdk.Duration.seconds(60),
            keepaliveTimeout: cdk.Duration.seconds(60),
            connectionTimeout: cdk.Duration.seconds(10),
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          originRequestPolicy:
            OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          edgeLambdas: [
            {
              functionVersion: originRequest.currentVersion,
              eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
              includeBody: true,
            },
          ],
        },
      },
    });

    const appUrl = `https://${distribution.domainName}`;
    const apiUrl = `${appUrl}/api/`;
    const configEndpoint = `${appUrl}/config.json`;

    const deployWeb = new NodejsBuild(this, 'BuildWeb', {
      assets: [
        {
          path: '../web',
          exclude: ['node_modules', 'dist'],
        },
      ],
      destinationBucket: webBucket,
      distribution: distribution,
      outputSourceDirectory: 'dist',
      buildCommands: ['npm ci', 'npm run build'],
      buildEnvironment: {
        VITE_CONFIG_ENDPOINT: configEndpoint,
      },
    });

    const deployConfig = new BucketDeployment(this, 'ConfigDeployment', {
      sources: [
        Source.jsonData('config.json', {
          uuid: uuid(),
          region: this.region,
          userPoolId: userPool.userPoolId,
          userPoolClientId: userPoolClient.userPoolClientId,
          identityPoolId: identityPool.identityPoolId,
          apiEndpoint: apiUrl,
        }),
      ],
      destinationBucket: webBucket,
      prune: false,
    });

    deployConfig.node.addDependency(deployWeb);

    new cdk.CfnOutput(this, 'ConfigEndpoint', {
      value: configEndpoint,
    });

    new cdk.CfnOutput(this, 'WebUrl', {
      value: appUrl,
    });
  }
}
