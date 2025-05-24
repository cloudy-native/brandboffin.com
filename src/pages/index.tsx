import { CheckCircleIcon, SmallCloseIcon } from "@chakra-ui/icons";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Collapse,
  Container,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  List,
  ListItem,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { Link as GatsbyLink, HeadFC, PageProps } from "gatsby";
import * as React from "react";
import { FaGithub, FaList, FaSearch } from "react-icons/fa";
import {
  checkDomainAvailability,
  type DomainAvailabilityResponse,
  getDomainSuggestions,
  type GetDomainSuggestionsResponse,
  listTlds,
  type ListTldsResponse,
  type DomainSuggestion as ApiDomainSuggestion, // Renamed to avoid conflict
} from "../utils/api";
import { BrandNameGeneratorSection } from "../components/IndexPageSections/BrandNameGeneratorSection";

interface AlternativeSuggestionsDisplayProps {
  suggestionsData: GetDomainSuggestionsResponse | null | undefined;
  title?: string;
  onSuggestionClick?: (domainName: string) => void;
}

const AlternativeSuggestionsDisplay: React.FC<
  AlternativeSuggestionsDisplayProps
> = ({
  suggestionsData,
  title = "Alternative Suggestions:",
  onSuggestionClick,
}) => {
  const groupSuggestionsByTld = (
    suggestions: ApiDomainSuggestion[] = []
  ): Record<string, ApiDomainSuggestion[]> => {
    return suggestions.reduce(
      (acc, suggestion) => {
        const domainName = suggestion.DomainName;
        if (!domainName) {
          return acc;
        }
        const firstDotIndex = domainName.indexOf(".");
        const tld =
          firstDotIndex > 0
            ? domainName.substring(firstDotIndex)
            : domainName.length > 0
              ? ".other"
              : "";
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
                  key={`${tld}-${sugg.DomainName}-${idx}`}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  py={1}
                  onClick={
                    onSuggestionClick && sugg.DomainName
                      ? () => onSuggestionClick(sugg.DomainName!)
                      : undefined
                  }
                  cursor={onSuggestionClick ? "pointer" : "default"}
                  _hover={
                    onSuggestionClick
                      ? { bg: useColorModeValue("gray.100", "gray.600") }
                      : {}
                  }
                >
                  <Text>{sugg.DomainName}</Text>
                  <Tag
                    size="sm"
                    variant="subtle"
                    colorScheme={
                      sugg.Availability === "AVAILABLE"
                        ? "green"
                        : sugg.Availability === "UNAVAILABLE"
                          ? "red"
                          : "yellow" // For 'UNKNOWN' or other states
                    }
                  >
                    {sugg.Availability || "N/A"}
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

const IndexPage: React.FC<PageProps> = () => {
  const [inputValue, setInputValue] = React.useState<string>("");
  const [apiResult, setApiResult] =
    React.useState<DomainAvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [suggestionQuery, setSuggestionQuery] = React.useState<string>("");
  const [domainSuggestions, setDomainSuggestions] =
    React.useState<GetDomainSuggestionsResponse | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] =
    React.useState<boolean>(false);
  const [suggestionsError, setSuggestionsError] = React.useState<string | null>(
    null
  );

  const [tldList, setTldList] = React.useState<ListTldsResponse | null>(null);
  const [tldsLoading, setTldsLoading] = React.useState<boolean>(false);
  const [tldsError, setTldsError] = React.useState<string | null>(null);
  const [isTldListVisible, setIsTldListVisible] =
    React.useState<boolean>(false);

  const [selectedBrandForCheck, setSelectedBrandForCheck] = React.useState<
    string | null
  >(null);
  const [selectedBrandDomainToCheck, setSelectedBrandDomainToCheck] =
    React.useState<string | null>(null);
  const [brandDomainCheckResult, setBrandDomainCheckResult] =
    React.useState<DomainAvailabilityResponse | null>(null);
  const [brandDomainCheckLoading, setBrandDomainCheckLoading] =
    React.useState<boolean>(false);
  const [brandDomainCheckError, setBrandDomainCheckError] = React.useState<
    string | null
  >(null);

  const [brandSecondaryDomainSuggestions, setBrandSecondaryDomainSuggestions] =
    React.useState<GetDomainSuggestionsResponse | null>(null);
  const [
    brandSecondaryDomainSuggestionsLoading,
    setBrandSecondaryDomainSuggestionsLoading,
  ] = React.useState<boolean>(false);
  const [
    brandSecondaryDomainSuggestionsError,
    setBrandSecondaryDomainSuggestionsError,
  ] = React.useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    if (apiResult) setApiResult(null);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      setError("Please enter a domain name to check.");
      setApiResult(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setApiResult(null);
    try {
      const data = await checkDomainAvailability(inputValue.trim());
      setApiResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setApiResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionQueryChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSuggestionQuery(event.target.value);
    if (domainSuggestions) setDomainSuggestions(null);
    if (suggestionsError) setSuggestionsError(null);
  };

  const handleGetDomainSuggestions = async () => {
    if (!suggestionQuery.trim()) {
      setSuggestionsError("Please enter a base domain or keyword.");
      setDomainSuggestions(null);
      return;
    }
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setDomainSuggestions(null);
    try {
      const data = await getDomainSuggestions({
        domainName: suggestionQuery.trim(),
        suggestionCount: 10,
        onlyAvailable: false,
      });
      setDomainSuggestions(data);
    } catch (err) {
      if (err instanceof Error) {
        setSuggestionsError(err.message);
      } else {
        setSuggestionsError(
          "An unknown error occurred while fetching suggestions."
        );
      }
      setDomainSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleFetchTlds = async () => {
    setTldsLoading(true);
    setTldsError(null);
    try {
      const data = await listTlds();
      setTldList(data);
    } catch (err) {
      if (err instanceof Error) {
        setTldsError(err.message);
      } else {
        setTldsError("Failed to load TLD list.");
      }
    } finally {
      setTldsLoading(false);
    }
  };

  const handleToggleTldSection = () => {
    setIsTldListVisible((prev) => !prev);
    if (!isTldListVisible && !tldList && !tldsLoading) {
      handleFetchTlds();
    }
  };

  const simpleFormatDomainFromBrand = (brandName: string): string => {
    return `${brandName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9-]/gi, "")}.com`;
  };

  const handleSuggestedBrandClick = async (brandName: string) => {
    setSelectedBrandForCheck(brandName);
    const domainToTest = simpleFormatDomainFromBrand(brandName);
    setSelectedBrandDomainToCheck(domainToTest);
    setBrandDomainCheckResult(null);
    setBrandDomainCheckError(null);
    setBrandSecondaryDomainSuggestions(null);
    setBrandDomainCheckLoading(true);

    try {
      const result = await checkDomainAvailability(domainToTest);
      setBrandDomainCheckResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setBrandDomainCheckError(err.message);
      } else {
        setBrandDomainCheckError("Failed to check domain for selected brand.");
      }
    } finally {
      setBrandDomainCheckLoading(false);
    }
  };

  React.useEffect(() => {
    if (
      brandDomainCheckResult &&
      !brandDomainCheckResult.result.available &&
      selectedBrandForCheck
    ) {
      const fetchSecondary = async () => {
        setBrandSecondaryDomainSuggestionsLoading(true);
        setBrandSecondaryDomainSuggestionsError(null);
        try {
          const baseName = selectedBrandForCheck
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9-]/gi, "");
          const suggestions = await getDomainSuggestions({
            domainName: baseName,
            suggestionCount: 5,
            onlyAvailable: true,
          });
          setBrandSecondaryDomainSuggestions(suggestions);
        } catch (err) {
          if (err instanceof Error) {
            setBrandSecondaryDomainSuggestionsError(err.message);
          } else {
            setBrandSecondaryDomainSuggestionsError(
              "Failed to fetch secondary suggestions."
            );
          }
        }
        setBrandSecondaryDomainSuggestionsLoading(false);
      };
      fetchSecondary();
    }
  }, [brandDomainCheckResult, selectedBrandForCheck]);

  const heroBg = useColorModeValue("pink.100", "pink.900");
  const heroAccentColor = useColorModeValue("pink.500", "pink.300");

  return (
    <>
      {/* Hero Section */}
      <Box bg={heroBg} py={{ base: 12, md: 20 }}>
        <Container maxW="3xl" textAlign="center">
          <Heading
            as="h1"
            size={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color={heroAccentColor}
            mb={4}
          >
            Find Your Perfect Domain Name
          </Heading>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            color={useColorModeValue("gray.700", "gray.200")}
            mb={8}
          >
            Instantly check domain availability, get brand name ideas, and
            explore TLD options. Your next big idea starts here!
          </Text>
        </Container>
      </Box>

      {/* Domain Availability Check Section */}
      <Box py={10} bg={useColorModeValue("gray.50", "gray.800")}>
        <Container maxW={"xl"}>
          <Stack spacing={6}>
            <Heading
              as="h2"
              size="xl"
              textAlign="center"
              color={useColorModeValue("gray.700", "gray.100")}
            >
              Check Domain Availability
            </Heading>
            <FormControl>
              <FormLabel htmlFor="domain-input" srOnly>
                Enter domain name
              </FormLabel>
              <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                <Input
                  id="domain-input"
                  placeholder="e.g., myawesomeidea.com"
                  size="lg"
                  value={inputValue}
                  onChange={handleInputChange}
                  isDisabled={isLoading}
                  onKeyPress={(event) => {
                    if (event.key === "Enter") handleSubmit();
                  }}
                  flexGrow={1}
                />
                <Button
                  colorScheme="pink"
                  size="lg"
                  px={8}
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  loadingText="Checking..."
                  minWidth="120px"
                >
                  Check
                </Button>
              </Stack>
            </FormControl>
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}
            {apiResult && !error && (
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                shadow="sm"
                bg={useColorModeValue("white", "gray.700")}
              >
                <HStack justifyContent="space-between">
                  <Text fontSize="lg" fontWeight="bold">
                    {apiResult.result.domain}
                  </Text>
                  <Tag
                    colorScheme={apiResult.result.available ? "green" : "red"}
                  >
                    {apiResult.result.availability}
                  </Tag>
                </HStack>
              </Box>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Domain Suggestions Section */}
      <Box pb={10} bg={useColorModeValue("orange.50", "orange.900")}>
        <Box h="8px" bg="orange.500" w="full" />
        <Container maxW={"xl"} pt={10}>
          <Stack spacing={6}>
            <Heading
              as="h2"
              size="lg"
              textAlign="center"
              color={useColorModeValue("orange.600", "orange.300")}
            >
              Get Domain Suggestions
            </Heading>
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={4}
              align="center"
            >
              <Input
                placeholder="Enter base domain or keyword (e.g., mybrand)"
                size="lg"
                value={suggestionQuery}
                onChange={handleSuggestionQueryChange}
                isDisabled={suggestionsLoading}
                onKeyPress={(event) => {
                  if (event.key === "Enter") handleGetDomainSuggestions();
                }}
                flexGrow={1}
              />
              <Button
                colorScheme="orange"
                size="lg"
                px={8}
                onClick={handleGetDomainSuggestions}
                isLoading={suggestionsLoading}
                loadingText="Suggesting..."
                leftIcon={<FaSearch />}
                minWidth="180px"
              >
                Get Suggestions
              </Button>
            </Stack>
            {suggestionsError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {suggestionsError}
              </Alert>
            )}
            {domainSuggestions && !suggestionsError && (
              <AlternativeSuggestionsDisplay
                suggestionsData={domainSuggestions}
                title="Suggested Domains:"
              />
            )}
          </Stack>
        </Container>
      </Box>

      {/* Brand Name Idea Generator Section */}
      <Box py={10} bg={useColorModeValue("cyan.50", "cyan.900")}>
        <Box h="8px" bg="cyan.500" w="full" />
        <Container maxW={"xl"} pt={10}>
          <BrandNameGeneratorSection
            onBrandNameSelect={handleSuggestedBrandClick}
          />
        </Container>
      </Box>

      {/* Section to display detailed check for a selected brand name */}
      {selectedBrandForCheck && (
        <Box py={10} bg={useColorModeValue("gray.100", "gray.700")}>
          <Container maxW={"xl"}>
            <Collapse in={!!selectedBrandForCheck} animateOpacity>
              <Box
                p={5}
                borderWidth="1px"
                borderRadius="lg"
                shadow="md"
                bg={useColorModeValue("white", "gray.800")}
              >
                <Heading
                  as="h4"
                  size="md"
                  mb={3}
                  color={useColorModeValue("gray.700", "gray.200")}
                >
                  Domain Check for:{" "}
                  <Text
                    as="span"
                    color={useColorModeValue("green.500", "green.300")}
                  >
                    {selectedBrandForCheck}
                  </Text>
                </Heading>
                <Text fontSize="sm" color="gray.500" mb={3}>
                  Checking: <strong>{selectedBrandDomainToCheck}</strong>
                </Text>

                {brandDomainCheckLoading && <Spinner color="green.500" />}
                {brandDomainCheckError && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {brandDomainCheckError}
                  </Alert>
                )}
                {brandDomainCheckResult && !brandDomainCheckError && (
                  <Box>
                    <HStack justifyContent="space-between" mb={2}>
                      <Text fontSize="lg" fontWeight="bold">
                        {brandDomainCheckResult.result.domain}
                      </Text>
                      <Tag
                        colorScheme={
                          brandDomainCheckResult.result.available
                            ? "green"
                            : "red"
                        }
                      >
                        {brandDomainCheckResult.result.availability}
                      </Tag>
                    </HStack>

                    {!brandDomainCheckResult.result.available && (
                      <Box mt={4}>
                        {brandSecondaryDomainSuggestionsLoading && (
                          <Spinner size="md" />
                        )}
                        {brandSecondaryDomainSuggestionsError && (
                          <Alert status="warning" size="sm">
                            <AlertIcon />
                            {brandSecondaryDomainSuggestionsError}
                          </Alert>
                        )}
                        {brandSecondaryDomainSuggestions && (
                          <AlternativeSuggestionsDisplay
                            suggestionsData={brandSecondaryDomainSuggestions}
                            title={`Alternatives for ${selectedBrandForCheck}:`}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Collapse>
          </Container>
        </Box>
      )}

      {/* List TLDs Section */}
      <Box pb={10} bg={useColorModeValue("purple.50", "purple.900")}>
        <Box h="8px" bg="purple.500" w="full" />
        <Container maxW={"xl"} pt={10}>
          <VStack spacing={4} align="stretch">
            <Heading
              as="h2"
              size="lg"
              textAlign="center"
              color={useColorModeValue("purple.600", "purple.300")}
            >
              Top-Level Domains and Prices
            </Heading>
            <Button
              colorScheme="purple"
              onClick={handleToggleTldSection}
              isLoading={tldsLoading && (!tldList || tldList.tlds.length === 0)} // Show loading only on initial fetch
              leftIcon={<FaList />}
              w="full" // Make button full width for better centering
            >
              {!tldList || tldList.tlds.length === 0
                ? "Fetch TLD List"
                : isTldListVisible
                  ? "Hide TLD List"
                  : "Show TLD List"}
            </Button>

            <Collapse in={isTldListVisible} animateOpacity>
              <Box mt={4}>
                {" "}
                {/* Add some margin when visible */}
                {tldsLoading &&
                  !tldList && ( // Show spinner only on initial load or if list is empty
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="purple.500"
                      size="xl"
                      alignSelf="center"
                      mt={4}
                    />
                  )}
                {tldsError && (
                  <Alert status="error" borderRadius="md" mt={4}>
                    <AlertIcon />
                    {tldsError}
                  </Alert>
                )}
                {tldList && tldList.tlds.length > 0 && (
                  <TableContainer
                    borderWidth="1px"
                    borderRadius="lg"
                    p={4}
                    bg={useColorModeValue("white", "gray.700")}
                  >
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Displaying top {tldList.tlds.length}.
                    </Text>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>TLD</Th>
                          <Th isNumeric>Registration</Th>
                          <Th isNumeric>Transfer</Th>
                          <Th isNumeric>Renewal</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {tldList.tlds.map((item) => (
                          <Tr key={item.tld}>
                            <Td fontWeight="medium">.{item.tld}</Td>
                            <Td isNumeric>
                              {item.registrationPrice?.Price !== undefined
                                ? `${item.registrationPrice.Price.toFixed(2)} ${item.registrationPrice.Currency || ""}`
                                : "N/A"}
                            </Td>
                            <Td isNumeric>
                              {item.transferPrice?.Price !== undefined
                                ? `${item.transferPrice.Price.toFixed(2)} ${item.transferPrice.Currency || ""}`
                                : "N/A"}
                            </Td>
                            <Td isNumeric>
                              {item.renewalPrice?.Price !== undefined
                                ? `${item.renewalPrice.Price.toFixed(2)} ${item.renewalPrice.Currency || ""}`
                                : "N/A"}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
                {tldList && tldList.tlds.length === 0 && !tldsLoading && (
                  <Text mt={4} textAlign="center" color="gray.500">
                    No TLD data available at the moment.
                  </Text>
                )}
              </Box>
            </Collapse>
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export const Head: HeadFC = (props) => (
  <>
    <title>Brandly | Instant Domain & Brand Name Search</title>
    <meta
      name="description"
      content="Find the perfect domain name and brand identity with Brandly. Instant availability checks, brand name ideas, and TLD suggestions."
    />
  </>
);

export default IndexPage;
