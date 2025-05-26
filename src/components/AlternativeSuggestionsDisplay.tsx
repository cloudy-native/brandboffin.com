import {
  Box,
  Heading,
  List,
  ListItem,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import type { DomainSuggestion as ApiDomainSuggestion, GetDomainSuggestionsResponse } from "../utils/api";

export interface AlternativeSuggestionsDisplayProps {
  suggestionsData: GetDomainSuggestionsResponse | null | undefined;
  title?: string;
  onSuggestionClick?: (domainName: string) => void;
}

export const AlternativeSuggestionsDisplay: React.FC<AlternativeSuggestionsDisplayProps> = ({
  suggestionsData,
  title = "Alternative Suggestions:",
  onSuggestionClick,
}) => {
  const groupSuggestionsByTld = (
    suggestions: ApiDomainSuggestion[] = []
  ): Record<string, ApiDomainSuggestion[]> => {
    return suggestions.reduce(
      (acc, suggestion) => {
        const domainName = suggestion.domainName;
        if (!domainName) {
          return acc;
        }
        const firstDotIndex = domainName.indexOf(".");
        const tld =
          firstDotIndex > 0
            ? domainName.substring(firstDotIndex)
            : domainName.length > 0
            ? ".other" // Group domains without a clear TLD (e.g. just 'example')
            : ""; // Should not happen if DomainName is present
        if (!tld) return acc;

        if (!acc[tld]) {
          acc[tld] = [];
        }
        acc[tld].push(suggestion);
        return acc;
      },
      {} as Record<string, ApiDomainSuggestion[]>
    );
  };

  const groupedSuggestions = React.useMemo(() => {
    return groupSuggestionsByTld(suggestionsData?.suggestions);
  }, [suggestionsData]);

  if (suggestionsData && Object.keys(groupedSuggestions).length > 0) {
    return (
      <Box
        p={4}
        borderWidth="1px"
        borderRadius="md"
        shadow="sm"
        bg={useColorModeValue("white", "gray.700")}
      >
        <Heading
          as="h3"
          size="md"
          mb={3}
          color={useColorModeValue("gray.700", "gray.200")}
        >
          {title}
        </Heading>
        {Object.entries(groupedSuggestions).map(([tld, suggestionsInTld]) => (
          <Box key={tld} mb={4} mt={3}>
            <Heading
              size="xs"
              textTransform="uppercase"
              letterSpacing="wide"
              color={useColorModeValue("gray.700", "gray.300")}
              mb={2}
              borderBottomWidth="1px"
              pb={1}
              borderColor={useColorModeValue("gray.200", "gray.700")}
            >
              {tld}
            </Heading>
            <List spacing={1} fontSize="sm" pl={1}>
              {suggestionsInTld.map((sugg, idx) => (
                <ListItem
                  key={`suggestion-${idx}`}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  onClick={
                    onSuggestionClick && sugg.domainName
                      ? () => onSuggestionClick(sugg.domainName!)
                      : undefined
                  }
                  cursor={onSuggestionClick ? "pointer" : "default"}
                  _hover={
                    onSuggestionClick
                      ? { bg: useColorModeValue("gray.100", "gray.600") }
                      : {}
                  }
                >
                  <Text>{sugg.domainName}</Text>
                  <Tag
                    size="sm"
                    variant="subtle"
                    colorScheme={
                      sugg.availability === "AVAILABLE"
                        ? "green"
                        : sugg.availability === "UNAVAILABLE"
                        ? "red"
                        : "yellow" // For 'UNKNOWN' or other states
                    }
                  >
                    {sugg.availability || "N/A"}
                  </Tag>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    );
  } else if (
    suggestionsData &&
    suggestionsData.suggestions &&
    suggestionsData.suggestions.length === 0
  ) {
    return (
      <Text
        fontSize="sm"
        color={useColorModeValue("gray.500", "gray.400")}
        mt={3}
      >
        No alternative suggestions found.
      </Text>
    );
  }
  return null;
};

export default AlternativeSuggestionsDisplay;
