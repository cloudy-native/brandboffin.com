import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";

interface HomePageHeroProps {
  colorScheme: string;
}

const HomePageHero: React.FC<HomePageHeroProps> = ({ colorScheme }) => {
  const heroBg = useColorModeValue(`${colorScheme}.100`, `${colorScheme}.900`);
  const heroAccentColor = useColorModeValue(
    `${colorScheme}.500`,
    `${colorScheme}.300`
  );

  return (
    <Box bg={heroBg} py={{ base: 4, md: 8 }}>
      <Container maxW="3xl" textAlign="center">
        <Heading
          as="h1"
          size={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          color={heroAccentColor}
          mb={4}
        >
          Brainstorm Your Perfect Brand Name
        </Heading>
        <Heading
          as="h2"
          size={{ base: "md", md: "lg" }}
          fontWeight="bold"
          color={heroAccentColor}
          mb={4}
        >
          And a domain name to go with it!
        </Heading>
        <Text
          fontSize={{ base: "lg", md: "xl" }}
          color={useColorModeValue("gray.700", "gray.200")}
          mb={8}
        >
          Get instant domain availability checks, brand name suggestions, and
          top-level domain options. Your next big idea starts here.
        </Text>
      </Container>
    </Box>
  );
};

export default HomePageHero;
