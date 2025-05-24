#!/opt/homebrew/opt/node/bin/node
import { App, Environment, Tags } from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";
import { CertificateStack } from "../lib/certificate-stack";

const app = new App();

const tags = {
  Project: "lingohog.com",
  Environment: "production",
  Author: "stephen",
};

const domainName = "lingohog.com";
const apiDomainName = `api.${domainName}`;

const certificateStack = new CertificateStack(app, "BrandlyCertificateStack", {
  domainName,
  certificateDomainName: apiDomainName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", // Required for API Gateway certificates
  },
  description: "SSL certificate for API Gateway custom domain",
});

// API Gateway stack in ap-southeast-1
const apiStack = new ApiStack(
  app,
  "BrandlyApiStack",
  certificateStack, // Pass certificate stack reference
  {
    domainName,
    apiDomainName,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    tags,
    description: "Domain availability checking API",
    crossRegionReferences: true, // Enable cross-region resource referencing
  }
);

// Ensure certificate is created before API stack
apiStack.addDependency(certificateStack);
