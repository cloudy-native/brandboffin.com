# Brandboffin CDK Infrastructure

This project uses AWS CDK to deploy serverless APIs for the Brandboffin domain suggestion and brand management platform. The Lambda functions provide domain availability checking, brand name generation, and TLD pricing information.

## Project Structure

```
brandboffin-cdk/
├── bin/
│   └── brand-boffin.ts            # CDK app entry point
├── lib/
│   └── brandboffin-stack.ts       # Main CDK stack definition
├── lib/lambdas/
│   ├── get-domain-suggestions-function.ts  # Domain suggestion Lambda
│   ├── brands-function.ts                  # Brand management Lambda
│   ├── domains-function.ts                 # Domain operations Lambda
│   ├── get-tld-prices-function.ts          # TLD pricing Lambda
│   └── package.json                        # Lambda dependencies
├── package.json                   # CDK project dependencies
├── tsconfig.json                  # TypeScript configuration for CDK
└── README.md                      # This file
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js (v14 or later) and npm installed
3. AWS CDK CLI installed (`npm install -g aws-cdk`)

## Setup Instructions

### 1. Initialize the project

```bash
# Install dependencies
npm install
```

### 2. Install Lambda dependencies

```bash
cd lib/lambdas
npm install
cd ../..
```

### 3. Deploy the CDK stack

```bash
# Bootstrap CDK (if you haven't already in this AWS account/region)
cdk bootstrap

# Deploy the stack
cdk deploy
```

After deployment completes, the CDK will output the API Gateway URLs for each Lambda function.

## API Endpoints

The deployed APIs provide:
- **Domain Suggestions**: Generate brand name and domain suggestions
- **Brand Management**: CRUD operations for brand data
- **Domain Operations**: Check domain availability and manage domains
- **TLD Pricing**: Retrieve pricing for top-level domains

## Security Features

1. **Type Safety**: TypeScript implementation for better code quality
2. **CORS Protection**: API Gateway configured with CORS settings
3. **Error Handling**: Comprehensive error handling for graceful responses

## Customization

- **CORS Settings**: Update CORS settings in the CDK stack for production domains
- **API Configuration**: Modify Lambda functions to adjust API behavior
- **Resource Configuration**: Adjust AWS resource configurations as needed

## Cleanup

To remove all resources created by this CDK stack:

```bash
cdk destroy
```
