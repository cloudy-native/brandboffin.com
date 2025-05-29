import axios from "axios";
import {
  BatchDomainCheckRequest,
  BatchDomainCheckResponse,
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse,
  DomainCheckResponse,
  DomainSuggestion,
  GetDomainSuggestionsResponse,
  GetTLDPricesResponse,
} from "../../common/types";

// Re-export types for external use
export type {
  BatchDomainCheckRequest,
  BatchDomainCheckResponse,
  BrandNameSuggestionRequest,
  BrandNameSuggestionResponse,
  DomainCheckRequest,
  DomainCheckResponse,
  DomainCheckResult,
  DomainSuggestion,
  GetDomainSuggestionsResponse,
  GetTLDPricesRequest,
  GetTLDPricesResponse,
  TLDPrice,
} from "../../common/types";

interface EndpointSpec {
  url: string;
  method: string;
}

const API_DOMAIN = "api.brandboffin.com";
const BASE_URL = `https://${API_DOMAIN}`;

const BRANDS_ENDPOINT: EndpointSpec = {
  url: `${BASE_URL}/brands`,
  method: "POST",
};
const CHECK_DOMAIN_ENDPOINT: EndpointSpec = {
  url: `${BASE_URL}/domains`,
  method: "GET",
};
const CHECK_BATCH_DOMAINS_ENDPOINT: EndpointSpec = {
  url: `${BASE_URL}/domains/batch-check`,
  method: "POST",
};
const SUGGEST_DOMAINS_ENDPOINT: EndpointSpec = {
  url: `${BASE_URL}/domains/suggestions`,
  method: "GET",
};
const LIST_TLDS_ENDPOINT: EndpointSpec = {
  url: `${BASE_URL}/tlds`,
  method: "GET",
};

/**
 * Checks the availability of a domain name by calling a specified API endpoint.
 * @param domainName The domain name to check (e.g., "example.com").
 * @returns A Promise that resolves with the domain availability information.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const checkDomainAvailability = async (
  domainName: string
): Promise<DomainCheckResponse> => {
  console.info('[API] checkDomainAvailability - Input:', { domainName });
  const { url, method } = CHECK_DOMAIN_ENDPOINT;
  
  try {
    const response = await axios({
      url,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        domainName,
      },
    });

    const data: DomainCheckResponse = response.data;
    console.debug('[API] checkDomainAvailability - Success Output:', data);
    return data;
  } catch (error) {
    console.error('[API] checkDomainAvailability - Error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to check domain availability for this top-level domain`);
    }
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
export const suggestBrandNames = async (
  requestPayload: BrandNameSuggestionRequest
): Promise<BrandNameSuggestionResponse> => {
  console.info('[API] suggestBrandNames - Input:', requestPayload);
  try {
    const { url, method } = BRANDS_ENDPOINT;
    const response = await axios({
      url,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      data: requestPayload,
    });

    const data: BrandNameSuggestionResponse = response.data;
    console.debug('[API] suggestBrandNames - Success Output:', data);
    return data;
  } catch (error) {
    console.error('[API] suggestBrandNames - Error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to generate brand names: ${message}`);
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
  console.info('[API] checkBatchDomains - Input:', { domains });
  const { url, method } = CHECK_BATCH_DOMAINS_ENDPOINT;
  const requestPayload: BatchDomainCheckRequest = { domains };

  try {
    const response = await axios({
      url,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      data: requestPayload,
    });

    const data: BatchDomainCheckResponse = response.data;
    console.debug('[API] checkBatchDomains - Success Output:', data);
    return data;
  } catch (error) {
    console.error('[API] checkBatchDomains - Error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to check batch domains: ${message}`);
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
  suggestionCount: number = 50
): Promise<GetDomainSuggestionsResponse> => {
  console.info('[API] getDomainSuggestions - Input:', { query, onlyAvailable, suggestionCount });
  const { url, method } = SUGGEST_DOMAINS_ENDPOINT;

  console.log(
    "Fetching domain suggestions for",
    query,
    onlyAvailable,
    suggestionCount
  );
  
  try {
    const response = await axios({
      url,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        domainName: query,
        onlyAvailable,
        suggestionCount,
      },
    });

    const rawData = response.data as any; // Parse as any to handle potential mismatch
    console.debug("[API] getDomainSuggestions - Raw API Response:", rawData);

    // Manually map to the expected GetDomainSuggestionsResponse structure
    const mappedSuggestions: DomainSuggestion[] = (
      rawData.suggestions || []
    ).map((sugg: any) => ({
      domainName: sugg.domainName || "",
      available: sugg.available,
    }));

    const mappedData: GetDomainSuggestionsResponse = {
      suggestions: mappedSuggestions,
    };
    console.debug("[API] getDomainSuggestions - Mapped Success Output:", mappedData);
    return mappedData;
  } catch (error) {
    console.error('[API] getDomainSuggestions - Error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get domain suggestions: ${message}`);
    }
    throw new Error(
      "An unknown error occurred while getting domain suggestions."
    );
  }
};

/**
 * Lists available TLDs and their registration prices.
 * @param tld Optional specific TLD to filter for.
 * @returns A Promise that resolves with a list of TLDs and their prices.
 * @throws An error if the API request fails or the response cannot be parsed.
 */
export const listTlds = async (
  tld?: string
): Promise<GetTLDPricesResponse> => {
  console.info('[API] listTlds - Input:', { tld });
  const { url, method } = LIST_TLDS_ENDPOINT;
  
  try {
    const response = await axios({
      url,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      params: tld ? { tld } : {},
    });

    console.debug('[API] listTlds - API Response:', response);
    const data: GetTLDPricesResponse = response.data;
    console.debug('[API] listTlds - Success Output:', data);
    return data;
  } catch (error) {
    console.error('[API] listTlds - Error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to list TLDs: ${message}`);
    }
    throw new Error("An unknown error occurred while listing TLDs.");
  }
};
