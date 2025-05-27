import {
  CfnOutput,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import {
  BasePathMapping,
  Cors,
  DomainName,
  EndpointType,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Statement } from "cdk-iam-floyd";
import { Construct } from "constructs";
import * as path from "path";

const CLAUDE_SECRET_NAME = process.env.CLAUDE_SECRET_NAME || "claude-api";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620";

export interface BrandBoffinStackProps extends StackProps {
  domainName: string;
  apiDomainName: string;
}

export class BrandBoffinStack extends Stack {
  constructor(scope: Construct, id: string, props: BrandBoffinStackProps) {
    super(scope, id, props);

    const { domainName, apiDomainName } = props;
    const claudeSecret = Secret.fromSecretNameV2(
      this,
      "ClaudeSecret",
      CLAUDE_SECRET_NAME
    );

    const commonFunctionProps = {
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      timeout: Duration.seconds(60),
      memorySize: 512,
      logRetention: RetentionDays.ONE_WEEK,
    };

    const brandNameSuggesterFunction = new NodejsFunction(
      this,
      "brand-name-suggester-function",
      {
        ...commonFunctionProps,
        bundling: {
          minify: true,
          sourceMap: true,
          // Fix for esbuild 0.22.0+ breaking change (notice #30717)
          esbuildArgs: {
            "--packages": "bundle",
            "--tree-shaking": "true",
            "--platform": "node",
          },
          externalModules: ["@aws-sdk/*"],
          nodeModules: ["@aws-sdk/client-secrets-manager"],
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          CLAUDE_MODEL,
          CLAUDE_SECRET_NAME,
          NODE_ENV: "production",
        },
      }
    );

    claudeSecret.grantRead(brandNameSuggesterFunction);

    const checkOneDomainFunction = new NodejsFunction(
      this,
      "check-domain-function",
      {
        ...commonFunctionProps,
        bundling: {
          minify: true,
          sourceMap: true,
          // Fix for esbuild 0.22.0+ breaking change (notice #30717)
          esbuildArgs: {
            "--packages": "bundle",
            "--tree-shaking": "true",
            "--platform": "node",
          },
          externalModules: ["@aws-sdk/*"],
          nodeModules: ["@aws-sdk/client-route-53-domains"],
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          NODE_ENV: "production",
        },
      }
    );

    checkOneDomainFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toCheckDomainAvailability()
    );

    const checkBatchDomainsFunction = new NodejsFunction(
      this,
      "check-batch-domains-function",
      {
        ...commonFunctionProps,
        bundling: {
          minify: true,
          sourceMap: true,
          // Fix for esbuild 0.22.0+ breaking change (notice #30717)
          esbuildArgs: {
            "--packages": "bundle",
            "--tree-shaking": "true",
            "--platform": "node",
          },
          externalModules: ["@aws-sdk/*"],
          nodeModules: ["@aws-sdk/client-route-53-domains"],
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          NODE_ENV: "production",
        },
      }
    );

    checkBatchDomainsFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toCheckDomainAvailability()
    );

    const getDomainSuggestionsFunction = new NodejsFunction(
      this,
      "get-domain-suggestions-function",
      {
        ...commonFunctionProps,
        bundling: {
          minify: true,
          sourceMap: true,
          esbuildArgs: {
            "--packages": "bundle",
            "--tree-shaking": "true",
            "--platform": "node",
          },
          externalModules: ["@aws-sdk/*"],
          nodeModules: ["@aws-sdk/client-route-53-domains"],
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          NODE_ENV: "production",
        },
      }
    );

    getDomainSuggestionsFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toGetDomainSuggestions()
    );

    const listTldsFunction = new NodejsFunction(
      this,
      "get-tld-prices-function",
      {
        ...commonFunctionProps,
        bundling: {
          minify: true,
          sourceMap: true,
          esbuildArgs: {
            "--packages": "bundle",
            "--tree-shaking": "true",
            "--platform": "node",
          },
          externalModules: ["@aws-sdk/*"],
          nodeModules: ["@aws-sdk/client-route-53-domains"],
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          NODE_ENV: "production",
        },
      }
    );

    listTldsFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toListPrices()
    );

    // Create API Gateway
    const api = new RestApi(this, "BrandCheckerApi", {
      restApiName: "Brand Checker API",
      description: "API for checking brand names and domain availability",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        maxAge: Duration.days(1),
      },
      deployOptions: {
        stageName: "prod",
        throttlingRateLimit: 10,
        throttlingBurstLimit: 20,
      },
    });

    api.root
      .addResource("suggest-brand-names")
      .addMethod("POST", new LambdaIntegration(brandNameSuggesterFunction));

    api.root
      .addResource("check-domain")
      .addMethod("POST", new LambdaIntegration(checkOneDomainFunction));

    api.root
      .addResource("check-batch-domains")
      .addMethod("POST", new LambdaIntegration(checkBatchDomainsFunction));

    api.root
      .addResource("suggest-domains")
      .addMethod("POST", new LambdaIntegration(getDomainSuggestionsFunction));

    api.root
      .addResource("tlds")
      .addMethod("POST", new LambdaIntegration(listTldsFunction));

    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName,
    });
    const certificate = new Certificate(this, "ApiCertificate", {
      domainName: apiDomainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const apiRegionalDomain = new DomainName(this, "ApiRegionalDomain", {
      domainName: apiDomainName,
      certificate,
      endpointType: EndpointType.REGIONAL,
    });

    new BasePathMapping(this, "ApiMapping", {
      domainName: apiRegionalDomain,
      restApi: api,
    });

    const apiGatewayDomainName = Fn.select(2, Fn.split("/", api.url));
    const apiGatewayStagePath = `/${api.deploymentStage.stageName}`;

    const apiOrigin = new HttpOrigin(apiGatewayDomainName, {
      originPath: apiGatewayStagePath,
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
    });

    const apiDistribution = new Distribution(this, "ApiDistribution", {
      defaultBehavior: {
        origin: apiOrigin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
      },
      domainNames: [apiDomainName],
      certificate: certificate,
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: `CloudFront distribution for ${apiDomainName}`,
    });

    new ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      recordName: apiDomainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(apiDistribution)),
    });

    new CfnOutput(this, "ApiUrl", {
      value: `https://${apiDomainName}/`,
    });

    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
    });

    const originAccessIdentity = new OriginAccessIdentity(this, "WebsiteOAI");
    websiteBucket.grantRead(originAccessIdentity);

    const websiteCertificate = new Certificate(this, "WebsiteCertificate", {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`],
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const websiteDistribution = new Distribution(this, "WebsiteDistribution", {
      defaultRootObject: "index.html",
      domainNames: [props.domainName, `www.${props.domainName}`],
      certificate: websiteCertificate,
      defaultBehavior: {
        origin: new S3Origin(websiteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: `CloudFront distribution for ${props.domainName} website`,
    });

    new ARecord(this, "WebsiteAliasRecord", {
      zone: hostedZone,
      recordName: props.domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
    });
    new ARecord(this, "WwwWebsiteAliasRecord", {
      zone: hostedZone,
      recordName: `www.${props.domainName}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
    });

    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(path.join(__dirname, "../../public"))],
      destinationBucket: websiteBucket,
      distribution: websiteDistribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "WebsiteUrl", {
      value: `https://${props.domainName}`,
    });

    new CfnOutput(this, "WebsiteBucketName", {
      value: websiteBucket.bucketName,
    });
    new CfnOutput(this, "WebsiteDistributionId", {
      value: websiteDistribution.distributionId,
    });
  }
}
