import { CheckCircleIcon, InfoIcon, SmallCloseIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import * as React from "react";
import type { DomainSuggestion as ApiDomainSuggestion } from "../../utils/api";
import { AlternativeSuggestionsDisplay } from "../AlternativeSuggestionsDisplay";

import {
  accentShade,
  backgroundShade,
  borderShade,
  cardBackgroundShade,
  headingShade,
  primaryColorScheme,
  Shade,
  textShade,
} from "../../theme/design";
import {
  checkDomainAvailability,
  getDomainSuggestions,
  suggestBrandNames,
  type BrandNameSuggestionRequest,
  type DomainCheckResponse,
  type DomainCheckResult,
} from "../../utils/api";
import { formatDomainFromBrand } from "../../utils/domainFormatter";
import Section from "../Section";

export interface BrandDomainStatus {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  brandSuggestedDomains?: string[]; // Original list from AI
  suggestedDomainAvailability?: DomainCheckResult[];
  checkingSuggestedDomainsLoading?: boolean;
  checkingSuggestedDomainsError?: string | null;
}

interface BrandNameGeneratorSectionProps {}

export const BrandNameGeneratorSection: React.FC<
  BrandNameGeneratorSectionProps
> = () => {
  const [brandPrompt, setBrandPrompt] = React.useState<string>("");
  const [brandDomainStatuses, setBrandDomainStatuses] = React.useState<
    BrandDomainStatus[] | null
  >(null);
  const [brandNamesLoading, setBrandNamesLoading] =
    React.useState<boolean>(false);
  const [brandNamesError, setBrandNamesError] = React.useState<string | null>(
    null
  );

  const [industry, setIndustry] = React.useState<string>("");
  const [style, setStyle] = React.useState<string>("");
  const [keywords, setKeywords] = React.useState<string>("");

  const [length, setLength] = React.useState<number>(10);
  const [count, setCount] = React.useState<number>(10);

  // State for Alternative Suggestions Modal
  const {
    isOpen: isAlternativesModalOpen,
    onOpen: onOpenAlternativesModal,
    onClose: onCloseAlternativesModal,
  } = useDisclosure();
  const [selectedDomainForAlternatives, setSelectedDomainForAlternatives] =
    React.useState<string | null>(null);
  const [alternativeSuggestions, setAlternativeSuggestions] = React.useState<
    ApiDomainSuggestion[] | null
  >(null);
  const [alternativesLoading, setAlternativesLoading] =
    React.useState<boolean>(false);
  const [alternativesError, setAlternativesError] = React.useState<
    string | null
  >(null);

  // Effect to fetch alternative suggestions when a domain is selected
  React.useEffect(() => {
    if (selectedDomainForAlternatives) {
      const fetchAlternatives = async () => {
        setAlternativesLoading(true);
        setAlternativeSuggestions(null);
        setAlternativesError(null);
        try {
          const response = await getDomainSuggestions(
            selectedDomainForAlternatives,
            true,
            20
          );
          setAlternativeSuggestions(response.suggestions || []);
        } catch (err) {
          setAlternativesError(
            err instanceof Error
              ? err.message
              : "Failed to load alternative suggestions."
          );
        }
        setAlternativesLoading(false);
      };
      fetchAlternatives();
    }
  }, [selectedDomainForAlternatives]);

  const handleDomainSuggestionClick = (domain: string) => {
    setSelectedDomainForAlternatives(domain);
    onOpenAlternativesModal();
  };

  const handleGenerateBrandNamesSubmit = async () => {
    if (!brandPrompt.trim()) {
      setBrandNamesError("Please enter a prompt for brand name ideas.");
      return;
    }
    setBrandNamesLoading(true);
    setBrandNamesError(null);
    setBrandDomainStatuses(null); // Clear previous results

    try {
      const requestBody: BrandNameSuggestionRequest = { prompt: brandPrompt };

      if (industry.trim()) requestBody.industry = industry.trim();
      if (style.trim()) requestBody.style = style.trim();
      if (keywords.trim()) {
        requestBody.keywords = keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k !== "");
      }
      if (typeof length === "number" && !isNaN(length) && length > 0) {
        requestBody.length = length;
      }
      if (typeof count === "number" && !isNaN(count) && count > 0) {
        requestBody.count = count;
      }
      // If count is NaN (e.g. empty input) or not positive, it won't be sent, allowing API default.
      const result = await suggestBrandNames(requestBody);

      if (result.suggestions && result.suggestions.length > 0) {
        const initialStatuses: BrandDomainStatus[] = result.suggestions.map(
          (suggestion, index) => ({
            id: `${index}`,
            name: suggestion.name,
            tagline: suggestion.tagline,
            domain: formatDomainFromBrand(suggestion.name),
            // Keep the original AI suggested domains, they might contain duplicates or be unfiltered
            brandSuggestedDomains: suggestion.suggestedDomains || [],
            suggestedDomainAvailability: [], // Initialize
            checkingSuggestedDomainsLoading: false, // Initialize
            checkingSuggestedDomainsError: null, // Initialize
          })
        );
        setBrandDomainStatuses(initialStatuses);
      } else {
        setBrandDomainStatuses([]); // No suggestions found
      }
    } catch (err) {
      if (err instanceof Error) {
        setBrandNamesError(err.message);
      } else {
        setBrandNamesError(
          "An unknown error occurred while generating brand names."
        );
      }
      setBrandDomainStatuses(null);
    } finally {
      setBrandNamesLoading(false);
    }
  };

  function colorModeFor(shade: Shade) {
    return useColorModeValue(shade.light, shade.dark);
  }

  const headingColor = colorModeFor(headingShade);
  const textColor = colorModeFor(textShade);
  const cardBgColor = colorModeFor(cardBackgroundShade);
  const modalBgColor = colorModeFor(backgroundShade);
  const borderColor = colorModeFor(borderShade);
  const spinnerColor = colorModeFor(accentShade);

  const handleCheckSuggestedDomains = async (brandId: string) => {
    setBrandDomainStatuses((prevStatuses) => {
      if (!prevStatuses) return null;
      return prevStatuses.map((brand) =>
        brand.id === brandId
          ? {
              ...brand,
              checkingSuggestedDomainsLoading: true,
              checkingSuggestedDomainsError: null,
              suggestedDomainAvailability: [], // Clear previous results
            }
          : brand
      );
    });

    const brandToCheck = brandDomainStatuses?.find((b) => b.id === brandId);

    if (
      brandToCheck &&
      brandToCheck.brandSuggestedDomains &&
      brandToCheck.brandSuggestedDomains.length > 0
    ) {
      const domainPromises = brandToCheck.brandSuggestedDomains.map((domain) =>
        checkDomainAvailability(domain)
          .then(
            (response: DomainCheckResponse) =>
              ({ status: "fulfilled", value: response.result, domain }) as const
          )
          .catch(
            (error: any) =>
              ({ status: "rejected", reason: error, domain }) as const
          )
      );

      try {
        const results = await Promise.all(domainPromises);

        type SettledDomainResult =
          | { status: "fulfilled"; value: DomainCheckResult; domain: string }
          | { status: "rejected"; reason: any; domain: string };

        const domainCheckResults: DomainCheckResult[] = results.map(
          (result: SettledDomainResult) => {
            if (result.status === "fulfilled") {
              return result.value;
            }
            // For rejected promises, construct a DomainCheckResult with an error message
            return {
              domain: result.domain,
              available: false, // Assume unavailable on error
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : "API error",
            };
          }
        );

        setBrandDomainStatuses((prevStatuses) => {
          if (!prevStatuses) return null;
          return prevStatuses.map((brand) =>
            brand.id === brandId
              ? {
                  ...brand,
                  suggestedDomainAvailability: domainCheckResults,
                  checkingSuggestedDomainsLoading: false,
                }
              : brand
          );
        });
      } catch (error) {
        setBrandDomainStatuses((prevStatuses) => {
          if (!prevStatuses) return null;
          return prevStatuses.map((brand) =>
            brand.id === brandId
              ? {
                  ...brand,
                  checkingSuggestedDomainsLoading: false,
                  checkingSuggestedDomainsError:
                    error instanceof Error
                      ? error.message
                      : "An unexpected error occurred during parallel checks.",
                }
              : brand
          );
        });
      }
    } else {
      setBrandDomainStatuses((prevStatuses) => {
        if (!prevStatuses) return null;
        return prevStatuses.map((brand) =>
          brand.id === brandId
            ? {
                ...brand,
                checkingSuggestedDomainsLoading: false,
                checkingSuggestedDomainsError:
                  "No domains to check or brand details are missing.",
              }
            : brand
        );
      });
    }
  };

  return (
    <Section title="I Want an Excellent Brand Identity">
      {/* Modal for Alternative Suggestions */}
      {selectedDomainForAlternatives && (
        <Modal
          isOpen={isAlternativesModalOpen}
          onClose={onCloseAlternativesModal}
          size="4xl"
        >
          <ModalOverlay />
          <ModalContent bg={modalBgColor}>
            <ModalHeader>
              Alternatives for "{selectedDomainForAlternatives}"
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {alternativesLoading && (
                <Box textAlign="center" py={10}>
                  <Spinner size="xl" color={spinnerColor} />
                  <Text mt={2}>Loading alternative suggestions...</Text>
                </Box>
              )}
              {alternativesError && (
                <Alert status="error">
                  <AlertIcon />
                  {alternativesError}
                </Alert>
              )}
              {!alternativesLoading &&
                !alternativesError &&
                alternativeSuggestions && (
                  <AlternativeSuggestionsDisplay
                    suggestions={alternativeSuggestions}
                    domainName={selectedDomainForAlternatives}
                  />
                )}
              {!alternativesLoading &&
                !alternativesError &&
                (!alternativeSuggestions ||
                  alternativeSuggestions.length === 0) && (
                  <Text>
                    No alternative suggestions found for "
                    {selectedDomainForAlternatives}".
                  </Text>
                )}
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme={primaryColorScheme}
                onClick={onCloseAlternativesModal}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <Box>
        <VStack spacing={4} align="stretch">
          <FormControl id="brand-prompt">
            <FormLabel fontWeight="bold" fontSize="lg" color={headingColor}>
              Describe your business or idea:
            </FormLabel>
            <Textarea
              borderColor={borderColor}
              value={brandPrompt}
              onChange={(e) => setBrandPrompt(e.target.value)}
              placeholder="e.g., A subscription service for eco-friendly pet toys"
              size="lg"
              minHeight="100px"
            />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="industry">
              <FormLabel>Industry (Optional)</FormLabel>
              <Input
                borderColor={borderColor}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Food, Fashion"
              />
            </FormControl>
            <FormControl id="style">
              <FormLabel>Style (Optional)</FormLabel>
              <Input
                borderColor={borderColor}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g., Modern, Playful, Elegant"
              />
            </FormControl>
          </SimpleGrid>
          <FormControl id="keywords">
            <FormLabel>Keywords (Optional, comma-separated)</FormLabel>
            <Input
              borderColor={borderColor}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., sustainable, innovative, global"
            />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="length">
              <FormLabel>Approx. Length (Optional)</FormLabel>
              <NumberInput
                borderColor={borderColor}
                value={length}
                onChange={(_valueAsString, valueAsNumber) =>
                  setLength(valueAsNumber)
                }
                min={3}
                max={30}
              >
                <NumberInputField placeholder="e.g., 10 characters" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl id="count">
              <FormLabel>Number of Suggestions (Optional)</FormLabel>
              <NumberInput
                borderColor={borderColor}
                value={count}
                onChange={(_valueAsString, valueAsNumber) =>
                  setCount(valueAsNumber)
                }
                min={1}
                max={20}
                defaultValue={5} // Default to 5 suggestions
              >
                <NumberInputField placeholder="e.g., 5" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>
          <Button
            onClick={handleGenerateBrandNamesSubmit}
            colorScheme={primaryColorScheme}
          >
            Generate Brand Name Ideas
          </Button>
        </VStack>

        {brandNamesLoading && (
          <Box textAlign="center" mt={8}>
            <Spinner size="xl" color={spinnerColor} thickness="4px" />
            <Text color={textColor} mt={2} fontSize="lg" fontWeight="medium">
              Generating amazing brand ideas for you...
            </Text>
          </Box>
        )}
        {brandNamesError && (
          <Alert status="error" mt={6} borderRadius="md">
            <AlertIcon />
            {brandNamesError}
          </Alert>
        )}
        {brandDomainStatuses && brandDomainStatuses.length > 0 && (
          <Box mt={10}>
            <Heading as="h3" size="lg" color={headingColor} pb={2}>
              Brand Name Ideas and Domain Suggestions
            </Heading>

            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              {brandDomainStatuses.map((brand) => (
                <Box
                  key={brand.id}
                  p={3}
                  borderWidth="1px"
                  borderRadius="lg"
                  boxShadow="md"
                  bg={cardBgColor}
                  display="flex"
                  flexDirection="column"
                >
                  <VStack
                    align="stretch"
                    flex={1}
                    justifyContent="space-between"
                  >
                    <VStack align="stretch" spacing={1}>
                      <Heading
                        as="h4"
                        size="md"
                        noOfLines={2}
                        title={brand.name}
                        color={headingColor}
                      >
                        {brand.name}
                      </Heading>
                      <Text fontSize="sm" color={textColor} mt={1} mb={2}>
                        {brand.tagline}
                      </Text>

                      {/* Display Suggested Domain Availability Results */}
                      {brand.suggestedDomainAvailability &&
                        brand.suggestedDomainAvailability.length > 0 && (
                          <Box mt={3}>
                            <List spacing={1} fontSize="sm">
                              {brand.suggestedDomainAvailability.map(
                                (item, idx) => (
                                  <ListItem
                                    key={`${brand.id}-sugg-avail-${idx}`}
                                    onClick={() =>
                                      handleDomainSuggestionClick(item.domain)
                                    }
                                    cursor="pointer"
                                    _hover={{
                                      bg: useColorModeValue(
                                        "gray.100",
                                        "gray.700"
                                      ),
                                    }}
                                    p={1}
                                    borderRadius="md"
                                  >
                                    <ListIcon
                                      as={
                                        item.available
                                          ? CheckCircleIcon
                                          : SmallCloseIcon
                                      }
                                      color={
                                        item.available ? "green.500" : "red.500"
                                      }
                                      verticalAlign="middle"
                                    />
                                    {item.domain}
                                    {item.error && (
                                      <Text
                                        as="span"
                                        fontSize="xs"
                                        color="red.500"
                                        ml={1}
                                      >
                                        ({item.error})
                                      </Text>
                                    )}
                                  </ListItem>
                                )
                              )}
                            </List>
                          </Box>
                        )}
                      {/* Hide original tags if results are shown */}
                      {(!brand.suggestedDomainAvailability ||
                        brand.suggestedDomainAvailability.length === 0) &&
                        brand.brandSuggestedDomains &&
                        brand.brandSuggestedDomains.length > 0 && (
                          <Box mt={2}>
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              mb={1}
                              color={textColor}
                            >
                              Suggested Domain Ideas:
                            </Text>
                            <HStack spacing={2} wrap="wrap">
                              {brand.brandSuggestedDomains.map(
                                (domain, idx) => (
                                  <Tag
                                    key={`${brand.id}-ai-suggested-${idx}`}
                                    size="md"
                                    variant="subtle"
                                    colorScheme={primaryColorScheme}
                                  >
                                    {domain}
                                  </Tag>
                                )
                              )}
                            </HStack>
                          </Box>
                        )}
                    </VStack>

                    <Box width="100%" mt={3}>
                      {brand.brandSuggestedDomains &&
                        brand.brandSuggestedDomains.length > 0 && (
                          <>
                            {brand.suggestedDomainAvailability &&
                            brand.suggestedDomainAvailability.length > 0 ? (
                              <HStack
                                spacing={2}
                                align="center"
                                justify="center"
                                p={2}
                                borderWidth="1px"
                                borderRadius="md"
                                borderColor={useColorModeValue(
                                  "gray.200",
                                  "gray.600"
                                )}
                                width="100%"
                                role="status"
                              >
                                <InfoIcon color="blue.500" />
                                <Text fontSize="sm" color={textColor}>
                                  Click a domain above for more ideas
                                </Text>
                              </HStack>
                            ) : (
                              <Button
                                size="sm"
                                colorScheme={primaryColorScheme}
                                onClick={() =>
                                  handleCheckSuggestedDomains(brand.id)
                                }
                                isLoading={
                                  brand.checkingSuggestedDomainsLoading
                                }
                                isDisabled={
                                  brand.checkingSuggestedDomainsLoading
                                }
                                loadingText="Checking..."
                                width="100%"
                              >
                                Check Availability
                              </Button>
                            )}
                          </>
                        )}
                      {brand.checkingSuggestedDomainsError && (
                        <Alert
                          status="error"
                          mt={2}
                          fontSize="xs"
                          borderRadius="md"
                          p={2}
                        >
                          <AlertIcon boxSize="14px" />
                          <Box flex="1" ml={1}>
                            <AlertTitle fontSize="xs" fontWeight="bold">
                              Error checking domains!
                            </AlertTitle>
                            <AlertDescription display="block" fontSize="xs">
                              {brand.checkingSuggestedDomainsError}
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                    </Box>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
        {brandDomainStatuses &&
          brandDomainStatuses.length === 0 &&
          !brandNamesLoading && (
            <Text color={textColor} mt={6} fontSize="md" textAlign="center">
              No brand name suggestions were generated for your prompt. Try
              being more specific or rephrasing.
            </Text>
          )}
      </Box>
    </Section>
  );
};
