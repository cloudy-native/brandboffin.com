import { Duration } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Construct } from "constructs";

// Define a more specific type for the core logic handler
export type CoreLambdaLogic<TRequestBody, TResponseBody> = (
  payload: {
    body?: TRequestBody;
    queryStringParameters?: APIGatewayProxyEvent["queryStringParameters"];
    pathParameters?: APIGatewayProxyEvent["pathParameters"];
  },
  event: APIGatewayProxyEvent, // Full event for access to other properties if needed
) => Promise<TResponseBody>;

export interface ApiHandlerOptions<TRequestBody> {
  allowedMethods: string[];
  isBodyRequired?: boolean; // For POST/PUT, usually true
  defaultRequestBody?: TRequestBody;
}

// Custom error class for handlers to throw
export class HttpError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "HttpError"; // Set the error name
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype); // To make 'instanceof HttpError' work
  }
}

// Common Lambda function configuration
export const COMMON_FUNCTION_PROPS: Partial<NodejsFunctionProps> = {
  runtime: Runtime.NODEJS_18_X,
  handler: "handler",
  timeout: Duration.seconds(60),
  memorySize: 1024,
};

// Common bundling configuration
export const COMMON_BUNDLING_CONFIG = {
  minify: true,
  sourceMap: true,
  esbuildArgs: {
    "--packages": "bundle",
    "--tree-shaking": "true",
    "--platform": "node",
  },
  externalModules: ["@aws-sdk/*"],
};

// Common environment configuration
export const COMMON_ENVIRONMENT = {
  NODE_OPTIONS: "--enable-source-maps",
  NODE_ENV: "production",
};

// Factory function for creating Lambda functions with common configuration
export function createLambdaFunction(
  scope: Construct,
  id: string,
  props: Partial<NodejsFunctionProps> & {
    nodeModules?: string[];
    // environment is already part of NodejsFunctionProps
    // entry is already part of NodejsFunctionProps
  } = {},
): NodejsFunction {
  const { nodeModules, ...overrideProps } = props;
  return new NodejsFunction(scope, id, {
    ...COMMON_FUNCTION_PROPS, // Start with common defaults
    ...overrideProps, // Apply overrides from props (like entry, environment, memorySize)
    bundling: {
      ...COMMON_BUNDLING_CONFIG,
      nodeModules: nodeModules || [], // Specific handling for nodeModules
    },
    // Ensure environment from props merges with COMMON_ENVIRONMENT correctly
    environment: {
      ...COMMON_ENVIRONMENT,
      ...(overrideProps.environment || {}),
    },
  });
}

export function createApiHandler<TRequestBody, TResponseBody>(
  coreLogic: CoreLambdaLogic<TRequestBody, TResponseBody>,
  options: ApiHandlerOptions<TRequestBody>,
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  console.log("Creating API handler for", options.allowedMethods);
  return async (
    event: APIGatewayProxyEvent,
  ): Promise<APIGatewayProxyResult> => {
    console.log("Event:", event);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
      "Access-Control-Allow-Headers":
        "Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, Accept",
      "Content-Type": "application/json",
    };

    // OPTIONS requests should now be handled by API Gateway CORS, but keep as fallback
    if (event.httpMethod === "OPTIONS") {
      console.log("Returning 204 for OPTIONS");
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    if (!options.allowedMethods.includes(event.httpMethod)) {
      console.log("Returning 405 for", event.httpMethod);
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
    }

    let parsedBody: TRequestBody | undefined = options.defaultRequestBody;

    if (
      event.httpMethod === "POST" ||
      event.httpMethod === "PUT" ||
      event.httpMethod === "PATCH"
    ) {
      if (options.isBodyRequired && !event.body) {
        console.log("Returning 400 for missing body");
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ message: "Request body is required" }),
        };
      }
      if (event.body) {
        console.log("Event body:", event.body);
        try {
          parsedBody = JSON.parse(event.body);
        } catch {
          console.log("Invalid JSON in request body");
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Invalid JSON in request body" }),
          };
        }
      }
    }

    if (
      options.isBodyRequired &&
      (parsedBody === undefined || parsedBody === null) &&
      (event.httpMethod === "POST" ||
        event.httpMethod === "PUT" ||
        event.httpMethod === "PATCH")
    ) {
      console.log("Returning 400 for missing body");
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          message:
            "Valid request body is required and could not be parsed or was missing.",
        }),
      };
    }

    try {
      console.log("Calling core logic");
      const result = await coreLogic(
        {
          body: parsedBody,
          queryStringParameters: event.queryStringParameters,
          pathParameters: event.pathParameters,
        },
        event,
      );
      console.log("Core logic result:", result);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    } catch (error: unknown) {
      console.error("Error in API handler:", error);
      if (error instanceof HttpError) {
        console.log("Returning error", error.statusCode);
        return {
          statusCode: error.statusCode,
          headers: corsHeaders,
          body: JSON.stringify({
            message: error.message,
            details: error.details,
          }),
        };
      }
      // Generic error for unexpected issues
      console.log("Returning 500 for unexpected error");
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Internal Server Error" }),
      };
    }
  };
}
