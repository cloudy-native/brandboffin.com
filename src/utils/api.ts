import {
  BatchDomainCheckRequest,
  BatchDomainCheckResponse,
  DomainCheckRequest, // Added
  DomainCheckResponse, // Added
  SuggestionRequest, // Added
  SuggestionResponse, // Added
  GetDomainSuggestionsRequest, // Added
  GetDomainSuggestionsResponse, // Added
  GetTLDPricesRequest, // Added
  GetTLDPricesResponse, // Added
  TLDPrice, // Added (used by GetTLDPricesResponse)
  DomainSuggestion // Added (used by GetDomainSuggestionsResponse)
} from "../../common/types";

// Re-export types for external use
export type {
  DomainSuggestion,
  GetDomainSuggestionsResponse,
  SuggestionRequest,
  SuggestionResponse,
  DomainCheckRequest,
  DomainCheckResponse,
  BatchDomainCheckRequest,
  BatchDomainCheckResponse,
  GetTLDPricesRequest,
  GetTLDPricesResponse,
  TLDPrice,
  DomainCheckResult
} from "../../common/types";

const BASE_URL = "https://api.brandboffin.com";
const CHECK_DOMAIN_API_URL = `${BASE_URL}/check-domain`;
const GENERATE_BRAND_NAMES_API_URL = `${BASE_URL}/generate-brand-names`;
const CHECK_BATCH_DOMAINS_API_URL = `${BASE_URL}/check-batch-domains`;
const GET_DOMAIN_SUGGESTIONS_API_URL = `${BASE_URL}/suggest-domains`;
const LIST_TLDS_API_URL = `${BASE_URL}/tlds`;
/**
 * Checks the availability of a domain name by calling a specified API endpoint.
 * @param domainName The domain name to check (e.g., "example.com").
 * @returns A Promise that resolves with the domain availability information.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const checkDomainAvailability = async (
  domainName: string
): Promise<DomainCheckResponse> => {
  try {
    const response = await fetch(CHECK_DOMAIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domainName } as DomainCheckRequest),
    });

    if (!response.ok) {
      // Attempt to parse error response from the API, otherwise use status text
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        // Assuming the error response might have a 'message' field
        errorMessage += `: ${errorData.message || response.statusText}`;
      } catch (e) {
        // If parsing the error JSON fails, append the original status text
        errorMessage += `: ${response.statusText || "Failed to retrieve error details"}`;
      }
      throw new Error(errorMessage);
    }

    // Ensure the response is valid JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        `Expected JSON response from API, but received ${contentType || "unknown content type"}`
      );
    }

    const data: DomainCheckResponse = await response.json();
    console.log("CheckDomainAvailability response:", data);
    return data;
  } catch (error) {
    console.error("Error checking domain availability:", error);
    // Ensure the error thrown is an instance of Error for consistent error handling
    if (error instanceof Error) {
      throw new Error(`Failed to check domain availability: ${error.message}`);
    }
    // Fallback for cases where a non-Error object might be thrown
    throw new Error(
      "An unknown error occurred while checking domain availability."
    );
  }
};

/**
 * Generates brand name suggestions by calling the API endpoint.
 * @param requestPayload The payload containing keywords or prompt for suggestions.
 * @returns A Promise that resolves with brand name suggestions.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const generateBrandNames = async (
  requestPayload: SuggestionRequest
): Promise<SuggestionResponse> => {
  try {
    const response = await fetch(GENERATE_BRAND_NAMES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${errorData.message || response.statusText}`;
      } catch (e) {
        errorMessage += `: ${response.statusText || "Failed to retrieve error details"}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        `Expected JSON response from API, but received ${contentType || "unknown content type"}`
      );
    }

    const data: SuggestionResponse = await response.json();
    console.log("GenerateBrandNames response:", data);
    return data;
  } catch (error) {
    console.error("Error generating brand names:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate brand names: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating brand names.");
  }
};

/**
 * Checks the availability of multiple domain names by calling the API endpoint.
 * @param domains An array of domain names to check.
 * @returns A Promise that resolves with the availability information for the domains.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const checkBatchDomains = async (
  domains: string[]
): Promise<BatchDomainCheckResponse> => {
  const requestPayload: BatchDomainCheckRequest = { domains };
  try {
    const response = await fetch(CHECK_BATCH_DOMAINS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${errorData.message || response.statusText}`;
      } catch (e) {
        errorMessage += `: ${response.statusText || "Failed to retrieve error details"}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        `Expected JSON response from API, but received ${contentType || "unknown content type"}`
      );
    }

    const data: BatchDomainCheckResponse = await response.json();
      return data;
  } catch (error) {
    console.error("Error checking batch domains:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to check batch domains: ${error.message}`);
    }
    throw new Error("An unknown error occurred while checking batch domains.");
  }
};

/**
 * Gets domain name suggestions from the API.
 * @param query The query for suggestions.
 * @param onlyAvailable Whether to only return available domains.
 * @param suggestionCount The number of suggestions to return.
 * @returns A Promise that resolves with domain suggestions.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const getDomainSuggestions = async (
  query: string,
  onlyAvailable: boolean = true,
  suggestionCount: number = 10
): Promise<GetDomainSuggestionsResponse> => {
  const requestPayload: GetDomainSuggestionsRequest = {
    domainName: query,
    onlyAvailable,
    suggestionCount,
  };
  try {
    const response = await fetch(GET_DOMAIN_SUGGESTIONS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${errorData.message || response.statusText}`;
      } catch (e) {
        errorMessage += `: ${response.statusText || "Failed to retrieve error details"}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        `Expected JSON response from API, but received ${contentType || "unknown content type"}`
      );
    }

    const data: GetDomainSuggestionsResponse = await response.json();
    console.log("GetDomainSuggestions response:", data);
    return data;
  } catch (error) {
    console.error("Error getting domain suggestions:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get domain suggestions: ${error.message}`);
    }
    throw new Error("An unknown error occurred while getting domain suggestions.");
  }
};

/**
 * Lists available TLDs and their registration prices.
 * @param tld Optional specific TLD to filter for.
 * @returns A Promise that resolves with a list of TLDs and their prices.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const listTlds = async (tld?: string): Promise<GetTLDPricesResponse> => {
  try {
    const response = await fetch(LIST_TLDS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tld } as GetTLDPricesRequest),
    });

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${errorData.message || response.statusText}`;
      } catch (e) {
        errorMessage += `: ${response.statusText || "Failed to retrieve error details"}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        `Expected JSON response from API, but received ${contentType || "unknown content type"}`
      );
    }

    const data: GetTLDPricesResponse = await response.json();
    console.log("Data:", data);
    return data;
  } catch (error) {
    console.error("Error listing TLDs:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to list TLDs: ${error.message}`);
    }
    throw new Error("An unknown error occurred while listing TLDs.");
  }
};
