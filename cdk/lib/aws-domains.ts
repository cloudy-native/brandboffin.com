import {
  CheckDomainAvailabilityCommand,
  Route53DomainsClient,
} from "@aws-sdk/client-route-53-domains";

interface DomainCheckResult {
  domain: string;
  availability: string;
  available: boolean;
  error?: string;
}

class AWSRoute53DomainChecker {
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

      const response = await this.client.send(command);

      return {
        domain,
        availability: response.Availability || "UNKNOWN",
        available: response.Availability === "AVAILABLE",
      };
    } catch (error) {
      console.error(`Error checking domain ${domain}:`, error);
      return {
        domain,
        availability: "ERROR",
        available: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check multiple domains with rate limiting (1 request per second)
   * AWS Route 53 doesn't support bulk checking, so we need to make individual requests
   */
  async checkDomains(
    domains: string[],
    delayMs: number = 1000
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
   * Check multiple TLDs for a base domain name
   */
  async checkMultipleTlds(
    baseName: string,
    tlds: string[] = ["com", "net", "org", "io", "co"],
    delayMs: number = 1000
  ): Promise<DomainCheckResult[]> {
    const domains = tlds.map((tld) => `${baseName}.${tld}`);
    return this.checkDomains(domains, delayMs);
  }

  /**
   * Get only available domains from a list
   */
  async getAvailableDomains(
    domains: string[],
    delayMs: number = 1000
  ): Promise<string[]> {
    const results = await this.checkDomains(domains, delayMs);
    return results
      .filter((result) => result.available && !result.error)
      .map((result) => result.domain);
  }

  /**
   * Check if Route 53 supports a specific TLD
   * Note: This is a basic check - AWS doesn't provide an API to list supported TLDs
   */
  private isSupportedTld(domain: string): boolean {
    // Common TLDs supported by Route 53 (this is not exhaustive)
    const supportedTlds = [
      "com",
      "net",
      "org",
      "info",
      "biz",
      "us",
      "uk",
      "co.uk",
      "org.uk",
      "ca",
      "de",
      "fr",
      "es",
      "it",
      "nl",
      "be",
      "ch",
      "at",
      "se",
      "no",
      "dk",
      "fi",
      "pl",
      "cz",
      "in",
      "jp",
      "au",
      "com.au",
      "br",
      "mx",
      "io",
      "co",
      "me",
      "tv",
      "cc",
      "ly",
      "ws",
      "mobi",
      "name",
      "pro",
    ];

    const tld = domain.split(".").slice(1).join(".");
    return supportedTlds.includes(tld.toLowerCase());
  }

  /**
   * Utility function to add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Batch check with automatic retry for PENDING responses
   */
  async checkDomainsWithRetry(
    domains: string[],
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<DomainCheckResult[]> {
    const results: DomainCheckResult[] = [];

    for (const domain of domains) {
      let result = await this.checkDomain(domain);
      let retries = 0;

      // Retry if status is PENDING
      while (result.availability === "PENDING" && retries < maxRetries) {
        console.log(
          `Domain ${domain} status is PENDING, retrying in ${delayMs * 2}ms...`
        );
        await this.delay(delayMs * 2);
        result = await this.checkDomain(domain);
        retries++;
      }

      results.push(result);

      // Add delay between requests
      if (domains.indexOf(domain) < domains.length - 1) {
        await this.delay(delayMs);
      }
    }

    return results;
  }
}

export { AWSRoute53DomainChecker, type DomainCheckResult };
