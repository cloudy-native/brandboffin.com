import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  Cors,
  CorsOptions,
  DomainName,
  EndpointType,
  LambdaIntegration,
  LambdaRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import {
  ApiGatewayDomain,
  CloudFrontTarget,
} from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Statement } from 'cdk-iam-floyd';
import { Construct } from 'constructs';
import { createLambdaFunction } from './lambdas/utils/lambda-utils';

const CLAUDE_SECRET_NAME = process.env.CLAUDE_SECRET_NAME || 'claude-api';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620';

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
      'ClaudeSecret',
      CLAUDE_SECRET_NAME,
    );

    const brandNameSuggesterFunction = createLambdaFunction(
      this,
      'brands-function',
      {
        entry: 'lib/lambdas/brands-function.ts',
        memorySize: 1024, // Increased memory
        nodeModules: ['@aws-sdk/client-secrets-manager'],
        environment: {
          CLAUDE_MODEL,
          CLAUDE_SECRET_NAME,
        },
      },
    );

    claudeSecret.grantRead(brandNameSuggesterFunction);

    const checkOneDomainFunction = createLambdaFunction(
      this,
      'domains-function',
      {
        entry: 'lib/lambdas/domains-function.ts',
        nodeModules: ['@aws-sdk/client-route-53-domains'],
      },
    );

    checkOneDomainFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toCheckDomainAvailability(),
    );

    const getDomainSuggestionsFunction = createLambdaFunction(
      this,
      'get-domain-suggestions-function',
      {
        entry: 'lib/lambdas/get-domain-suggestions-function.ts',
        nodeModules: ['@aws-sdk/client-route-53-domains'],
      },
    );

    getDomainSuggestionsFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toGetDomainSuggestions(),
    );

    const listTldsFunction = createLambdaFunction(
      this,
      'get-tld-prices-function',
      {
        entry: 'lib/lambdas/get-tld-prices-function.ts',
        nodeModules: ['@aws-sdk/client-route-53-domains'],
      },
    );

    listTldsFunction.addToRolePolicy(
      new Statement.Route53domains().allow().toListPrices(),
    );

    // Define CORS options for all resources
    const defaultCorsPreflightOptions: CorsOptions = {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
      ],
    };

    // Create API Gateway
    const api = new LambdaRestApi(this, 'BrandBoffinApi', {
      handler: brandNameSuggesterFunction, // Default handler
      proxy: false,
      defaultCorsPreflightOptions,
    });

    // Add API routes
    const brands = api.root.addResource('brands', {
      defaultCorsPreflightOptions,
    });
    brands.addMethod('POST', new LambdaIntegration(brandNameSuggesterFunction));

    const domains = api.root.addResource('domains', {
      defaultCorsPreflightOptions,
    });
    domains.addMethod('GET', new LambdaIntegration(checkOneDomainFunction));

    const suggestions = domains.addResource('suggestions', {
      defaultCorsPreflightOptions,
    });
    suggestions.addMethod(
      'GET',
      new LambdaIntegration(getDomainSuggestionsFunction),
    );

    const tlds = api.root.addResource('tlds', {
      defaultCorsPreflightOptions,
    });
    tlds.addMethod('GET', new LambdaIntegration(listTldsFunction));

    // Create S3 bucket for website hosting
    const websiteBucket = new Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Deploy website files from ../public to S3 bucket
    new BucketDeployment(this, 'WebsiteDeployment', {
      sources: [Source.asset('../public')],
      destinationBucket: websiteBucket,
    });

    const rootDomain = domainName.split('.').slice(-2).join('.');
    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: rootDomain,
    });

    // Create single SSL certificate for all domains
    const certificate = new Certificate(this, 'Certificate', {
      domainName: rootDomain,
      subjectAlternativeNames: [`www.${rootDomain}`, apiDomainName],
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // Create origin access identity for S3
    const originAccessIdentity = new OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
    );
    websiteBucket.grantRead(originAccessIdentity);

    // Create CloudFront distribution for website
    const websiteDistribution = new Distribution(this, 'WebsiteDistribution', {
      certificate: certificate,
      domainNames: [rootDomain, `www.${rootDomain}`],
      defaultBehavior: {
        origin: new S3Origin(websiteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
    });

    // Create custom domain for API Gateway (regional endpoint)
    const apiDomain = new DomainName(this, 'ApiDomain', {
      domainName: apiDomainName,
      certificate: certificate,
      endpointType: EndpointType.REGIONAL,
    });

    // Map the API to the custom domain
    apiDomain.addBasePathMapping(api);

    // Create DNS records for website
    new ARecord(this, 'RootDomainARecord', {
      zone: hostedZone,
      recordName: rootDomain,
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
    });

    new ARecord(this, 'WwwARecord', {
      zone: hostedZone,
      recordName: `www.${rootDomain}`,
      target: RecordTarget.fromAlias(new CloudFrontTarget(websiteDistribution)),
    });

    // Create DNS record for API
    new ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      recordName: apiDomainName,
      target: RecordTarget.fromAlias(new ApiGatewayDomain(apiDomain)),
    });
  }
}
