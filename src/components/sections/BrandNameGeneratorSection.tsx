import {
  CheckCircleIcon,
  QuestionOutlineIcon,
  SmallCloseIcon,
} from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Collapse, // For smooth show/hide
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
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
import type { GetDomainSuggestionsResponse } from "../../../common/types";
import { AlternativeSuggestionsDisplay } from "../../components/AlternativeSuggestionsDisplay";
import {
  headingShade,
  primaryColorScheme,
  primaryDark,
  primaryLight,
} from "../../theme/design";
import {
  checkDomainAvailability,
  getDomainSuggestions,
  suggestBrandNames,
  type BrandNameSuggestionRequest,
} from "../../utils/api";
import Section from "../Section";

// Interface for the status of each brand's domain check
export interface BrandDomainStatus {
  id: string; // Unique ID for stable updates and keys
  name: string;
  tagline: string; // Ensure tagline is part of the status
  domain: string; // e.g., brandname.com
  isChecking: boolean;
  isAvailable?: boolean;
  error?: string | null;
  // New fields for inline alternatives
  alternativeSuggestions?: GetDomainSuggestionsResponse['suggestions'];
  showAlternatives?: boolean;
  isFetchingAlternatives?: boolean;
  alternativesError?: string | null;
}

interface BrandNameGeneratorSectionProps {}

