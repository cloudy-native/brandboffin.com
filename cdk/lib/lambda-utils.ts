import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Define a more specific type for the core logic handler
export type CoreLambdaLogic<TRequestBody, TResponseBody> = (
  payload: {
    body?: TRequestBody;
    queryStringParameters?: APIGatewayProxyEvent['queryStringParameters'];
    pathParameters?: APIGatewayProxyEvent['pathParameters'];
  },
  event: APIGatewayProxyEvent // Full event for access to other properties if needed
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
    this.name = 'HttpError'; // Set the error name
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, HttpError.prototype); // To make 'instanceof HttpError' work
  }
}

export function createApiHandler<TRequestBody, TResponseBody>(
  coreLogic: CoreLambdaLogic<TRequestBody, TResponseBody>,
  options: ApiHandlerOptions<TRequestBody>
): (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> {
  console.log("Creating API handler for", options.allowedMethods);
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Event:", event);
    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': options.allowedMethods.join(', ') + (options.allowedMethods.includes('OPTIONS') ? '' : ', OPTIONS'),
      'Content-Type': 'application/json',
    };
console.log("Cors headers:", corsHeaders);

    if (event.httpMethod === 'OPTIONS') {
      console.log("Returning 204 for OPTIONS");
      return { statusCode: 204, headers: corsHeaders, body: '' }; // 204 No Content for OPTIONS
    }

    if (!options.allowedMethods.includes(event.httpMethod)) {
      console.log("Returning 405 for", event.httpMethod);
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    let parsedBody: TRequestBody | undefined = options.defaultRequestBody;

    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
          if (options.isBodyRequired && !event.body) {
        console.log("Returning 400 for missing body");
        return {
          statusCode: 400,  
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Request body is required' }),
        };
      }
      if (event.body) {
        console.log("Event body:", event.body);
        try {
          parsedBody = JSON.parse(event.body);
        } catch (error) {
          console.log("Invalid JSON in request body");
          return {  
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Invalid JSON in request body' }),
          };
        }
      }
    }

    if (options.isBodyRequired && (parsedBody === undefined || parsedBody === null) && (event.httpMethod === 'POST' || event.httpMethod === 'PUT' || event.httpMethod === 'PATCH')) {
      console.log("Returning 400 for missing body");
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Valid request body is required and could not be parsed or was missing.' }),
      };
    }

    try {
      console.log("Calling core logic");
      const result = await coreLogic( 
        { 
            body: parsedBody, 
            queryStringParameters: event.queryStringParameters, 
            pathParameters: event.pathParameters 
        }, 
        event
      );
      console.log("Core logic result:", result);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    } catch (error: unknown) {
      console.error('Error in API handler:', error);
      if (error instanceof HttpError) {
        console.log("Returning error", error.statusCode);
        return {
          statusCode: error.statusCode,
          headers: corsHeaders,
          body: JSON.stringify({ message: error.message, details: error.details }),
        };
      }
      // Generic error for unexpected issues
      console.log("Returning 500 for unexpected error");
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Internal Server Error' }),
      };
    }
  };
}
