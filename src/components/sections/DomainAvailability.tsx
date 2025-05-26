import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import {
  checkDomainAvailability,
  type DomainCheckResponse,
  getDomainSuggestions,
  type GetDomainSuggestionsResponse,
} from "../../utils/api";
import Section from "../Section";
import AlternativeSuggestionsDisplay from "../AlternativeSuggestionsDisplay";

interface DomainAvailabilityProps {
  colorScheme: string;
}

const DomainAvailability: React.FC<DomainAvailabilityProps> = ({
  colorScheme,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [apiResult, setApiResult] = useState<DomainCheckResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [domainSuggestions, setDomainSuggestions] =
    useState<GetDomainSuggestionsResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setApiResult(null); // Clear previous results when input changes
    setError(null);
    setDomainSuggestions(null);
    setSuggestionsError(null);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      setError("Please enter a domain name.");
      return;
    }
    setIsLoading(true);
    setSuggestionsLoading(true);
    setError(null);
    setApiResult(null);
    setDomainSuggestions(null);
    setSuggestionsError(null);

    try {
      const result = await checkDomainAvailability(inputValue);
      setApiResult(result);
      // If available, or even if not, fetch suggestions
      const suggestions = await getDomainSuggestions(inputValue, false, 10);
      setDomainSuggestions(suggestions);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred.";
      setError(errorMessage);
      setSuggestionsError("Could not load suggestions at this time."); // Separate error for suggestions
    } finally {
      setIsLoading(false);
      setSuggestionsLoading(false);
    }
  };

  const handleSuggestionClick = (domainName: string) => {
    setInputValue(domainName);
    // Optionally, trigger handleSubmit directly or let the user click check
    // handleSubmit(); // Or clear results and let them click
    setApiResult(null);
    setError(null);
    setDomainSuggestions(null);
    setSuggestionsError(null);
    // It's often better to populate and let them click check
  };

  return (
    <Section title="Check Domain Availability" colorScheme={colorScheme}>
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
              colorScheme={colorScheme}
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
              {apiResult.result.availability}
            </Tag>
          </Box>
        )}

        {(domainSuggestions ||
          (suggestionsLoading && !domainSuggestions && !suggestionsError) ||
          suggestionsError) && (
          <Box mt={6}>
            {suggestionsLoading && !domainSuggestions && !suggestionsError && (
              <Box textAlign="center" mt={4}>
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  colorScheme={colorScheme}
                  size="lg"
                />
                <Text mt={2}>Looking things up...</Text>
              </Box>
            )}
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
                title={`Alternatives for ${inputValue}`}
              />
            )}
          </Box>
        )}
      </Stack>
    </Section>
  );
};

export default DomainAvailability;
