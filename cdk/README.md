# Claude Color Theme Generator CDK Project

This project uses AWS CDK to deploy a serverless API that generates color themes using Claude AI. The Lambda function is written in TypeScript and fetches API credentials securely from AWS Secrets Manager at runtime.

## Project Structure

```
claude-color-theme-cdk/
├── bin/
│   └── claude-color-theme.ts      # CDK app entry point
├── lib/
│   └── claude-color-theme-stack.ts # Main CDK stack definition
├── lambda/
│   ├── index.ts                   # TypeScript Lambda function
│   ├── package.json               # Lambda dependencies
│   └── tsconfig.json              # TypeScript configuration for Lambda
├── package.json                   # CDK project dependencies
├── tsconfig.json                  # TypeScript configuration for CDK
└── README.md                      # This file
```

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js (v14 or later) and npm installed
3. AWS CDK CLI installed (`npm install -g aws-cdk`)
4. Claude API key from Anthropic

## Setup Instructions

### 1. Initialize the project

```bash
# Clone the repository or create a new directory
mkdir claude-color-theme-cdk
cd claude-color-theme-cdk

# Copy all the files from this repository structure
# Create directories
mkdir -p bin lib lambda

# Install dependencies
npm install
```

### 2. Install Lambda dependencies

```bash
cd lambda
npm install
cd ..
```

### 3. Store your Claude API key in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name claude-api-secret \
  --description "API Key for Claude AI" \
  --secret-string '{"key":"your-claude-api-key"}'
```

### 4. Build Lambda TypeScript code

```bash
cd lambda
npm run build
cd ..
```

### 5. Deploy the CDK stack

```bash
# Bootstrap CDK (if you haven't already in this AWS account/region)
cdk bootstrap

# Deploy the stack
cdk deploy
```

After deployment completes, the CDK will output the API Gateway URL that you can use to make requests.

## Making Requests to the API

Send POST requests to the API Gateway URL with the following JSON body:

```json
{
  "prompt": "Create a color theme for a beach resort website"
}
```

The API will return a JSON response with color values:

```json
{
  "primary": "#4FB0AE",
  "secondary": "#F6D55C",
  "accent": "#ED553B",
  "background": "#F6F6F6",
  "text": "#333333"
}
```

## Security Features

1. **Runtime Secret Retrieval**: The Lambda function retrieves the Claude API key from AWS Secrets Manager at runtime, rather than storing it in environment variables.

2. **Type Safety**: The TypeScript implementation provides strong typing for better code quality and runtime safety.

3. **CORS Protection**: The API Gateway is configured with CORS settings that you can restrict to your specific domains in production.

4. **Error Handling**: Comprehensive error handling ensures graceful responses even when failures occur.

## Customization

- **CORS Settings**: By default, the API allows requests from any origin. For production, update the CORS settings in the CDK stack to specify your domain.
- **Theme Format**: You can modify the system prompt in the Lambda function to change the color theme format.
- **Claude Model**: You can change the Claude model by updating the `model` parameter in the Lambda function.
- **Secret Name**: You can modify the secret name in both the Lambda function and CDK stack if needed.

## Cleanup

To remove all resources created by this CDK stack:

```bash
cdk destroy
```

This will delete the Lambda function, API Gateway, and associated resources. The Claude API key secret in Secrets Manager will need to be deleted separately if no longer needed:

```bash
aws secretsmanager delete-secret \
  --secret-id claude-api-secret \
  --recovery-window-in-days 7
```