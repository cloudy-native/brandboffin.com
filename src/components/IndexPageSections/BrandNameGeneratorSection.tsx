import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  QuestionOutlineIcon,
  SmallCloseIcon,
} from "@chakra-ui/icons";
import * as React from "react";
import {
  generateBrandNames,
  checkDomainAvailability,
  type SuggestionRequest,
  // We might not need DomainAvailabilityResponse directly if BrandDomainStatus is self-contained
} from "../../utils/api"; // Adjusted path

// Interface for the status of each brand's domain check
export interface BrandDomainStatus {
  id: string; // Unique ID for stable updates and keys
  name: string;
  domain: string; // e.g., brandname.com
  isChecking: boolean;
  isAvailable?: boolean;
  error?: string | null;
}

interface BrandNameGeneratorSectionProps {
  onBrandNameSelect: (brandName: string) => void;
}

const formatDomainFromBrand = (brandName: string): string => {
  return `${brandName.toLowerCase().replace(/\s+/g, "")}.com`;
};

export const BrandNameGeneratorSection: React.FC<BrandNameGeneratorSectionProps> = ({
  onBrandNameSelect,
}) => {
  const [brandPrompt, setBrandPrompt] = React.useState<string>("");
  const [brandDomainStatuses, setBrandDomainStatuses] = React.useState<
    BrandDomainStatus[] | null
  >(null);
  const [brandNamesLoading, setBrandNamesLoading] =
    React.useState<boolean>(false);
  const [brandNamesError, setBrandNamesError] = React.useState<string | null>(
    null
  );

  const handleGenerateBrandNamesSubmit = async () => {
    if (!brandPrompt.trim()) {
      setBrandNamesError("Please enter a prompt for brand name ideas.");
      return;
    }
    setBrandNamesLoading(true);
    setBrandNamesError(null);
    setBrandDomainStatuses(null); // Clear previous results

    try {
      const requestBody: SuggestionRequest = { prompt: brandPrompt };
      const result = await generateBrandNames(requestBody);

      if (result.suggestions && result.suggestions.length > 0) {
        const initialStatuses: BrandDomainStatus[] = result.suggestions.map(
          (name, index) => ({
            id: `${name}-${index}`,
            name,
            domain: formatDomainFromBrand(name),
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
        setBrandNamesError("An unknown error occurred while generating brand names.");
      }
      setBrandDomainStatuses(null);
    } finally {
      setBrandNamesLoading(false);
    }
  };

  // Effect to check domain availability for each generated brand name
  React.useEffect(() => {
    if (brandDomainStatuses && brandDomainStatuses.some(s => s.isChecking && s.isAvailable === undefined)) {
      brandDomainStatuses.forEach(async (brandStatus) => {
        if (brandStatus.isChecking && brandStatus.isAvailable === undefined && !brandStatus.error) {
          try {
            const domainCheck = await checkDomainAvailability(brandStatus.domain);
            setBrandDomainStatuses(prevStatuses =>
              prevStatuses?.map(s =>
                s.id === brandStatus.id
                  ? { ...s, isChecking: false, isAvailable: domainCheck.result.available, error: null }
                  : s
              ) || null
            );
          } catch (domainErr) {
            setBrandDomainStatuses(prevStatuses =>
              prevStatuses?.map(s =>
                s.id === brandStatus.id
                  ? { ...s, isChecking: false, isAvailable: false, error: domainErr instanceof Error ? domainErr.message : "Domain check failed" }
                  : s
              ) || null
            );
          }
        }
      });
    }
  }, [brandDomainStatuses]);
  
  const brandIdeasHeadingColor = useColorModeValue("gray.700", "gray.200");
  const brandButtonColorScheme = useColorModeValue("cyan", "cyan");
  const brandButtonTextColor = useColorModeValue("white", "gray.800");

  return (
    <Box mb={12}>
      <VStack spacing={4} align="stretch">
        <FormControl id="brand-prompt">
          <FormLabel fontWeight="bold" fontSize="lg" color={brandIdeasHeadingColor}>
            Describe your business or idea:
          </FormLabel>
          <Textarea
            value={brandPrompt}
            onChange={(e) => setBrandPrompt(e.target.value)}
            placeholder="e.g., A subscription service for eco-friendly pet toys"
            size="lg"
            minHeight="100px"
            focusBorderColor={useColorModeValue("cyan.500", "cyan.300")}
          />
        </FormControl>
        <Button
          onClick={handleGenerateBrandNamesSubmit}
          isLoading={brandNamesLoading}
          loadingText="Generating Ideas..."
          colorScheme={brandButtonColorScheme}
          color={brandButtonTextColor}
          size="lg"
          py={6}
          _hover={{ bg: useColorModeValue("cyan.600", "cyan.400") }}
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
          <Heading as="h3" size="lg" mb={6} color={brandIdeasHeadingColor} borderBottomWidth="2px" borderColor={useColorModeValue("cyan.200", "cyan.700")} pb={2}>
            Brand Name Suggestions
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={6}>
            <CheckCircleIcon color="green.500" mr={1} /> Available (.com)
            <SmallCloseIcon color="red.500" mx={1} /> Unavailable/Error (.com)
            <QuestionOutlineIcon color="blue.500" mx={1} /> Checking...
            <br />
            Click a name for full domain details & more TLD options.
          </Text>
          <Wrap spacing={4} justify="start">
            {brandDomainStatuses.map((brand) => (
              <WrapItem key={brand.id} width={{ base: "100%", md: "auto" }}>
                <Tooltip label={`Check availability for ${brand.name} and other TLDs`} placement="top">
                  <Button
                    variant="outline"
                    colorScheme={brand.isChecking ? "blue" : brand.isAvailable ? "green" : "red"}
                    onClick={() => onBrandNameSelect(brand.name)}
                    width="100%"
                    minHeight="80px"
                    height="auto"
                    p={4}
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start"
                    justifyContent="center"
                    textAlign="left"
                    borderColor={brand.isChecking ? "blue.300" : brand.isAvailable ? "green.300" : "red.300"}
                    _hover={{
                      bg: brand.isChecking ? "blue.50" : brand.isAvailable ? "green.50" : "red.50",
                      transform: "translateY(-2px)",
                      shadow: "md",
                    }}
                    whiteSpace="normal"
                    lineHeight="short"
                  >
                    <Heading as="h4" size="md" mb={1} noOfLines={2}>
                      {brand.name}
                    </Heading>
                    <HStack spacing={1} align="center">
                      {brand.isChecking ? (
                        <Spinner size="xs" color="blue.500" />
                      ) : brand.isAvailable ? (
                        <CheckCircleIcon color="green.500" />
                      ) : (
                        <SmallCloseIcon color="red.500" />
                      )}
                      <Text fontFamily="monospace" fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                        {brand.domain}
                      </Text>
                    </HStack>
                  </Button>
                </Tooltip>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
      {brandDomainStatuses && brandDomainStatuses.length === 0 && !brandNamesLoading && (
         <Text mt={6} fontSize="md" color="gray.600" textAlign="center">
            No brand name suggestions were generated for your prompt. Try being more specific or rephrasing.
        </Text>
      )}
    </Box>
  );
};
