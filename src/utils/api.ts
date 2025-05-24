export interface DomainInfo {
  domain: string;
  availability: string;
  available: boolean;
}

export interface DomainAvailabilityResponse {
  result: DomainInfo;
}
const BASE_URL = "https://api.lingohog.com";
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
): Promise<DomainAvailabilityResponse> => {
  try {
    const response = await fetch(CHECK_DOMAIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain: domainName }),
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

    const data: DomainAvailabilityResponse = await response.json();
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

// Types for Generate Brand Names
export interface GenerateBrandNamesRequest {
  prompt: string;
  industry?: string;
  style?: string;
  keywords?: string[];
  length?: number;
  count?: number;
}

export interface GenerateBrandNamesResponse {
  suggestions: string[];
}

/**
 * Generates brand name suggestions by calling the API endpoint.
 * @param requestPayload The payload containing keywords or prompt for suggestions.
 * @returns A Promise that resolves with brand name suggestions.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const generateBrandNames = async (
  requestPayload: GenerateBrandNamesRequest
): Promise<GenerateBrandNamesResponse> => {
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

    const data: GenerateBrandNamesResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating brand names:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate brand names: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating brand names.");
  }
};

// Types for Check Batch Domains
export interface CheckBatchDomainsRequest {
  domains: string[];
}

export interface CheckBatchDomainsResponse {
  results: DomainInfo[]; // Reuses DomainInfo from single domain check
}

/**
 * Checks the availability of multiple domain names by calling the API endpoint.
 * @param domains An array of domain names to check.
 * @returns A Promise that resolves with the availability information for the domains.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const checkBatchDomains = async (
  domains: string[]
): Promise<CheckBatchDomainsResponse> => {
  const requestPayload: CheckBatchDomainsRequest = { domains };
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

    const data: CheckBatchDomainsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking batch domains:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to check batch domains: ${error.message}`);
    }
    throw new Error("An unknown error occurred while checking batch domains.");
  }
};

// Types for Get Domain Suggestions
export interface DomainSuggestion {
  DomainName?: string;
  Availability?: string; // e.g., "AVAILABLE", "UNAVAILABLE"
}

export interface GetDomainSuggestionsRequest {
  domainName: string;
  suggestionCount?: number;
  onlyAvailable?: boolean;
}

export interface GetDomainSuggestionsResponse {
  suggestions: DomainSuggestion[];
}

/**
 * Gets domain name suggestions from the API.
 * @param requestPayload The criteria for suggestions.
 * @returns A Promise that resolves with domain suggestions.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const getDomainSuggestions = async (
  requestPayload: GetDomainSuggestionsRequest
): Promise<GetDomainSuggestionsResponse> => {
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
    return data;
  } catch (error) {
    console.error("Error getting domain suggestions:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get domain suggestions: ${error.message}`);
    }
    throw new Error("An unknown error occurred while getting domain suggestions.");
  }
};

// Types for List TLDs
export interface PriceDetail {
  Price?: number;
  Currency?: string;
}

export interface TldPriceInfo {
  tld: string;
  registrationPrice?: PriceDetail;
  transferPrice?: PriceDetail;
  renewalPrice?: PriceDetail;
}

export interface ListTldsResponse {
  tlds: TldPriceInfo[];
}

/**
 * Lists available TLDs and their registration prices.
 * @param tld Optional specific TLD to filter for.
 * @returns A Promise that resolves with a list of TLDs and their prices.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const listTlds = async (tld?: string): Promise<ListTldsResponse> => {
  let apiUrl = LIST_TLDS_API_URL;
  if (tld) {
    apiUrl += `?tld=${encodeURIComponent(tld)}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Though for GET, body isn't sent, Content-Type for response expectation
      },
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

    const data: ListTldsResponse = await response.json();
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
