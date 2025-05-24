import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
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
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { CnameRecord, HostedZone } from "aws-cdk-lib/aws-route53";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Statement } from "cdk-iam-floyd";
import { Construct } from "constructs";
import { CertificateStack } from "./certificate-stack";

const CLAUDE_SECRET_NAME = process.env.CLAUDE_SECRET_NAME || "claude-api";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20240620";

export interface ApiStackProps extends StackProps {
  domainName: string;
  apiDomainName: string;
}

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    certificateStack: CertificateStack,
    props: ApiStackProps
  ) {
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
          nodeModules: ["@aws-sdk/client-secrets-manager"], // Explicitly include these modules
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps", // Better error stack traces
          CLAUDE_MODEL,
          CLAUDE_SECRET_NAME,
          NODE_ENV: "production",
        },
      }
    );

    claudeSecret.grantRead(brandNameSuggesterFunction);

    const checkOneDomainFunction = new NodejsFunction(
      this,
      "check-one-domain-function",
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
          nodeModules: ["@aws-sdk/client-route-53-domains"], // Explicitly include these modules
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps", // Better error stack traces
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
          nodeModules: ["@aws-sdk/client-route-53-domains"], // Explicitly include these modules
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps", // Better error stack traces
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

    const listTldsFunction = new NodejsFunction(this, "list-tlds-function", {
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
        allowOrigins: Cors.ALL_ORIGINS, // In production, specify your domain
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

    // Add Lambda integration
    const brandNameSuggesterIntegration = new LambdaIntegration(
      brandNameSuggesterFunction
    );
    const checkOneDomainIntegration = new LambdaIntegration(
      checkOneDomainFunction
    );
    const checkBatchDomainsIntegration = new LambdaIntegration(
      checkBatchDomainsFunction
    );
    const getDomainSuggestionsIntegration = new LambdaIntegration(
      getDomainSuggestionsFunction
    );
    const listTldsIntegration = new LambdaIntegration(listTldsFunction);

    // Add API Gateway endpoint
    const brandNameSuggesterResource = api.root.addResource(
      "generate-brand-names"
    );
    brandNameSuggesterResource.addMethod("POST", brandNameSuggesterIntegration);

    const checkOneDomainResource = api.root.addResource("check-domain");
    checkOneDomainResource.addMethod("POST", checkOneDomainIntegration);

    const checkBatchDomainsResource = api.root.addResource(
      "check-batch-domains"
    );
    checkBatchDomainsResource.addMethod("POST", checkBatchDomainsIntegration);

    const getDomainSuggestionsResource = api.root.addResource(
      "suggest-domains"
    );
    getDomainSuggestionsResource.addMethod(
      "POST",
      getDomainSuggestionsIntegration
    );

    const listTldsResource = api.root.addResource("tlds");
    listTldsResource.addMethod("GET", listTldsIntegration);

    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName,
    });

    const certificate = Certificate.fromCertificateArn(
      this,
      'ImportedCertificate',
      certificateStack.certificateArn
    );

    const domain = new DomainName(this, "ApiDomain", {
      domainName: apiDomainName,
      certificate,
      endpointType: EndpointType.EDGE,
    });

    new BasePathMapping(this, "ApiMapping", {
      domainName: domain,
      restApi: api,
    });

    new CnameRecord(this, "ApiCnameRecord", {
      zone: hostedZone,
      recordName: apiDomainName, // api.brandchecker.com
      domainName: domain.domainNameAliasDomainName,
    });

    // Output the API URL
    new CfnOutput(this, "BrandCheckerApiUrl", {
      value: `${api.url}`,
      description: "URL for the Brand Checker API",
    });
  }
}
