#!/opt/homebrew/opt/node/bin/node
import { App } from "aws-cdk-lib";
import { BrandBoffinStack } from "../lib/brandboffin-stack";

const app = new App();

const tags = {
  Project: "brandboffin.com",
  Environment: "production",
  Author: "stephen",
};

const domainName = "brandboffin.com";
const apiDomainName = `api.${domainName}`;

new BrandBoffinStack(app, "BrandBoffinStack", {
  domainName,
  apiDomainName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  tags,
  description: "Domain availability checking API",
});
