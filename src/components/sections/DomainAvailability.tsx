import { CheckCircleIcon, SmallCloseIcon } from "@chakra-ui/icons";
import { useColorModeValue } from "@chakra-ui/react";
import {
  Alert,
  AlertIcon,
  Box,
  Button, // Added Flex
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Spinner,
  Stack,
  Switch, // Added Switch
  Tag,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import validator from "validator";
import { getThemedColorLight, getThemedColorDark, textShade, primaryColorScheme } from "../../theme/design";
import {
  checkDomainAvailability,
  type DomainCheckResponse,
  getDomainSuggestions,
  type GetDomainSuggestionsResponse,
} from "../../utils/api";
import AlternativeSuggestionsDisplay from "../AlternativeSuggestionsDisplay";
import Section from "../Section";

interface DomainAvailabilityProps {
}

const sanitizeDomainInput = (input: string): string => {
  if (typeof input !== "string") return "";

  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.-]/g, "");
};

interface DomainSearchState {
  result: DomainCheckResponse | null;
  loading: boolean;
  error: string | null;
}

interface SuggestionsState {
  suggestions: GetDomainSuggestionsResponse | null;
  loading: boolean;
  error: string | null;
  onlyAvailable: boolean;
  currentDomain: string | null;
}

export const DomainAvailability: React.FC<DomainAvailabilityProps> = () => {
  const spinnerColor = useColorModeValue(
    getThemedColorLight(primaryColorScheme, textShade),
    getThemedColorDark(primaryColorScheme, textShade)
  );
  const [inputValue, setInputValue] = useState<string>("");
  const [domainSearchState, setDomainSearchState] = useState<DomainSearchState>(
    {
      result: null,
      loading: false,
      error: null,
    }
  );
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState>({
    suggestions: null,
    loading: false,
    error: null,
    onlyAvailable: false,
    currentDomain: null,
  });
  const isInitialSuggestionsFetchDone = useRef<boolean>(false);
  const isPerformingCheck = useRef<boolean>(false);

  // Core logic for checking domain and fetching suggestions
  const performDomainCheckAndSuggest = async (domainToCheck: string) => {
    if (isPerformingCheck.current) {
      console.warn(
        "[API_CALL_GUARD] performDomainCheckAndSuggest called while already in progress. Skipping."
      );
      return;
    }
    isPerformingCheck.current = true;
    setDomainSearchState({ result: null, loading: true, error: null });
    setSuggestionsState((prev) => ({
      ...prev,
      suggestions: null,
      loading: true,
      error: null,
      onlyAvailable: false,
      currentDomain: null,
    }));
    isInitialSuggestionsFetchDone.current = false;

    try {
      const mainCheckResult = await checkDomainAvailability(domainToCheck);
      setDomainSearchState((prev) => ({
        ...prev,
        result: mainCheckResult,
        loading: false,
      }));

      if (mainCheckResult && mainCheckResult.result.domain) {
        setSuggestionsState((prev) => ({
          ...prev,
          currentDomain: mainCheckResult.result.domain,
        }));
        const suggestionsResult = await getDomainSuggestions(
          mainCheckResult.result.domain,
          false,
          30
        );
        setSuggestionsState((prev) => ({
          ...prev,
          suggestions: suggestionsResult,
          loading: false,
        }));
        isInitialSuggestionsFetchDone.current = true;
      } else {
        setSuggestionsState((prev) => ({
          ...prev,
          error: "Could not determine domain to fetch suggestions for.",
          loading: false,
        }));
        isInitialSuggestionsFetchDone.current = false;
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setDomainSearchState({
        result: null,
        loading: false,
        error: errorMessage,
      });
      setSuggestionsState((prev) => ({
        ...prev,
        error: "Could not load suggestions at this time.",
        loading: false,
      }));
    } finally {
      isPerformingCheck.current = false;
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeDomainInput(event.target.value);
    setInputValue(sanitized);
    setDomainSearchState({ result: null, loading: false, error: null });
    setSuggestionsState({
      suggestions: null,
      loading: false,
      error: null,
      onlyAvailable: false,
      currentDomain: null,
    });
    isInitialSuggestionsFetchDone.current = false;
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      setDomainSearchState((prev) => ({
        ...prev,
        error: "Please enter a domain name.",
      }));
      return;
    }
    const currentSanitizedValue = inputValue.trim();

    if (!currentSanitizedValue) {
      setDomainSearchState((prev) => ({
        ...prev,
        error: "Please enter a domain name.",
        loading: false,
      }));
      setSuggestionsState((prev) => ({ ...prev, loading: false }));
      return;
    }

    let domainToSubmit = currentSanitizedValue;

    // Handle trailing dot or if input is just a dot
    if (domainToSubmit.endsWith(".") && domainToSubmit.length > 1) {
      domainToSubmit = domainToSubmit.slice(0, -1);
    } else if (domainToSubmit === ".") {
      setDomainSearchState((prev) => ({
        ...prev,
        error: "Invalid domain name '.'. Please enter a valid domain name.",
        loading: false,
      }));
      setSuggestionsState((prev) => ({ ...prev, loading: false }));
      return;
    }

    // If domain became empty after stripping a trailing dot (e.g. input was " ." which became "." then empty)
    if (!domainToSubmit) {
      setDomainSearchState((prev) => ({
        ...prev,
        error: "Invalid domain name. Please enter a valid domain name.",
        loading: false,
      }));
      setSuggestionsState((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (!domainToSubmit.includes(".")) {
      domainToSubmit = `${domainToSubmit}.com`;
    }

    if (domainToSubmit !== inputValue) {
      setInputValue(domainToSubmit);
      await performDomainCheckAndSuggest(domainToSubmit);
    } else {
      await performDomainCheckAndSuggest(inputValue);
    }
  };

  const handleSuggestionClick = async (domainName: string) => {
    setInputValue(domainName);
    await performDomainCheckAndSuggest(domainName);
  };

  useEffect(() => {
    if (
      !suggestionsState.currentDomain ||
      !isInitialSuggestionsFetchDone.current
    ) {
      return;
    }

    const reFetchSuggestionsOnToggle = async () => {
      if (!suggestionsState.currentDomain) {
        // Guard clause for null currentDomain
        console.error(
          "Attempted to re-fetch suggestions without a current domain."
        );
        setSuggestionsState((prev) => ({
          ...prev,
          error: "Cannot fetch suggestions: no domain specified.",
          loading: false,
        }));
        return;
      }
      console.log(
        `Re-fetching suggestions for ${suggestionsState.currentDomain} due to toggle. suggestOnlyAvailable: ${suggestionsState.onlyAvailable}`
      );
      setSuggestionsState((prev) => ({
        ...prev,
        loading: true,
        suggestions: null,
        error: null,
      }));
      try {
        const newSuggestions = await getDomainSuggestions(
          suggestionsState.currentDomain,
          suggestionsState.onlyAvailable
        );
        setSuggestionsState((prev) => ({
          ...prev,
          suggestions: newSuggestions,
          loading: false,
        }));
      } catch (err: any) {
        setSuggestionsState((prev) => ({
          ...prev,
          error: "Could not update suggestions based on filter.",
          loading: false,
        }));
      }
    };

    reFetchSuggestionsOnToggle();
  }, [suggestionsState.onlyAvailable, suggestionsState.currentDomain]);

  return (
    <Section title="I Want a Good Domain Name" colorScheme={primaryColorScheme}>
      <Stack spacing={4}>
        <FormControl id="domain-search">
          <FormLabel srOnly>Domain Name</FormLabel>
          <HStack>
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Check if domain is a valid FQDN and not already loading
                  if (
                    !domainSearchState.loading &&
                    validator.isFQDN(inputValue)
                  ) {
                    handleSubmit();
                  }
                }
              }}
              placeholder="Enter domain name (e.g., example.com)"
              value={inputValue}
              onChange={handleInputChange}
            />
            <Button
              isDisabled={
                !validator.isFQDN(inputValue) || domainSearchState.loading
              }
              colorScheme={primaryColorScheme}
              type="submit"
              onClick={handleSubmit}
              isLoading={
                domainSearchState.loading &&
                !domainSearchState.result &&
                !domainSearchState.error
              }
              leftIcon={<FaSearch />}
              loadingText="Searching..."
            >
              Check
            </Button>
          </HStack>
        </FormControl>

        {domainSearchState.error && (
          <Alert status="error" mt={4}>
            <AlertIcon />
            {domainSearchState.error}
          </Alert>
        )}

        {domainSearchState.result && !domainSearchState.loading && (
          <Box mt={4} p={4} borderWidth="1px" borderRadius="md" shadow="sm">
            <Heading as="h3" size="md" mb={2}>
              Domain: {domainSearchState.result.result.domain}
            </Heading>
            <Tag
              colorScheme={
                domainSearchState.result.result.available ? "green" : "red"
              }
            >
              {domainSearchState.result.result.available ? (
                <>
                  <Icon as={CheckCircleIcon} color="green.500" mr={1} />
                  Available
                </>
              ) : (
                <>
                  <Icon as={SmallCloseIcon} color="red.500" mr={1} />
                  Not Available
                </>
              )}
            </Tag>
          </Box>
        )}

        {(suggestionsState.suggestions ||
          (suggestionsState.loading &&
            !suggestionsState.suggestions &&
            !suggestionsState.error) ||
          suggestionsState.error ||
          suggestionsState.currentDomain) && (
          <Box mt={6}>
            {suggestionsState.currentDomain && (
              <FormControl
                display="flex"
                alignItems="center"
                mb={4}
                justifyContent="flex-end"
              >
                <FormLabel
                  htmlFor="suggest-only-available"
                  mb="0"
                  mr={2}
                  fontSize="sm"
                >
                  Only suggest available
                </FormLabel>
                <Switch
                  id="suggest-only-available"
                  isChecked={suggestionsState.onlyAvailable}
                  onChange={(e) =>
                    setSuggestionsState((prev) => ({
                      ...prev,
                      onlyAvailable: e.target.checked,
                    }))
                  }
                  colorScheme={primaryColorScheme}
                  size="md"
                />
              </FormControl>
            )}
            {suggestionsState.loading &&
              !suggestionsState.suggestions &&
              !suggestionsState.error && (
                <Box textAlign="center" mt={4}>
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color={spinnerColor}
                    size="lg"
                  />
                  <Text mt={2}>Looking things up...</Text>
                </Box>
              )}
            {suggestionsState.error && domainSearchState.result && (
              <Alert status="warning" mt={4} size="sm">
                <AlertIcon />
                {suggestionsState.error}
              </Alert>
            )}

            {/* Display suggestions if available */}
            {suggestionsState.suggestions &&
              suggestionsState.suggestions.suggestions.length > 0 &&
              !suggestionsState.loading && (
                <AlternativeSuggestionsDisplay
                  suggestions={suggestionsState.suggestions.suggestions}
                  onSuggestionClick={handleSuggestionClick}
                />
              )}

            {/* Message for no suggestions found */}
            {suggestionsState.currentDomain &&
              !suggestionsState.loading &&
              !suggestionsState.error &&
              suggestionsState.suggestions &&
              suggestionsState.suggestions.suggestions.length === 0 &&
              isInitialSuggestionsFetchDone.current && (
                <Text mt={4} textAlign="center">
                  No alternative suggestions found for{" "}
                  {suggestionsState.currentDomain}.
                </Text>
              )}
          </Box>
        )}
      </Stack>
    </Section>
  );
};
