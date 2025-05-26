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

    const listTldsFunction = new NodejsFunction(this, "get-tld-prices-function", {
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
    });

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

    // Add API Gateway endpoint
    api.root
      .addResource("generate-brand-names")
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

    // Import existing hosted zone for certificate validation
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName,
    });

    // Create certificate for the API domain
    const certificate = new Certificate(this, "ApiCertificate", {
      domainName: apiDomainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    const apiRegionalDomain = new DomainName(this, "ApiRegionalDomain", {
      domainName: apiDomainName,
      certificate,
      endpointType: EndpointType.REGIONAL, // Changed to REGIONAL
    });

    new BasePathMapping(this, "ApiMapping", {
      domainName: apiRegionalDomain,
      restApi: api,
    });

    // CloudFront distribution for the API Gateway
    // The API Gateway's URL is like https://{restapi-id}.execute-api.{region}.amazonaws.com/{stageName}
    // We need the {restapi-id}.execute-api.{region}.amazonaws.com part for HttpOrigin
    // and /{stageName} for originPath.
    const apiGatewayDomainName = Fn.select(2, Fn.split("/", api.url)); // Extracts 'abcdef123.execute-api.us-west-2.amazonaws.com'
    const apiGatewayStagePath = `/${api.deploymentStage.stageName}`; // Extracts '/prod'

    const apiOrigin = new HttpOrigin(apiGatewayDomainName, {
      originPath: apiGatewayStagePath,
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      // Consider adding a custom header for origin verification for added security
      // customHeaders: { 'X-Origin-Verify': 'YOUR_SECRET_VALUE_HERE' }
    });

    const apiDistribution = new Distribution(this, "ApiDistribution", {
      defaultBehavior: {
        origin: apiOrigin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED, // APIs usually don't cache by default
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN, // Managed policy for custom origins with CORS
      },
      domainNames: [apiDomainName],
      certificate: certificate, // This is the certificate for apiDomainName
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: `CloudFront distribution for ${apiDomainName}`,
    });

    // DNS A Record for the API to point to the API's CloudFront distribution
    new ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      recordName: apiDomainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(apiDistribution)),
    });

    new CfnOutput(this, "ApiUrl", {
      value: `https://${apiDomainName}/`,
    });

    // --- Static Website Hosting Setup ---

    // S3 Bucket for website content
    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      publicReadAccess: false, // Keep it private, CloudFront will access it
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html", // Optional: if you have an error.html
      removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production buckets
      autoDeleteObjects: true, // NOT recommended for production buckets
      encryption: BucketEncryption.S3_MANAGED, // Recommended for security
    });

    // Origin Access Identity to allow CloudFront to access the S3 bucket
    const originAccessIdentity = new OriginAccessIdentity(this, "WebsiteOAI");
    websiteBucket.grantRead(originAccessIdentity);

    // Certificate for the website domain (if different from apiDomainName or not covered)
    // Assuming props.domainName is the root domain for the website, e.g., example.com
    const websiteCertificate = new Certificate(this, "WebsiteCertificate", {
      domainName: props.domainName,
      subjectAlternativeNames: [`www.${props.domainName}`], // Optional: if you want to support www too
      validation: CertificateValidation.fromDns(hostedZone), // Uses the same hostedZone as the API
    });

    // CloudFront distribution for the website
    const websiteDistribution = new Distribution(this, "WebsiteDistribution", {
      defaultRootObject: "index.html",
      domainNames: [props.domainName, `www.${props.domainName}`], // Match certificate SANs
      certificate: websiteCertificate,
      defaultBehavior: {
        origin: new S3Origin(websiteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED, // Good default for static sites
      },
      priceClass: PriceClass.PRICE_CLASS_100,
      comment: `CloudFront distribution for ${props.domainName} website`,
    });

    // DNS A Records for the website (root and www) to point to CloudFront
    new ARecord(this, "WebsiteAliasRecord", {
      zone: hostedZone,
      recordName: props.domainName, // For the root domain
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
    });
    new ARecord(this, "WwwWebsiteAliasRecord", {
      zone: hostedZone,
      recordName: `www.${props.domainName}`, // For the www subdomain
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
    });

    // Deploy website content from a local directory to the S3 bucket
    // Make sure you have a 'dist' folder at the root of your project (sibling to 'cdk' folder)
    // or adjust path. It should contain your website's build output (index.html, etc.)
    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(path.join(__dirname, "../../public"))], 
      destinationBucket: websiteBucket,
      distribution: websiteDistribution, // Optional: to invalidate CloudFront cache on deployment
      distributionPaths: ["/*"], // Optional: paths to invalidate
    });

    // Output the website URL
    new CfnOutput(this, "WebsiteUrl", {
      value: `https://${props.domainName}`,
    });

    // Output the S3 bucket name
    new CfnOutput(this, "WebsiteBucketName", {
      value: websiteBucket.bucketName,
    });

    // Output the Website CloudFront Distribution ID
    new CfnOutput(this, "WebsiteDistributionId", {
      value: websiteDistribution.distributionId,
    });
  }
}
