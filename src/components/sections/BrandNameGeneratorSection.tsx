import { CheckCircleIcon, SmallCloseIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
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
  Text,
  Textarea,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import * as React from "react";
import type {
  DomainSuggestion,
  GetDomainSuggestionsResponse,
} from "../../../common/types";
import { AlternativeSuggestionsDisplay } from "../../components/AlternativeSuggestionsDisplay";
import {
  backgroundShade,
  cardBackgroundShade,
  headingShade,
  primaryColorScheme,
  textShade,
  accentShade,
  borderShade,
} from "../../theme/design";
import {
  checkDomainAvailability,
  getDomainSuggestions,
  suggestBrandNames,
  type BrandNameSuggestionRequest,
} from "../../utils/api";
import { formatDomainFromBrand } from "../../utils/domainFormatter";
import Section from "../Section";

export interface BrandDomainStatus {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  isChecking: boolean;
  isAvailable?: boolean;
  error?: string | null;
  alternativeSuggestions?: GetDomainSuggestionsResponse["suggestions"];
  showAlternatives?: boolean;
  isFetchingAlternatives?: boolean;
  alternativesError?: string | null;
}

interface BrandNameGeneratorSectionProps {}

export const BrandNameGeneratorSection: React.FC<
  BrandNameGeneratorSectionProps
> = () => {
  const spinnerColor = useColorModeValue(accentShade.light, accentShade.dark);
  const [brandPrompt, setBrandPrompt] = React.useState<string>("");
  const [brandDomainStatuses, setBrandDomainStatuses] = React.useState<
    BrandDomainStatus[] | null
  >(null);
  const [brandNamesLoading, setBrandNamesLoading] =
    React.useState<boolean>(false);
  const [brandNamesError, setBrandNamesError] = React.useState<string | null>(
    null
  );
  const isEffectChecking = React.useRef<boolean>(false);

  interface AlternativesModalData {
    brandDomain: string;
    suggestions: DomainSuggestion[] | null;
    isLoading: boolean;
    error: string | null;
  }
  const [isAlternativesModalOpen, setIsAlternativesModalOpen] =
    React.useState<boolean>(false);
  const [alternativesModalData, setAlternativesModalData] =
    React.useState<AlternativesModalData | null>(null);

  const fetchAlternativeSuggestionsApi = async (
    baseName: string,
    onlyAvailable: boolean = false
  ): Promise<GetDomainSuggestionsResponse> => {
    console.log(`Fetching alternative suggestions for domain: "${baseName}"`);

    try {
      return await getDomainSuggestions(baseName, onlyAvailable);
    } catch (error: any) {
      console.error(`Error fetching alternative suggestions: ${error.message}`);
      throw new Error(
        error.message || "Failed to fetch alternative domain suggestions."
      );
    }
  };

  const handleSuggestAlternativesClick = async (brandId: string) => {
    const brandToFetchFor = brandDomainStatuses?.find((b) => b.id === brandId);
    if (!brandToFetchFor) return;

    setIsAlternativesModalOpen(true);
    setAlternativesModalData({
      brandDomain: brandToFetchFor.domain,
      suggestions: null,
      isLoading: true,
      error: null,
    });

    try {
      const data = await fetchAlternativeSuggestionsApi(
        brandToFetchFor.domain,
        true
      );
      setAlternativesModalData({
        brandDomain: brandToFetchFor.domain,
        suggestions: data.suggestions,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAlternativesModalData({
        brandDomain: brandToFetchFor.domain,
        suggestions: null,
        isLoading: false,
        error: error.message || "Failed to fetch alternative suggestions.",
      });
    }
  };
  const [industry, setIndustry] = React.useState<string>("");
  const [style, setStyle] = React.useState<string>("");
  const [keywords, setKeywords] = React.useState<string>("");

  const [length, setLength] = React.useState<string>("10");
  const [count, setCount] = React.useState<string>("10");

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
      const lengthNum = parseInt(length, 10);
      if (!isNaN(lengthNum) && lengthNum > 0) requestBody.length = lengthNum;
      const countNum = parseInt(count, 10);
      // Use default of 5 if not specified or invalid, but still allow API default if empty
      if (!isNaN(countNum) && countNum > 0) {
        requestBody.count = countNum;
      } else if (count.trim() === "" && !requestBody.count) {
        // If user left it blank and we haven't set a default from elsewhere
        // we can let the API decide or explicitly set a default here if desired.
        // For now, let API decide if blank. If they input '0' or invalid, it won't be sent.
      }
      const result = await suggestBrandNames(requestBody);

      if (result.suggestions && result.suggestions.length > 0) {
        const initialStatuses: BrandDomainStatus[] = result.suggestions.map(
          (suggestion, index) => ({
            id: `${index}`,
            name: suggestion.name,
            tagline: suggestion.tagline,
            domain: formatDomainFromBrand(suggestion.name),
            isChecking: true,
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

  React.useEffect(() => {
    if (isEffectChecking.current) {
      return;
    }

    const brandToCheck = brandDomainStatuses?.find((b) => b.isChecking);

    if (brandToCheck) {
      const checkDomainAsync = async () => {
        isEffectChecking.current = true; // Set lock
        try {
          const domainCheck = await checkDomainAvailability(
            brandToCheck.domain
          );
          setBrandDomainStatuses((prevStatuses) =>
            prevStatuses
              ? prevStatuses.map((b) =>
                  b.id === brandToCheck.id
                    ? {
                        ...b,
                        isChecking: false,
                        isAvailable: domainCheck.result.available,
                        error: domainCheck.result.error || null,
                      }
                    : b
                )
              : null
          );
        } catch (error: any) {
          setBrandDomainStatuses((prevStatuses) =>
            prevStatuses
              ? prevStatuses.map((b) =>
                  b.id === brandToCheck.id
                    ? {
                        ...b,
                        isChecking: false, // Mark this one as done, even on error
                        error:
                          error.message ||
                          "Failed to check domain availability.",
                      }
                    : b
                )
              : null
          );
        } finally {
          isEffectChecking.current = false; // Release lock
        }
      };
      checkDomainAsync();
    }
  }, [brandDomainStatuses]);

  const headingColor = useColorModeValue(headingShade.light, headingShade.dark);

  const textColor = useColorModeValue(textShade.light, textShade.dark);

  const cardBgColor = useColorModeValue(
    cardBackgroundShade.light,
    cardBackgroundShade.dark
  );

  const modalBgColor = useColorModeValue(
    backgroundShade.light,
    backgroundShade.dark
  );

  const borderColor = useColorModeValue(borderShade.light, borderShade.dark);

  return (
    <Section title="I Want an Excellent Brand Identity">
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
                onChange={(valueString) => setLength(valueString)}
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
                onChange={(valueString) => setCount(valueString)}
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
              Generating amazing brand names for you...
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
              Brand Name Ideas
            </Heading>
            <Text fontSize="sm" color={textColor} mb={6}>
              <Icon as={CheckCircleIcon} color="green.500" mr={1} /> Available
              <Icon as={SmallCloseIcon} color="red.500" mx={1} /> Unavailable
            </Text>
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
                      {brand.tagline && (
                        <Text
                          fontSize="sm"
                          color={textColor}
                          fontStyle="italic"
                          noOfLines={2}
                          title={brand.tagline}
                        >
                          {brand.tagline}
                        </Text>
                      )}
                    </VStack>

                    <VStack align="stretch" spacing={2} mt={3}>
                      <HStack align="center">
                        {brand.isChecking ? (
                          <Spinner size="sm" color={spinnerColor} />
                        ) : brand.isAvailable === true ? (
                          <Icon
                            as={CheckCircleIcon}
                            color="green.500"
                            boxSize={5}
                          />
                        ) : brand.isAvailable === false ? (
                          <Icon
                            as={SmallCloseIcon}
                            color="red.500"
                            boxSize={5}
                          />
                        ) : (
                          <Box boxSize={5} />
                        )}
                        <Text
                          color={textColor}
                          fontFamily="monospace"
                          fontSize="sm"
                          ml={2}
                        >
                          {brand.domain}
                        </Text>
                      </HStack>

                      {brand.error && (
                        <Text
                          fontSize="xs"
                          color="red.500"
                          noOfLines={2}
                          title={brand.error}
                        >
                          Error: {brand.error}
                        </Text>
                      )}
                      <Button
                        colorScheme={primaryColorScheme}
                        size="md"
                        onClick={() => handleSuggestAlternativesClick(brand.id)}
                      >
                        Find Alternate Domains
                      </Button>
                    </VStack>
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
      {/* Modal for Alternative Domain Suggestions */}
      {alternativesModalData && (
        <Modal
          isOpen={isAlternativesModalOpen}
          onClose={() => setIsAlternativesModalOpen(false)}
          size="4xl"
          scrollBehavior="inside"
        >
          <ModalOverlay />
          <ModalContent bg={modalBgColor}>
            <ModalHeader color={headingColor}>
              Alternative Domains for "{alternativesModalData.brandDomain}"
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {alternativesModalData.isLoading && (
                <HStack justifyContent="center" my={4}>
                  <Spinner size="xl" color={spinnerColor} />
                  <Text color={textColor} ml={3}>
                    Loading suggestions...
                  </Text>
                </HStack>
              )}
              {alternativesModalData.error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {alternativesModalData.error}
                </Alert>
              )}
              {alternativesModalData.suggestions &&
                alternativesModalData.suggestions.length > 0 &&
                !alternativesModalData.isLoading && (
                  <AlternativeSuggestionsDisplay
                    suggestions={alternativesModalData.suggestions}
                    domainName={alternativesModalData.brandDomain}
                  />
                )}
              {alternativesModalData.suggestions &&
                alternativesModalData.suggestions.length === 0 &&
                !alternativesModalData.isLoading &&
                !alternativesModalData.error && (
                  <Text color={textColor} textAlign="center" my={4}>
                    No alternative suggestions found for "
                    {alternativesModalData.brandDomain}".
                  </Text>
                )}
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={() => setIsAlternativesModalOpen(false)}
                colorScheme={primaryColorScheme}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Section>
  );
};
