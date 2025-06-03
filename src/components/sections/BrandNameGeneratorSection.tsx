import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import * as React from 'react';
import type { DomainSuggestion as ApiDomainSuggestion } from '../../utils/api';
import { getRandomOptionalFieldValues } from '../../utils/suggestionGenerator';

import {
  useBrandNameGenerator,
  type BrandDomainStatus,
  type GenerateBrandNamesParams,
} from '../../hooks/useBrandNameGenerator';
import {
  accentShade,
  backgroundShade,
  borderShade,
  cardBackgroundShade,
  headingShade,
  primaryColorScheme,
  textShade,
} from '../../theme/design';
import { getDomainSuggestions } from '../../utils/api';
import { AlternativeSuggestionsModalWrapper } from '../AlternativeSuggestionsModalWrapper';
import { BrandNameInputForm } from '../BrandNameInputForm';
import { BrandSuggestionCard } from '../BrandSuggestionCard';
import Section from '../Section';

// DomainInfo and BrandDomainStatus interfaces will be imported from or defined in useBrandNameGenerator hook

export const BrandNameGeneratorSection: React.FC = () => {
  const {
    brandDomainStatuses,
    brandNamesLoading,
    brandNamesError,
    handleGenerateBrandNamesSubmit,
  } = useBrandNameGenerator();
  const [brandPrompt, setBrandPrompt] = React.useState<string>('');

  const [industry, setIndustry] = React.useState<string>('');
  const [style, setStyle] = React.useState<string>('');
  const [keywords, setKeywords] = React.useState<string>('');

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

  const handleRandomizeOptionalFields = () => {
    const randomValues = getRandomOptionalFieldValues();
    setIndustry(randomValues.industry);
    setStyle(randomValues.style);
    setKeywords(randomValues.keywords);
    setLength(randomValues.length);
    setCount(randomValues.count);
  };

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
            20,
          );
          setAlternativeSuggestions(response.suggestions || []);
        } catch (err) {
          setAlternativesError(
            err instanceof Error
              ? err.message
              : 'Failed to load alternative suggestions.',
          );
        }
        setAlternativesLoading(false);
      };
      fetchAlternatives();
    }
  }, [selectedDomainForAlternatives]);

  const handleFormSubmit = async () => {
    const params: GenerateBrandNamesParams = {
      prompt: brandPrompt,
      industry: industry || undefined,
      style: style || undefined,
      keywords: keywords || undefined,
      length: !isNaN(length) && length > 0 ? length : undefined,
      count: !isNaN(count) && count > 0 ? count : undefined,
    };
    await handleGenerateBrandNamesSubmit(params);
  };

  const handleDomainSuggestionClick = (domain: string) => {
    setSelectedDomainForAlternatives(domain);
    onOpenAlternativesModal();
  };

  const headingColor = useColorModeValue(headingShade.light, headingShade.dark);
  const textColor = useColorModeValue(textShade.light, textShade.dark);
  const cardBgColor = useColorModeValue(cardBackgroundShade.light, cardBackgroundShade.dark);
  const modalBgColor = useColorModeValue(backgroundShade.light, backgroundShade.dark);
  const borderColor = useColorModeValue(borderShade.light, borderShade.dark);
  const spinnerColor = useColorModeValue(accentShade.light, accentShade.dark);

  return (
    <Section title="I Want an Excellent Brand Identity">
      <AlternativeSuggestionsModalWrapper
        isOpen={isAlternativesModalOpen}
        onClose={onCloseAlternativesModal}
        selectedDomain={selectedDomainForAlternatives}
        suggestions={alternativeSuggestions}
        isLoading={alternativesLoading}
        error={alternativesError}
        modalBgColor={modalBgColor}
        spinnerColor={spinnerColor}
        primaryColorScheme={primaryColorScheme}
      />

      <Box>
        <VStack spacing={4} align="stretch">
          <BrandNameInputForm
            brandPrompt={brandPrompt}
            setBrandPrompt={setBrandPrompt}
            industry={industry}
            setIndustry={setIndustry}
            style={style}
            setStyle={setStyle}
            keywords={keywords}
            setKeywords={setKeywords}
            length={length}
            setLength={setLength}
            count={count}
            setCount={setCount}
            handleRandomizeOptionalFields={handleRandomizeOptionalFields}
            headingColor={headingColor}
            textColor={textColor}
            borderColor={borderColor}
          />
          <Button onClick={handleFormSubmit} colorScheme={primaryColorScheme}>
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
            <Text color={textColor} my={2}>
              Click on a domain to see alternative suggestions.
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              {brandDomainStatuses.map((brand: BrandDomainStatus) => (
                <BrandSuggestionCard
                  key={brand.id}
                  brand={brand}
                  handleDomainSuggestionClick={handleDomainSuggestionClick}
                  headingColor={headingColor}
                  textColor={textColor}
                  cardBgColor={cardBgColor}
                  spinnerColor={spinnerColor}
                />
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
