import * as React from "react";
import { useToast } from '@chakra-ui/react';
import {
  suggestBrandNames,
  checkDomainAvailability,
  type BrandNameSuggestionRequest,
  type DomainCheckResponse,
  type DomainCheckResult,
  type BrandNameSuggestion, // This is from common/types, re-exported by api.ts
} from "../utils/api";
import { formatDomainFromBrand } from "../utils/domainFormatter";

export interface DomainInfo {
  domainName: string;
  isChecking: boolean;
  checkResult: DomainCheckResult | null;
  fetchError: string | null;
}

export interface BrandDomainStatus {
  id: string;
  name: string;
  tagline: string;
  domains: DomainInfo[];
}

export interface GenerateBrandNamesParams {
  prompt: string;
  industry?: string;
  style?: string;
  keywords?: string;
  length?: number;
  count?: number;
}

export const useBrandNameGenerator = () => {
  const toast = useToast();
  const [brandDomainStatuses, setBrandDomainStatuses] = React.useState<
    BrandDomainStatus[] | null
  >(null);
  const [brandNamesLoading, setBrandNamesLoading] =
    React.useState<boolean>(false);
  const [brandNamesError, setBrandNamesError] = React.useState<string | null>(
    null,
  );

  const fetchAndSetDomainStatus = async (
    brandId: string,
    domainToFetch: string,
  ) => {
    setBrandDomainStatuses(
      prevStatuses =>
        prevStatuses?.map(brand =>
          brand.id === brandId
            ? {
                ...brand,
                domains: brand.domains.map(dInfo =>
                  dInfo.domainName === domainToFetch
                    ? {
                        ...dInfo,
                        isChecking: true,
                        checkResult: null,
                        fetchError: null,
                      }
                    : dInfo,
                ),
              }
            : brand,
        ) || null,
    );

    try {
      const response: DomainCheckResponse =
        await checkDomainAvailability(domainToFetch);

      setBrandDomainStatuses(
        prevStatuses =>
          prevStatuses?.map(brand =>
            brand.id === brandId
              ? {
                  ...brand,
                  domains: brand.domains.map(dInfo => {
                    if (dInfo.domainName !== domainToFetch) return dInfo;

                    let updatedDomainInfo: DomainInfo;
                    if (response.result) {
                      // API returned a domain check result
                      updatedDomainInfo = {
                        ...dInfo,
                        isChecking: false,
                        checkResult: response.result,
                        fetchError: null,
                      };
                    } else {
                      const fetchErrorMessage =
                        response.result === null
                          ? "API did not provide a result for this domain."
                          : "Domain check result was inconclusive.";
                      updatedDomainInfo = {
                        ...dInfo,
                        isChecking: false,
                        checkResult: null,
                        fetchError: fetchErrorMessage,
                      };
                    }
                    return updatedDomainInfo;
                  }),
                }
              : brand,
          ) || null,
      );
    } catch (error) {
      // This catch handles errors from the checkDomainAvailability call itself (e.g. network error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to check domain availability";
      setBrandDomainStatuses(
        prevStatuses =>
          prevStatuses?.map(brand =>
            brand.id === brandId
              ? {
                  ...brand,
                  domains: brand.domains.map(dInfo =>
                    dInfo.domainName === domainToFetch
                      ? (() => {
                          const updatedDomainInfoOnError = {
                            ...dInfo,
                            isChecking: false,
                            checkResult: null,
                            fetchError: errorMessage,
                          };
                          return updatedDomainInfoOnError;
                        })()
                      : dInfo,
                  ),
                }
              : brand,
          ) || null,
      );
    }
  };

  const handleGenerateBrandNamesSubmit = async (
    params: GenerateBrandNamesParams,
  ) => {
    const { prompt, industry, style, keywords, length, count } = params;

    if (!prompt.trim()) {
      const message = "Please enter a prompt for brand name ideas.";
      setBrandNamesError(message);
      toast({
        title: 'Input Error',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setBrandNamesLoading(true);
    setBrandNamesError(null);
    setBrandDomainStatuses(null);

    try {
      const requestBody: BrandNameSuggestionRequest = { prompt };

      if (industry?.trim()) requestBody.industry = industry.trim();
      if (style?.trim()) requestBody.style = style.trim();
      if (keywords?.trim()) {
        requestBody.keywords = keywords
          .split(",")
          .map(k => k.trim())
          .filter(k => k !== "");
      }
      if (typeof length === "number" && !isNaN(length) && length > 0) {
        requestBody.length = length;
      }
      if (typeof count === "number" && !isNaN(count) && count > 0) {
        requestBody.count = count;
      }

      const result = await suggestBrandNames(requestBody);

      if (result.suggestions && result.suggestions.length > 0) {
        const initialStatuses: BrandDomainStatus[] = result.suggestions.map(
          (suggestion: BrandNameSuggestion, index: number) => {
            const domainsToUse =
              suggestion.suggestedDomains &&
              suggestion.suggestedDomains.length > 0
                ? suggestion.suggestedDomains
                : [formatDomainFromBrand(suggestion.name)];

            return {
              id: `${suggestion.name}-${index}`,
              name: suggestion.name,
              tagline: suggestion.tagline,
              domains: domainsToUse.map((domainName: string) => ({
                domainName,
                isChecking: false,
                checkResult: null,
                fetchError: null,
              })),
            };
          },
        );
        setBrandDomainStatuses(initialStatuses);

        for (const status of initialStatuses) {
          for (const domainInfo of status.domains) {
            // No need to await these individually, let them run in parallel
            fetchAndSetDomainStatus(status.id, domainInfo.domainName);
          }
        }
      } else {
        setBrandDomainStatuses([]);
      }
    } catch (err) {
      let errorMessage = "An unknown error occurred while generating brand names.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setBrandNamesError(errorMessage);
      toast({
        title: 'Error Generating Brand Names',
        description: errorMessage,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
      setBrandDomainStatuses(null); // Also clear statuses on error
    } finally {
      setBrandNamesLoading(false);
    }
  };

  return {
    brandDomainStatuses,
    brandNamesLoading,
    brandNamesError,
    handleGenerateBrandNamesSubmit,
  };
};
