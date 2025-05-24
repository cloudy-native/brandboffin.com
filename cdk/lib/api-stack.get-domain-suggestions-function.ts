import {
  Route53DomainsClient,
  GetDomainSuggestionsCommand,
  GetDomainSuggestionsCommandInput,
  DomainSuggestion as AWSSuggestion, // Rename to avoid conflict if we define our own
} from '@aws-sdk/client-route-53-domains';
import { createApiHandler, HttpError, CoreLambdaLogic } from "./lambda-utils";

// Initialize client outside the handler for potential reuse
const client = new Route53DomainsClient({});

interface RequestBody {
  domainName: string;
  suggestionCount?: number;
  onlyAvailable?: boolean;
}

// Define a simpler structure for the response, if desired, or use AWSSuggestion directly
interface Suggestion {
  DomainName?: string;
  Availability?: string;
}

interface ResponseBody {
  suggestions: Suggestion[];
}

const getDomainSuggestionsLogic: CoreLambdaLogic<RequestBody, ResponseBody> = async (payload) => {
  if (!payload.body || !payload.body.domainName || typeof payload.body.domainName !== 'string' || !payload.body.domainName.trim()) {
    throw new HttpError("domainName is required and must be a non-empty string", 400);
  }

  let { domainName, suggestionCount = 20, onlyAvailable = true } = payload.body;

  domainName = domainName.trim();

  if (!domainName) {
    throw new HttpError("Domain name cannot be empty after trimming whitespace.", 400);
  }

  // Remove trailing dot if present
  if (domainName.endsWith('.')) {
    domainName = domainName.slice(0, -1);
    // Check if domain name became empty after removing trailing dot (e.g., input was '.')
    if (!domainName) {
      throw new HttpError("Invalid domain name format: cannot be just a dot or end with a dot leading to an empty string.", 400);
    }
  }

  // If, after sanitization, domainName still doesn't have a TLD, append .com
  // This also handles cases where the input was just a word like 'example'
  if (!domainName.includes('.')) {
    console.log(`Sanitized domainName '${domainName}' does not contain '.', appending '.com'.`);
    domainName = `${domainName}.com`;
  }
  
  // Final check for cases like '.com' if original input was just '.' and then .com was appended.
  // Or if the input was something like ' leading.to.error'
  // A simple check: a valid domain part should not start with a dot if it's the only part before .com
  if (domainName.startsWith('.')) { // e.g. if original input was '.' -> '' -> '.com'
      throw new HttpError(`Invalid domain name format: '${payload.body.domainName}' results in an invalid structure '${domainName}'. Please provide a valid domain or keyword.`, 400);
  }


  const params: GetDomainSuggestionsCommandInput = {
    DomainName: domainName,
    SuggestionCount: suggestionCount,
    OnlyAvailable: onlyAvailable,
  };

  try {
    console.log('Calling GetDomainSuggestions with params:', params);
    const command = new GetDomainSuggestionsCommand(params);
    const response = await client.send(command);
    console.log('GetDomainSuggestions response:', response);

    // Map AWS SDK's DomainSuggestion to our simpler Suggestion type
    const suggestions: Suggestion[] = (response.SuggestionsList || []).map(s => ({
        DomainName: s.DomainName,
        Availability: s.Availability
    }));

    return { suggestions };
  } catch (error: any) {
    console.error('Error getting domain suggestions:', error.message, error);
    throw new HttpError(error.message || 'Failed to get domain suggestions', 500);
  }
};

export const handler = createApiHandler<RequestBody, ResponseBody>(
  getDomainSuggestionsLogic,
  {
    allowedMethods: ['POST'],
    isBodyRequired: true,
  }
);
