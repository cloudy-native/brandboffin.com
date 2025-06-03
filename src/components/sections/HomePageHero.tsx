import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { headingShade } from '../../theme/design';

export const HomePageHero: React.FC = () => {
  const headingColor = useColorModeValue(headingShade.light, headingShade.dark);

  return (
    <Box py={{ base: 4, md: 8 }}>
      <Container maxW="3xl" textAlign="center">
        <Heading
          as="h1"
          size={{ base: '2xl', md: '3xl' }}
          fontWeight="bold"
          mb={4}
          color={headingColor}
        >
          Brainstorm Your Perfect Brand Name
        </Heading>
        <Heading
          as="h2"
          size={{ base: 'md', md: 'lg' }}
          fontWeight="bold"
          mb={4}
          color={headingColor}
        >
          And find a domain name to go with it!
        </Heading>
        <Text fontSize={{ base: 'lg', md: 'xl' }} mb={8} color={headingColor}>
          Use AI to suggest brand names and domain names for your next big idea.
        </Text>
      </Container>
    </Box>
  );
};
