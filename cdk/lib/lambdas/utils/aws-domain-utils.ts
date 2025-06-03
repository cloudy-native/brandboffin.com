import {
  CheckDomainAvailabilityCommand,
  GetDomainSuggestionsCommand,
  ListPricesCommand,
  Route53DomainsClient,
} from "@aws-sdk/client-route-53-domains";
import {
  DomainCheckResult,
  DomainSuggestion,
  TLDPrice,
} from "../../../../common/types";

class AWSDomainUtils {
  private client: Route53DomainsClient;

  constructor() {
    this.client = new Route53DomainsClient();
  }

  /**
   * Check availability of a single domain
   */
  async checkDomain(domain: string): Promise<DomainCheckResult> {
    try {
      const command = new CheckDomainAvailabilityCommand({
        DomainName: domain,
      });

      console.log("Checking domain availability for:", domain);
      const response = await this.client.send(command);

      console.log("Domain availability response:", response);

      return {
        domain,
        available: response.Availability === "AVAILABLE",
      };
    } catch (error: unknown) {
      console.error(`Error checking domain ${domain}:`, error);
      // Check if it's an AWS SDK error and potentially extract more specific info
      // For example, the error might have a $metadata property or a name like 'InvalidInput'
      let errorMessage = "Failed to check domain availability.";
      if (typeof error === 'object' && error !== null && 'name' in error && error.name === "InvalidInput") {
        errorMessage = `Invalid domain name or TLD: ${domain}. Please ensure the format is correct and the TLD is valid.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Rethrow as a structured error or return a specific error object
      throw new Error(errorMessage);
    }
  }

  /**
   * Check multiple domains with rate limiting (1 request per second)
   * AWS Route 53 doesn't support bulk checking, so we need to make individual requests
   */
  async checkDomains(
    domains: string[],
    delayMs: number = 1000,
  ): Promise<DomainCheckResult[]> {
    const results: DomainCheckResult[] = [];

    for (let i = 0; i < domains.length; i++) {
      const result = await this.checkDomain(domains[i]);
      results.push(result);

      // Add delay between requests to avoid rate limiting
      if (i < domains.length - 1) {
        await this.delay(delayMs);
      }
    }

    return results;
  }

  /**
   * Utility function to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get domain name suggestions based on a keyword or domain fragment.
   */
  async getDomainSuggestions(
    query: string,
    onlyAvailable: boolean = true,
    suggestionCount: number = 10,
  ): Promise<DomainSuggestion[]> {
    try {
      const command = new GetDomainSuggestionsCommand({
        DomainName: query, // Or use a different parameter like Keyword if more appropriate
        OnlyAvailable: onlyAvailable,
        SuggestionCount: suggestionCount,
      });

      const response = await this.client.send(command);

      if (response.SuggestionsList) {
        return response.SuggestionsList.map(suggestion => ({
          domainName: suggestion.DomainName || "",
          available: suggestion.Availability === "AVAILABLE",
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error getting domain suggestions for "${query}":`, error);
      // Depending on how you want to handle errors, you might throw the error
      // or return an empty array or an array with an error indicator.
      return []; // Return empty array on error for simplicity here
    }
  }

  /**
   * Get TLD pricing information.
   * Fetches the first page of results. Pagination can be added if needed.
   */
  async getTLDPrices(tld?: string): Promise<TLDPrice[]> {
    try {
      const command = new ListPricesCommand({
        Tld: tld, // Optional: If provided, filters for a specific TLD
        // MaxItems and NextPageMarker can be used for pagination
      });

      const response = await this.client.send(command);

      if (response.Prices) {
        return response.Prices.map(priceInfo => ({
          tld: priceInfo.Name || "",
          registrationPrice: priceInfo.RegistrationPrice?.Price,
          renewalPrice: priceInfo.RenewalPrice?.Price,
          transferPrice: priceInfo.TransferPrice?.Price,
          currency:
            priceInfo.RegistrationPrice?.Currency || // Assuming currency is consistent
            priceInfo.RenewalPrice?.Currency ||
            priceInfo.TransferPrice?.Currency,
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error getting TLD prices (TLD: ${tld || "all"}):`, error);
      return [];
    }
  }
}

export { AWSDomainUtils };
