import { CheckCircleIcon , SmallCloseIcon} from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex, // Added Flex
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
import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import {
  checkDomainAvailability,
  type DomainCheckResponse,
  getDomainSuggestions,
  type GetDomainSuggestionsResponse,
} from "../../utils/api";
import AlternativeSuggestionsDisplay from "../AlternativeSuggestionsDisplay";
import Section from "../Section";
import { primaryColorScheme } from "../../theme/design";

interface DomainAvailabilityProps {
}

export const DomainAvailability: React.FC<DomainAvailabilityProps> = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [apiResult, setApiResult] = useState<DomainCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [domainSuggestions, setDomainSuggestions] =
    useState<GetDomainSuggestionsResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [suggestOnlyAvailable, setSuggestOnlyAvailable] = useState<boolean>(false);
  const [currentDomainForSuggestions, setCurrentDomainForSuggestions] = useState<string | null>(null);
  const isInitialSuggestionsFetchDone = useRef<boolean>(false);

  // Core logic for checking domain and fetching suggestions
  const performDomainCheckAndSuggest = async (domainToCheck: string) => {
    setSuggestOnlyAvailable(false); // Reset toggle to default for a new domain lookup
    setIsLoading(true);
    setSuggestionsLoading(true);
    setError(null);
    setApiResult(null);
    setDomainSuggestions(null);
    setSuggestionsError(null);
    isInitialSuggestionsFetchDone.current = false;

    try {
      const result = await checkDomainAvailability(domainToCheck);
      setApiResult(result);
      if (result && result.result.domain) {
        setCurrentDomainForSuggestions(result.result.domain);
        const suggestions = await getDomainSuggestions(result.result.domain, suggestOnlyAvailable, 30);
        setDomainSuggestions(suggestions);
        isInitialSuggestionsFetchDone.current = true;
      } else {
        setSuggestionsError("Could not determine domain to fetch suggestions for.");
        isInitialSuggestionsFetchDone.current = false;
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setError(errorMessage);
      setSuggestionsError("Could not load suggestions at this time.");
    } finally {
      setIsLoading(false);
      setSuggestionsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setApiResult(null); // Clear previous results when input changes
    setError(null);
    setDomainSuggestions(null);
    setSuggestionsError(null);
    setCurrentDomainForSuggestions(null); // Reset current domain for suggestions
    isInitialSuggestionsFetchDone.current = false; // Reset ref
  };

  const handleSubmit = async () => {
    const originalTrimmedInput = inputValue.trim();

    if (!originalTrimmedInput) {
      setError("Please enter a domain name.");
      setIsLoading(false);
      setSuggestionsLoading(false);
      return;
    }

    let domainToSubmit = originalTrimmedInput;

    // Handle trailing dot or if input is just a dot
    if (domainToSubmit.endsWith(".") && domainToSubmit.length > 1) {
      domainToSubmit = domainToSubmit.slice(0, -1);
    } else if (domainToSubmit === ".") {
      setError("Invalid domain name '.'. Please enter a valid domain name.");
      setIsLoading(false);
      setSuggestionsLoading(false);
      return;
    }

    // If domain became empty after stripping a trailing dot (e.g. input was " ." which became "." then empty)
    if (!domainToSubmit) {
      setError("Invalid domain name. Please enter a valid domain name.");
      setIsLoading(false);
      setSuggestionsLoading(false);
      return;
    }

    // If it's a single word (no dots after potential processing) and not empty, append .com
    if (!domainToSubmit.includes(".")) {
      domainToSubmit = `${domainToSubmit}.com`;
    }

    // Update input field state if the string to submit is different from current input
    // and then call the core checking logic.
    // It's important to update inputValue BEFORE calling performDomainCheckAndSuggest
    // if domainToSubmit is different, so the UI reflects the actual domain being checked.
    if (domainToSubmit !== inputValue) {
      setInputValue(domainToSubmit);
      await performDomainCheckAndSuggest(domainToSubmit);
    } else {
      await performDomainCheckAndSuggest(inputValue); // Or domainToSubmit, they are the same here
    }
  };

  const handleSuggestionClick = async (domainName: string) => {
    // Assuming domainName from suggestion is already a full domain (e.g., example.com)
    setInputValue(domainName); // Update the input field
    await performDomainCheckAndSuggest(domainName); // Directly perform the check
  };

  useEffect(() => {
    if (!currentDomainForSuggestions || !isInitialSuggestionsFetchDone.current) {
      // No domain checked yet, or initial fetch for this domain isn't done by handleSubmit
      // This check ensures we only re-fetch if the *toggle* changes after an initial search.
      return;
    }

    // This effect runs when suggestOnlyAvailable changes for an active domain
    // for which initial suggestions have already been fetched by handleSubmit.
    const reFetchSuggestionsOnToggle = async () => {
      console.log(`Re-fetching suggestions for ${currentDomainForSuggestions} due to toggle. suggestOnlyAvailable: ${suggestOnlyAvailable}`);
      setSuggestionsLoading(true);
      setDomainSuggestions(null); // Clear previous suggestions before new fetch
      setSuggestionsError(null);
      try {
        const suggestions = await getDomainSuggestions(currentDomainForSuggestions, suggestOnlyAvailable);
        setDomainSuggestions(suggestions);
      } catch (err: any) {
        setSuggestionsError("Could not update suggestions based on filter.");
      } finally {
        setSuggestionsLoading(false);
      }
    };

    reFetchSuggestionsOnToggle();
  }, [suggestOnlyAvailable, currentDomainForSuggestions]); // Dependencies: only run if these state vars change.

  return (
    <Section title="I Want a Good Domain Name">
      <Stack spacing={4}>
        <FormControl id="domain-search">
          <FormLabel srOnly>Domain Name</FormLabel>
          <HStack>
            <Input
              placeholder="Enter domain name (e.g., example.com)"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button
              colorScheme={primaryColorScheme}
              onClick={handleSubmit}
              isLoading={isLoading && !apiResult && !error} // Show loading on button only during initial check
              leftIcon={<FaSearch />}
            >
              Check
            </Button>
          </HStack>
        </FormControl>

        {error && (
          <Alert status="error" mt={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {apiResult && !isLoading && (
          <Box mt={4} p={4} borderWidth="1px" borderRadius="md" shadow="sm">
            <Heading as="h3" size="md" mb={2}>
              Domain: {apiResult.result.domain}
            </Heading>
            <Tag colorScheme={apiResult.result.available ? "green" : "red"}>
              {apiResult.result.available ? (
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

        {(domainSuggestions ||
          (suggestionsLoading && !domainSuggestions && !suggestionsError) ||
          suggestionsError || currentDomainForSuggestions) && (
          <Box mt={6}>
            {currentDomainForSuggestions && (
              <FormControl display="flex" alignItems="center" mb={4} justifyContent="flex-end">
                <FormLabel htmlFor="suggest-only-available" mb="0" mr={2} fontSize="sm">
                  Only suggest available
                </FormLabel>
                <Switch
                  id="suggest-only-available"
                  isChecked={suggestOnlyAvailable}
                  onChange={(e) => setSuggestOnlyAvailable(e.target.checked)}
                  colorScheme={primaryColorScheme}
                  size="md"
                />
              </FormControl>
            )}
            {suggestionsLoading && !domainSuggestions && !suggestionsError && (
              <Box textAlign="center" mt={4}>
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  colorScheme={primaryColorScheme}
                  size="lg"
                />
                <Text mt={2}>Looking things up...</Text>
              </Box>
            )}
            {/* The toggle is now correctly placed once above. This duplicated block is removed. */}
            {suggestionsError && apiResult && (
              /* Show suggestion error only if main check was ok or had a different error */ <Alert
                status="warning"
                mt={4}
                size="sm"
              >
                <AlertIcon />
                {suggestionsError}
              </Alert>
            )}
            {domainSuggestions && (
              <AlternativeSuggestionsDisplay
                suggestionsData={domainSuggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            )}
          </Box>
        )}
      </Stack>
    </Section>
  );
};

