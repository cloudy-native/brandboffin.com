import { AWSDomainUtils } from "./utils/aws-domain-utils";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./utils/lambda-utils";
import {
  GetDomainSuggestionsRequest,
  GetDomainSuggestionsResponse,
} from "../../../common/types";

// Instantiate the utils class once per container instance
const awsDomainUtils = new AWSDomainUtils();

const getDomainSuggestionsLogic: CoreLambdaLogic<
  GetDomainSuggestionsRequest,
  GetDomainSuggestionsResponse
> = async (payload) => {
  const domainName = payload.queryStringParameters?.domainName;
  const onlyAvailable = payload.queryStringParameters?.onlyAvailable === 'true';
  const suggestionCount = payload.queryStringParameters?.suggestionCount ? 
    parseInt(payload.queryStringParameters.suggestionCount, 10) : undefined;

  if (!domainName) {
    throw new HttpError("domainName is required and must be a non-empty string query parameter.", 400);
  }

  console.log(
    `Fetching domain suggestions for domainName: "${domainName}", onlyAvailable: ${onlyAvailable}, count: ${suggestionCount}`
  );

  try {
    const suggestions = await awsDomainUtils.getDomainSuggestions(
      domainName,
      onlyAvailable,
      suggestionCount
    );
    return { suggestions };
  } catch (error: any) {
    console.error(`Error getting domain suggestions for "${domainName}":`, error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(
      error.message || "Failed to get domain suggestions.",
      500
    );
  }
};

export const handler = createApiHandler<
  GetDomainSuggestionsRequest,
  GetDomainSuggestionsResponse
>(getDomainSuggestionsLogic, {
  allowedMethods: ["GET"],
  isBodyRequired: false,
});
