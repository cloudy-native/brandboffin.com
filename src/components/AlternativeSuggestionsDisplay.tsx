import {
  Box,
  Heading,
  List,
  ListItem,
  SimpleGrid,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { cardBackgroundShade, headingShade, textShade } from "../theme/design";
import type { DomainSuggestion as ApiDomainSuggestion } from "../utils/api";

export interface AlternativeSuggestionsDisplayProps {
  suggestions: ApiDomainSuggestion[] | undefined;
  domainName?: string;
  onSuggestionClick?: (domainName: string) => void;
}

interface GroupedByTldAndAvailability {
  available: ApiDomainSuggestion[];
  unavailable: ApiDomainSuggestion[];
}

export const AlternativeSuggestionsDisplay: React.FC<
  AlternativeSuggestionsDisplayProps
> = ({ suggestions, domainName, onSuggestionClick }) => {
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

  const cardBgColor = useColorModeValue(cardBackgroundShade.light, cardBackgroundShade.dark);
  const headingColor = useColorModeValue(headingShade.light, headingShade.dark);
  const textColor = useColorModeValue(textShade.light, textShade.dark);

  const processedSuggestions = React.useMemo(() => {
    const suggestionsToList = suggestions || [];
    return groupSuggestionsByTld(suggestionsToList);
  }, [suggestions, groupSuggestionsByTld]);

  if (suggestions && suggestions.length > 0) {
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
              <Box
                key={tld}
                p={3}
                borderWidth="1px"
                borderRadius="lg"
                boxShadow="md"
                bg={cardBgColor}
                display="flex" // Added for consistency
                flexDirection="column" // Added for consistency
              >
                <Heading
                  size="sm"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  color={headingColor}
                  mb={2} // To maintain spacing
                >
                  {tld}
                </Heading>
                <VStack spacing={3} align="stretch">
                  {domainGroups.available.length > 0 && (
                    <Box>
                      <Heading
                        size="xs"
                        color={headingColor}
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
                            <Text color={textColor}>{sugg.domainName}</Text>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {domainGroups.unavailable.length > 0 && (
                    <Box>
                      <Heading
                        size="xs"
                        color={headingColor}
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
                              color={textColor}
                            >
                              {sugg.domainName}
                            </Text>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </VStack>
              </Box>
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
          bg={cardBgColor}
        >
          <Text fontSize="sm" color={textColor}>
            No alternative suggestions to display.
          </Text>
        </Box>
      );
    }
  } else if (suggestions && suggestions.length === 0) {
    return (
      <Text
        fontSize="sm"
        color={textColor}
        mt={3}
      >
        No alternative suggestions found.
      </Text>
    );
  }
  return null;
};

export default AlternativeSuggestionsDisplay;
