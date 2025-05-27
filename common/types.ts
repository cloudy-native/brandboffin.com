export interface BrandNameSuggestionRequest {
  prompt: string;
  industry?: string;
  style?: string;
  keywords?: string[];
  length?: number; // Approximate characters
  count?: number; // Number of suggestions to return
}

export interface BrandNameSuggestion {
  name: string;
  tagline: string;
}

export interface BrandNameSuggestionResponse {
  suggestions: BrandNameSuggestion[];
}

export interface BatchDomainCheckRequest {
  domains: string[];
  delayMs?: number; // Optional delay between checks
}

export interface DomainCheckResult {
  domain: string;
  available: boolean;
  error?: string;
}

export interface BatchDomainCheckResponse {
  results: DomainCheckResult[];
}

export interface DomainCheckRequest {
  domainName: string;
}

export interface DomainCheckResponse {
  result: DomainCheckResult;
}

export interface DomainSuggestion {
  domainName: string;
  available: boolean;
}

export interface TLDPrice {
  tld: string;
  registrationPrice?: number;
  renewalPrice?: number;
  transferPrice?: number;
  currency?: string;
}

// Define request body structure
export interface GetTLDPricesRequest {
  tld?: string; // Optional TLD to filter by
}

// Define response structure
export interface GetTLDPricesResponse {
  prices: TLDPrice[];
}

// Request for domain suggestions
export interface GetDomainSuggestionsRequest {
  domainName: string;
  onlyAvailable?: boolean;
  suggestionCount?: number;
}

// Response for domain suggestions
export interface GetDomainSuggestionsResponse {
  suggestions: DomainSuggestion[];
}
