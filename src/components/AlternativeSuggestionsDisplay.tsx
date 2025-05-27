import {
  Box,
  Card, // Added Card
  CardBody, // Added CardBody
  CardHeader, // Added CardHeader
  Heading,
  List,
  ListItem,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { bgShade, secondaryDark, secondaryLight } from "../theme/design";
import type {
  DomainSuggestion as ApiDomainSuggestion,
  GetDomainSuggestionsResponse,
} from "../utils/api";

export interface AlternativeSuggestionsDisplayProps {
  suggestionsData: GetDomainSuggestionsResponse | null | undefined;
  onSuggestionClick?: (domainName: string) => void;
}

interface GroupedByTldAndAvailability {
  available: ApiDomainSuggestion[];
  unavailable: ApiDomainSuggestion[];
}

export const AlternativeSuggestionsDisplay: React.FC<
  AlternativeSuggestionsDisplayProps
> = ({ suggestionsData, onSuggestionClick }) => {
  const groupSuggestionsByTld = React.useCallback(
    (
      suggestions: ApiDomainSuggestion[] = []
    ): Record<string, GroupedByTldAndAvailability> => {
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
                : "";
          if (!tld) return acc;

          if (!acc[tld]) {
            acc[tld] = { available: [], unavailable: [] };
          }

          if (suggestion.available) {
            acc[tld].available.push(suggestion);
          } else {
            acc[tld].unavailable.push(suggestion);
          }
          return acc;
        },
        {} as Record<string, GroupedByTldAndAvailability>
      );
    },
    []
  );

  const processedSuggestions = React.useMemo(() => {
    const suggestionsToList = suggestionsData?.suggestions || [];
    return groupSuggestionsByTld(suggestionsToList);
  }, [suggestionsData, groupSuggestionsByTld]);

  if (
    suggestionsData &&
    suggestionsData.suggestions &&
    suggestionsData.suggestions.length > 0
  ) {
    if (Object.keys(processedSuggestions).length > 0) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mt={3}>
          {Object.entries(processedSuggestions)
            .sort(([tldA, groupsA], [tldB, groupsB]) => {
              const totalA =
                groupsA.available.length + groupsA.unavailable.length;
              const totalB =
                groupsB.available.length + groupsB.unavailable.length;
              return totalB - totalA; // Sort descending
            })
            .map(([tld, domainGroups]) => (
              <Card key={tld} variant="outline">
                <CardHeader pb={2}>
                  <Heading
                    size="sm"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    color={useColorModeValue("gray.600", "gray.300")}
                  >
                    {tld}
                  </Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={3} align="stretch">
                    {domainGroups.available.length > 0 && (
                      <Box>
                        <Heading
                          size="xs"
                          color={useColorModeValue("green.600", "green.300")}
                          mb={1.5}
                        >
                          Available
                        </Heading>
                        <List spacing={1} fontSize="sm">
                          {domainGroups.available.map((sugg, idx) => (
                            <ListItem
                              key={`available-${tld}-${idx}`}
                              py={1}
                              px={2}
                              onClick={
                                onSuggestionClick && sugg.domainName
                                  ? () => onSuggestionClick(sugg.domainName!)
                                  : undefined
                              }
                              cursor={onSuggestionClick ? "pointer" : "default"}
                              _hover={
                                onSuggestionClick
                                  ? {
                                      bg: useColorModeValue(
                                        "gray.100",
                                        "gray.700"
                                      ),
                                    }
                                  : {}
                              }
                              borderRadius="md"
                            >
                              <Text>{sugg.domainName}</Text>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    {domainGroups.unavailable.length > 0 && (
                      <Box>
                        <Heading
                          size="xs"
                          color={useColorModeValue("red.600", "red.300")}
                          mb={1.5}
                        >
                          Not Available
                        </Heading>
                        <List spacing={1} fontSize="sm">
                          {domainGroups.unavailable.map((sugg, idx) => (
                            <ListItem
                              key={`unavailable-${tld}-${idx}`}
                              py={1}
                              px={2}
                              onClick={
                                onSuggestionClick && sugg.domainName
                                  ? () => onSuggestionClick(sugg.domainName!)
                                  : undefined
                              }
                              cursor={onSuggestionClick ? "pointer" : "default"}
                              _hover={
                                onSuggestionClick
                                  ? {
                                      bg: useColorModeValue(
                                        "gray.100",
                                        "gray.700"
                                      ),
                                    }
                                  : {}
                              }
                              borderRadius="md"
                            >
                              <Text
                                color={useColorModeValue("gray.600", "gray.400")}
                              >
                                {sugg.domainName}
                              </Text>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}
        </SimpleGrid>
      );
    } else {
      return (
        <Box
          p={4}
          borderWidth="1px"
          borderRadius="md"
          shadow="sm"
          bg={useColorModeValue("white", "gray.700")}
        >
          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
            No alternative suggestions to display.
          </Text>
        </Box>
      );
    }
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
