import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Collapse,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { FaList } from 'react-icons/fa';
import { primaryColorScheme } from '../../theme/design';
import {
  listTlds,
  type GetTLDPricesResponse,
  type TLDPrice,
} from '../../utils/api';
import Section from '../Section';

export const TLDPricing: React.FC = () => {
  const [isTldListVisible, setIsTldListVisible] =
    React.useState<boolean>(false);
  const [tldList, setTldList] = React.useState<GetTLDPricesResponse | null>(
    null,
  );
  const [tldsLoading, setTldsLoading] = React.useState<boolean>(false);
  const [tldsError, setTldsError] = React.useState<string | null>(null);

  const handleToggleTldSection = () => {
    setIsTldListVisible((prev) => !prev);
    if (!isTldListVisible && !tldList && !tldsLoading) {
      handleFetchTlds();
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
        setTldsError('Failed to load TLD list.');
      }
    } finally {
      setTldsLoading(false);
    }
  };

  const tableBackgroundColor = useColorModeValue('gray.50', 'gray.700');

  return (
    <Section title="Top-Level Domains">
      <Button
        colorScheme={primaryColorScheme}
        onClick={handleToggleTldSection}
        isLoading={tldsLoading && (!tldList || tldList.prices.length === 0)} // Show loading only on initial fetch
        leftIcon={<FaList />}
        w="full" // Make button full width for better centering
      >
        {!tldList || tldList.prices.length === 0
          ? 'Fetch Top-Level Domains'
          : isTldListVisible
            ? 'Hide Top-Level Domains'
            : 'Show Top-Level Domains'}
      </Button>

      <Collapse in={isTldListVisible} animateOpacity>
        <Box mt={4}>
          {/* Add some margin when visible */}
          {tldsLoading &&
            !tldList && ( // Show spinner only on initial load or if list is empty
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                colorScheme={primaryColorScheme}
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
          {tldList && tldList.prices.length > 0 && (
            <TableContainer
              borderWidth="1px"
              borderRadius="lg"
              p={4}
              bg={tableBackgroundColor}
            >
              <Text fontSize="sm" color="gray.500" mb={2}>
                {tldList.prices.length} top-level domains.
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
                  {tldList.prices.map((item: TLDPrice) => (
                    <Tr key={item.tld}>
                      <Td fontWeight="medium">.{item.tld}</Td>
                      <Td isNumeric>
                        {item.registrationPrice !== undefined
                          ? `${item.registrationPrice.toFixed(2)} ${item.currency || ''}`
                          : 'N/A'}
                      </Td>
                      <Td isNumeric>
                        {item.transferPrice !== undefined
                          ? `${item.transferPrice.toFixed(2)} ${item.currency || ''}`
                          : 'N/A'}
                      </Td>
                      <Td isNumeric>
                        {item.renewalPrice !== undefined
                          ? `${item.renewalPrice.toFixed(2)} ${item.currency || ''}`
                          : 'N/A'}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
          {tldList && tldList.prices.length === 0 && !tldsLoading && (
            <Text mt={4} textAlign="center" color="gray.500">
              No TLD data available at the moment.
            </Text>
          )}
        </Box>
      </Collapse>
    </Section>
  );
};
