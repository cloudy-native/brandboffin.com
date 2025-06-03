import { AlertTriangle, CircleCheckBig, XCircle } from "lucide-react";
import * as React from "react";
import {
  Box,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  Tooltip,
  Icon,
  VStack,
} from "@chakra-ui/react";
import type {
  BrandDomainStatus,
  DomainInfo,
} from "../hooks/useBrandNameGenerator"; // Assuming types are exported from the hook file

interface BrandSuggestionCardProps {
  brand: BrandDomainStatus;
  handleDomainSuggestionClick: (domain: string) => void;
  headingColor: string;
  textColor: string;
  cardBgColor: string;
  spinnerColor: string;
}

export const BrandSuggestionCard: React.FC<BrandSuggestionCardProps> = ({
  brand,
  handleDomainSuggestionClick,
  headingColor,
  textColor,
  cardBgColor,
  spinnerColor,
}) => {
  return (
    <Box
      key={brand.id} // Key should ideally be on the top-level element when mapping in parent
      p={3}
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="md"
      bg={cardBgColor}
      display="flex"
      flexDirection="column"
    >
      <VStack align="stretch" flex={1} justifyContent="space-between">
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
          <Text fontSize="sm" color={textColor} noOfLines={3}>
            {brand.tagline}
          </Text>
          <VStack align="stretch" spacing={2} mt={2}>
            {brand.domains.map((domainInfo: DomainInfo) => {
              return (
                <Flex
                  key={domainInfo.domainName}
                  justify="space-between"
                  align="center"
                  width="100%"
                >
                  <Text
                    fontSize="md"
                    fontWeight="medium"
                    color={textColor}
                    _hover={{
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      handleDomainSuggestionClick(domainInfo.domainName)
                    }
                    title={`Click to see alternatives for ${domainInfo.domainName}`}
                    noOfLines={1}
                  >
                    {domainInfo.domainName}
                  </Text>
                  <HStack spacing={2}>
                    {domainInfo.isChecking && (
                      <Spinner size="sm" color={spinnerColor} />
                    )}
                    {!domainInfo.isChecking &&
                      domainInfo.checkResult &&
                      (domainInfo.checkResult.available ? (
                        <>
                          <Icon
                            as={CircleCheckBig}
                            color="green.500"
                            size={18}
                          />
                        </>
                      ) : (
                        <Tooltip
                          label={domainInfo.checkResult.error || "Unavailable"}
                          placement="top"
                          hasArrow
                        >
                          <Icon as={XCircle} color="red.500" size={18} />
                        </Tooltip>
                      ))}
                    {!domainInfo.isChecking && domainInfo.fetchError && (
                      <Tooltip
                        label={domainInfo.fetchError}
                        placement="top"
                        hasArrow
                      >
                        <Icon as={AlertTriangle} color="orange.500" size={18} />
                      </Tooltip>
                    )}
                  </HStack>
                </Flex>
              );
            })}
          </VStack>
        </VStack>
      </VStack>{" "}
      {/* This closes the VStack from line 51 */}
    </Box>
  );
};