const formatDomainFromBrand = (brandName: string): string => {
  return `${brandName.toLowerCase().replace(/\s+/g, "")}.com`;
};

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

  

  const fetchAlternativeSuggestionsApi = async (
    baseName: string
  ): Promise<GetDomainSuggestionsResponse> => {
    console.log(`Fetching alternative suggestions for domain: "${baseName}"`);

    try {
      // Keeping onlyAvailable: false for now to see if query format was the issue
      // Pass the full baseName (e.g., "My Brand.com") to the API
      return await getDomainSuggestions(baseName, false);
    } catch (error: any) {
      console.error(`Error fetching alternative suggestions: ${error.message}`);
      throw new Error(
        error.message || "Failed to fetch alternative domain suggestions."
      );
    }
  };

  const handleSuggestAlternativesClick = async (brandId: string) => {
    setBrandDomainStatuses((prevStatuses) =>
      prevStatuses
        ? prevStatuses.map((brand) => {
        if (brand.id === brandId) {
          // Toggle showAlternatives for the clicked brand
          const shouldShow = !brand.showAlternatives;
          if (!shouldShow) {
            // If hiding, clear suggestions and error
            return {
              ...brand,
              showAlternatives: false,
              alternativeSuggestions: undefined,
              alternativesError: null,
              isFetchingAlternatives: false, // Ensure loading is stopped
            };
          }
          // If showing, mark for fetching and clear previous (if any)
          return {
            ...brand,
            showAlternatives: true,
            isFetchingAlternatives: true,
            alternativeSuggestions: undefined,
            alternativesError: null,
          };
        } else {
          // Collapse other brands
          return { ...brand, showAlternatives: false, isFetchingAlternatives: false };
        }
      })
      : null
    );

    // Find the brand to fetch data for
    const targetBrand = brandDomainStatuses?.find((b) => b.id === brandId);
    if (targetBrand && targetBrand.showAlternatives) { // Check if it was toggled to show
      try {
        // Use targetBrand.domain for fetching, as it's the formatted domain
        const data = await fetchAlternativeSuggestionsApi(targetBrand.domain);
        setBrandDomainStatuses((prevStatuses) =>
          prevStatuses
            ? prevStatuses.map((brand) =>
                brand.id === brandId
                  ? {
                      ...brand,
                      alternativeSuggestions: data.suggestions,
                      isFetchingAlternatives: false,
                    }
                  : brand
              )
            : null
        );
      } catch (error: any) {
        setBrandDomainStatuses((prevStatuses) =>
          prevStatuses
            ? prevStatuses.map((brand) =>
                brand.id === brandId
                  ? {
                      ...brand,
                      alternativesError:
                        error.message || "Failed to fetch alternatives.",
                      isFetchingAlternatives: false,
                    }
                  : brand
              )
            : null
        );
      } 
    } 
  };
  const [industry, setIndustry] = React.useState<string>("");
  const [style, setStyle] = React.useState<string>("");
  const [keywords, setKeywords] = React.useState<string>("");

  
  const [length, setLength] = React.useState<string>(""); // Approx characters
  const [count, setCount] = React.useState<string>(""); // Number of suggestions

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
            tagline: suggestion.tagline, // Map tagline from suggestion
            domain: formatDomainFromBrand(suggestion.name),
            isChecking: true, // Will be checked by useEffect
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

  // Effect to check domain availability for each generated brand name
  React.useEffect(() => {
    if (
      brandDomainStatuses &&
      brandDomainStatuses.some(
        (s) => s.isChecking && s.isAvailable === undefined
      )
    ) {
      brandDomainStatuses.forEach(async (brandStatus) => {
        if (
          brandStatus.isChecking &&
          brandStatus.isAvailable === undefined &&
          !brandStatus.error
        ) {
          try {
            const domainCheck = await checkDomainAvailability(
              brandStatus.domain
            );
            setBrandDomainStatuses(
              (prevStatuses) =>
                prevStatuses?.map((s) =>
                  s.id === brandStatus.id
                    ? {
                        ...s,
                        isChecking: false,
                        isAvailable: domainCheck.result.available,
                        error: null,
                      }
                    : s
                ) || null
            );
          } catch (domainErr) {
            setBrandDomainStatuses(
              (prevStatuses) =>
                prevStatuses?.map((s) =>
                  s.id === brandStatus.id
                    ? {
                        ...s,
                        isChecking: false,
                        isAvailable: false,
                        error:
                          domainErr instanceof Error
                            ? domainErr.message
                            : "Domain check failed",
                      }
                    : s
                ) || null
            );
          }
        }
      });
    }
  }, [brandDomainStatuses]);

  const brandIdeasHeadingColor = useColorModeValue(
    primaryLight(headingShade),
    primaryDark(headingShade)
  );
  const brandButtonTextColor = useColorModeValue("white", "gray.800");

  return (
    <Section title="I Want an Excellent Brand Identity">
      <Box>
        <VStack spacing={4} align="stretch">
          <FormControl id="brand-prompt">
            <FormLabel
              fontWeight="bold"
              fontSize="lg"
              color={brandIdeasHeadingColor}
            >
              Describe your business or idea:
            </FormLabel>
            <Textarea
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
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Food, Fashion"
              />
            </FormControl>
            <FormControl id="style">
              <FormLabel>Style (Optional)</FormLabel>
              <Input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="e.g., Modern, Playful, Elegant"
              />
            </FormControl>
          </SimpleGrid>
          <FormControl id="keywords">
            <FormLabel>Keywords (Optional, comma-separated)</FormLabel>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., sustainable, innovative, global"
            />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="length">
              <FormLabel>Approx. Length (Optional)</FormLabel>
              <NumberInput
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
            <Spinner size="xl" color="cyan.500" thickness="4px" />
            <Text mt={2} fontSize="lg" fontWeight="medium">
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
            <Heading as="h3" size="lg" color={brandIdeasHeadingColor} pb={2}>
              Brand Name Ideas
            </Heading>
            <Text fontSize="sm" color="gray.500" mb={6}>
              <Icon as={CheckCircleIcon} color="green.500" mr={1} /> Available
              <Icon as={SmallCloseIcon} color="red.500" mx={1} /> Unavailable
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              {brandDomainStatuses.map((brand) => (
                <Card key={brand.id}>
                  <CardBody>
                    <Heading as="h4" size="md" noOfLines={2} title={brand.name}>
                      {brand.name}
                    </Heading>
                    {brand.tagline && (
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        fontStyle="italic"
                        noOfLines={2}
                        title={brand.tagline}
                      >
                        {brand.tagline}
                      </Text>
                    )}
                    <Badge
                      colorScheme={
                        brand.isChecking
                          ? "blue"
                          : brand.isAvailable
                            ? "green"
                            : "red"
                      }
                      variant={brand.isChecking ? "outline" : "solid"}
                      fontSize="xs"
                    >
                      {brand.isChecking ? "Checking..." : ""}
                    </Badge>
                    <HStack align="center">
                      {brand.isChecking ? (
                        <Spinner size="xs" color="blue.500" />
                      ) : brand.isAvailable ? (
                        <Icon as={CheckCircleIcon} color="green.500" />
                      ) : (
                        <Icon as={SmallCloseIcon} color="red.500" />
                      )}
                      <Text fontFamily="monospace" fontSize="sm">
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
                  </CardBody>
                  <CardFooter flexDirection="column" alignItems="stretch">
                    <Button
                      variant="ghost"
                      colorScheme={primaryColorScheme}
                      size="sm"
                      isLoading={brand.isFetchingAlternatives}
                      onClick={() => handleSuggestAlternativesClick(brand.id)}
                      leftIcon={<QuestionOutlineIcon />}
                    >
                      {brand.showAlternatives && brand.alternativeSuggestions
                        ? "Hide Alternatives"
                        : "Find Alternate Domains"}
                    </Button>
                    <Collapse in={brand.showAlternatives && (!!brand.alternativeSuggestions || !!brand.alternativesError || brand.isFetchingAlternatives)} animateOpacity>
                      <Box mt={4}>
                        {brand.isFetchingAlternatives && <Spinner size="md" />}
                        {brand.alternativesError && (
                          <Alert status="error" mt={2} borderRadius="md">
                            <AlertIcon />
                            {brand.alternativesError}
                          </Alert>
                        )}
                        {brand.alternativeSuggestions && brand.alternativeSuggestions.length > 0 && (
                          <AlternativeSuggestionsDisplay
                            suggestions={brand.alternativeSuggestions}
                            domainName={brand.domain} // Pass the original domain for context
                          />
                        )}
                        {brand.alternativeSuggestions && brand.alternativeSuggestions.length === 0 && !brand.isFetchingAlternatives && !brand.alternativesError && (
                           <Text fontSize="sm" color="gray.500" mt={2}>No alternative suggestions found.</Text>
                        )}
                      </Box>
                    </Collapse>
                  </CardFooter>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}
        {brandDomainStatuses &&
          brandDomainStatuses.length === 0 &&
          !brandNamesLoading && (
            <Text mt={6} fontSize="md" color="gray.600" textAlign="center">
              No brand name suggestions were generated for your prompt. Try
              being more specific or rephrasing.
            </Text>
          )}


      </Box>
    </Section>
  );
};
