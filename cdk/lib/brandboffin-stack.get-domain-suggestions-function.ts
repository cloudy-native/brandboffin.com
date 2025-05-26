import { AWSDomainUtils } from "./aws-domain-utils";
import { CoreLambdaLogic, createApiHandler, HttpError } from "./lambda-utils";
import {
  GetDomainSuggestionsRequest,
  GetDomainSuggestionsResponse,
} from "../../common/types";

// Instantiate the utils class once per container instance
const awsDomainUtils = new AWSDomainUtils();

const getDomainSuggestionsLogic: CoreLambdaLogic<
  GetDomainSuggestionsRequest,
  GetDomainSuggestionsResponse
> = async (payload) => {
  const { domainName, onlyAvailable, suggestionCount } = payload.body as GetDomainSuggestionsRequest;

  if (!domainName) {
    throw new HttpError("domainName is required and must be a non-empty string.", 400);
  }

  console.log(
    `Fetching domain suggestions for domainName: "${domainName}", onlyAvailable: ${onlyAvailable}, count: ${suggestionCount}`
  );
  console.log('Request body:', payload.body);

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
  allowedMethods: ["POST"],
  isBodyRequired: true,
});
