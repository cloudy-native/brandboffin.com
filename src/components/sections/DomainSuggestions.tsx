import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Collapse,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  Stack,
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { FaSearch, FaCheck } from "react-icons/fa";
import { Tag } from "@chakra-ui/react"; // Added Tag for displaying availability status
import {
  getDomainSuggestions,
  type GetDomainSuggestionsResponse,
} from "../../utils/api";
import Section from "../Section";

interface DomainSuggestionsProps {
  colorScheme: string;
}

interface RegistrarInfo {
  id: string;
  name: string;
  urlTemplate: string;
}

const registrars: RegistrarInfo[] = [
  { id: 'godaddy', name: 'GoDaddy', urlTemplate: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck={DOMAIN_NAME}' },
  { id: 'namecheap', name: 'Namecheap', urlTemplate: 'https://www.namecheap.com/domains/registration/results/?domain={DOMAIN_NAME}' },
  // { id: 'google', name: 'Google Domains', urlTemplate: 'https://domains.google.com/registrar/search?searchTerm={DOMAIN_NAME}' },
  // { id: 'domaincom', name: 'Domain.com', urlTemplate: 'https://www.domain.com/domains/search/{DOMAIN_NAME}/find' },
  // { id: 'bluehost', name: 'Bluehost', urlTemplate: 'https://www.bluehost.com/domain?search={DOMAIN_NAME}' },
];

const DomainSuggestions: React.FC<DomainSuggestionsProps> = ({
  colorScheme,
}) => {
  const [suggestionQuery, setSuggestionQuery] = React.useState<string>("");
  const [domainSuggestions, setDomainSuggestions] = React.useState<GetDomainSuggestionsResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] =
    React.useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = React.useState<string | null>(
    null
  );
  const [isSuggestionsVisible, setIsSuggestionsVisible] =
    React.useState<boolean>(false);
  const [onlyAvailableFilter, setOnlyAvailableFilter] = React.useState<boolean>(true);

  const handleSuggestionQueryChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSuggestionQuery(event.target.value);
    if (domainSuggestions) setDomainSuggestions(null); // Clear previous results
    if (suggestionsError) setSuggestionsError(null); // Clear previous error
    if (isSuggestionsVisible) setIsSuggestionsVisible(false); // Hide section when query changes
  };

  const handleToggleOnlyAvailable = () => {
    const newFilterValue = !onlyAvailableFilter;
    setOnlyAvailableFilter(newFilterValue);
    
    // Clear previous results before a potential new fetch
    setDomainSuggestions(null);
    setSuggestionsError(null); // Clear any previous error message

    // If there's a query, trigger a new search with the new filter value
    if (suggestionQuery.trim()) {
      // We need to pass the new filter value directly or ensure state updates before calling
      // For simplicity, we can call a modified search function or rely on useEffect if we restructure
      // However, the most direct way here is to call handlePrimarySuggestButton, 
      // but it will use the state value of onlyAvailableFilter which might not be updated yet in the same cycle.
      // A common pattern is to use useEffect to react to changes in `onlyAvailableFilter` and `suggestionQuery`
      // or pass the new value explicitly if the search function can take it.
      
      // Let's ensure handlePrimarySuggestButton is called *after* state has a chance to update
      // or modify handlePrimarySuggestButton to accept the filter as a parameter.
      // For now, we'll rely on the fact that handlePrimarySuggestButton reads the latest state.
      // To make it more robust, we'd ideally use a useEffect or pass the new value.
      
      // Simpler approach: set loading and visibility, then call the search.
      // The handlePrimarySuggestButton already handles this logic based on current state.
      // We just need to ensure it's called.
      // If suggestionQuery is present, a search will be initiated by handlePrimarySuggestButton
      // after this state update. We can call it directly.
      // To ensure it uses the *new* filter value, we can pass it if we refactor handlePrimarySuggestButton
      // or call a dedicated fetch function.

      // Let's make handlePrimarySuggestButton capable of being called programmatically
      // It already checks suggestionQuery.trim()
      // We'll call it, and it will use the updated `onlyAvailableFilter` from state.
      // This might lead to an extra render cycle but is the simplest change for now.
      setIsSuggestionsVisible(true); // Ensure the section is open to show loading/results
      setSuggestionsLoading(true); // Show loading immediately
      
      // Call handlePrimarySuggestButton. It will pick up the new `onlyAvailableFilter` state.
      // We need to ensure that the state update for onlyAvailableFilter has been processed.
      // React batches state updates. A direct call might use the old state value.
      // A robust way is to use useEffect or pass the new value explicitly to the search logic.

      // Let's try a slightly different approach: trigger the search logic directly here
      // to avoid issues with batched state updates if handlePrimarySuggestButton is called immediately.
      // This duplicates some logic from handlePrimarySuggestButton but ensures correct filter usage.
      
      // Re-evaluating: The simplest change that *should* work with React's batching is to set state
      // and then call the function that reads state. If it doesn't work due to timing,
      // a useEffect approach would be next.
      
      // Let's call a helper to do the fetch part of handlePrimarySuggestButton
      // This avoids re-checking button states etc.
      const performSearch = async (filter: boolean) => {
        setSuggestionsLoading(true);
        setSuggestionsError(null);
        setDomainSuggestions(null);
        setIsSuggestionsVisible(true);
        try {
          const data = await getDomainSuggestions(suggestionQuery.trim(), filter, 15); // Use the new filter value directly

          if (data.suggestions && data.suggestions.length > 0) {
            setDomainSuggestions(data);
          } else {
            // If API returns no suggestions, ensure the suggestions part of state is empty array
            setDomainSuggestions({ suggestions: [] }); 
            // setSuggestionsError(null); // Error is handled by catch block if API fails
          }
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "An unknown error occurred while fetching suggestions.";
          setSuggestionsError(errorMessage);
          setDomainSuggestions(null);
        } finally {
          setSuggestionsLoading(false);
        }
      };
      performSearch(newFilterValue);

    } else {
      // If no query, just ensure the section is visible to show any potential message (e.g. if it was hidden)
      // Or simply do nothing if the section was already hidden or empty.
      // For now, if there's no query, changing the toggle won't do anything until a query is entered.
      // We can clear results and keep it hidden or show a message.
      // Let's clear and hide if no query.
      setIsSuggestionsVisible(false);
    }
  };

  const handlePrimarySuggestButton = async () => {
    console.log("Fetching suggestions for: ", suggestionQuery);
    // If suggestions are currently loaded and visible, action is to hide.
    if (
      domainSuggestions &&
      domainSuggestions.suggestions.length > 0 &&
      isSuggestionsVisible
    ) {
      console.log("Hiding suggestions");
      setIsSuggestionsVisible(false);
      return;
    }

    // If suggestions are loaded but not visible, action is to show.
    if (
      domainSuggestions &&
      domainSuggestions.suggestions.length > 0 &&
      !isSuggestionsVisible
    ) {
      console.log("Showing suggestions");
      setIsSuggestionsVisible(true);
      return;
    }

    // Otherwise, action is to fetch (or re-fetch if query changed and results were cleared).
    console.log("Fetching suggestions for: ", suggestionQuery);
    if (!suggestionQuery.trim()) {
      console.log("No query");
      setSuggestionsError(
        "Please enter a keyword or domain to get suggestions."
      );
      setDomainSuggestions(null);
      setIsSuggestionsVisible(true); // Show the error
      return;
    }

    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setDomainSuggestions(null); // Clear previous results before new fetch
    setIsSuggestionsVisible(true); // Open collapse for loading spinner / results / error

    console.log("Fetching suggestions");
    try {
      const data = await getDomainSuggestions(suggestionQuery.trim(), onlyAvailableFilter, 15);
      console.log("Suggestions data: ", data);
      if (data.suggestions && data.suggestions.length > 0) {
        setDomainSuggestions(data);
      } else {
        setDomainSuggestions({ suggestions: [] }); // Set to an empty suggestions array
        setSuggestionsError(null); // Not an API error, just no results
      }
    } catch (err: any) {
      console.log("Error fetching suggestions: ", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred while fetching suggestions.";
      setSuggestionsError(errorMessage);
      setDomainSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const getSuggestButtonText = () => {
    if (suggestionsLoading) return "Suggesting...";
    if (domainSuggestions && domainSuggestions.suggestions.length > 0) {
      return isSuggestionsVisible ? "Hide Suggestions" : "Show Suggestions";
    }
    return "Get Suggestions";
  };

  return (
    <Section title="Suggest Domain Names" colorScheme={colorScheme}>
      <Stack spacing={4} direction={{ base: "column", md: "row" }} align="stretch">
        {/* Inner Stack for Toggle and Button */}
        <Stack direction={{ base: "column", sm: "row" }} spacing={4} align={{ base: "stretch", sm: "center" }}>
          <FormControl display="flex" alignItems="center" justifyContent="flex-start" whiteSpace="nowrap">
            <FormLabel htmlFor="only-available-switch" mb="0" mr={2} fontSize="sm">
              Only show available
            </FormLabel>
            <Switch
              id="only-available-switch"
              isChecked={onlyAvailableFilter}
              onChange={handleToggleOnlyAvailable}
              colorScheme={colorScheme}
              isDisabled={suggestionsLoading}
            />
          </FormControl>
          <Button
            colorScheme={colorScheme}
            px={8}
            onClick={handlePrimarySuggestButton}
            isLoading={suggestionsLoading}
            loadingText="Suggesting..."
            w={{ base: "100%", sm: "auto" }}
            leftIcon={
              getSuggestButtonText() === "Get Suggestions" ? (
                <FaSearch />
              ) : undefined
            }
          >
            {getSuggestButtonText()}
          </Button>
        </Stack>

        {/* Input Field on its own row */}
        <Input
          placeholder="Enter base domain or keyword (e.g., mybrand)"
          size="lg"
          value={suggestionQuery}
          onChange={handleSuggestionQueryChange}
          isDisabled={suggestionsLoading}
          onKeyPress={(event) => {
            if (event.key === "Enter") handlePrimarySuggestButton();
          }}
          w="100%"
        />
      </Stack>

      <Collapse in={isSuggestionsVisible} animateOpacity>
        <Box mt={4}>
          {suggestionsLoading && (
            <Box textAlign="center" py={4}>
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color={`${colorScheme}.500`}
                size="xl"
              />
            </Box>
          )}
          {suggestionsError && !suggestionsLoading && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {suggestionsError}
            </Alert>
          )}
          {domainSuggestions &&
            domainSuggestions.suggestions.length > 0 &&
            !suggestionsError &&
            !suggestionsLoading && (
              <TableContainer mt={4}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Suggested Domain</Th>
                      <Th textAlign="center">Available</Th>
                      {registrars.map(registrar => (
                        <Th key={registrar.id} textAlign="center">{registrar.name}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[...domainSuggestions.suggestions]
                      .sort((a, b) => {
                        const aAvailable = a.availability?.toUpperCase() === "AVAILABLE";
                        const bAvailable = b.availability?.toUpperCase() === "AVAILABLE";
                        if (aAvailable && !bAvailable) return -1;
                        if (!aAvailable && bAvailable) return 1;
                        return 0;
                      })
                      .map((suggestion, index) => (
                        <Tr key={suggestion.domainName || index}>
                          <Td>{suggestion.domainName || "N/A"}</Td>
                          <Td textAlign="center">
                            {suggestion.availability?.toUpperCase() === "AVAILABLE" ? (
                              <FaCheck color={useColorModeValue("green.500", "green.300")} />
                            ) : null}
                          </Td>
                          {registrars.map(registrar => (
                            <Td key={registrar.id} textAlign="center">
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme={
                                  suggestion.availability?.toUpperCase() === "AVAILABLE"
                                    ? "green"
                                    : "blue"
                                }
                                onClick={() => {
                                  if (suggestion.domainName) {
                                    const url = registrar.urlTemplate.replace('{DOMAIN_NAME}', suggestion.domainName);
                                    window.open(url, "_blank");
                                  }
                                }}
                                isDisabled={!suggestion.domainName} // Disable if no domain name
                              >
                                {suggestion.availability?.toUpperCase() === "AVAILABLE"
                                  ? "Purchase"
                                  : "Inquire"}
                              </Button>
                            </Td>
                          ))}
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          {domainSuggestions &&
            domainSuggestions.suggestions.length === 0 &&
            !suggestionsError &&
            !suggestionsLoading && (
              <Text
                textAlign="center"
                color={useColorModeValue("gray.600", "gray.400")}
                py={4}
              >
                No suggestions found for "{suggestionQuery}". Try a different
                keyword.
              </Text>
            )}
        </Box>
      </Collapse>
    </Section>
  );
};

export default DomainSuggestions;
