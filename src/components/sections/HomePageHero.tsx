import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import {
  bgShade,
  headingShade,
  textShade,
  primaryColorScheme,
  getThemedColorLight, // Import new helper
  getThemedColorDark, // Import new helper
} from "../../theme/design";

interface HomePageHeroProps {
}

export const HomePageHero: React.FC<HomePageHeroProps> = () => {
  const heroBg = useColorModeValue(
    getThemedColorLight(primaryColorScheme, bgShade),
    getThemedColorDark(primaryColorScheme, bgShade)
  );
  const heroHeadingColor = useColorModeValue(
    getThemedColorLight(primaryColorScheme, headingShade),
    getThemedColorDark(primaryColorScheme, headingShade)
  );
  const textColor = useColorModeValue(
    getThemedColorLight(primaryColorScheme, textShade),
    getThemedColorDark(primaryColorScheme, textShade)
  );

  return (
    <Box bg={heroBg} py={{ base: 4, md: 8 }}>
      <Container maxW="3xl" textAlign="center">
        <Heading
          as="h1"
          size={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          color={heroHeadingColor}
          mb={4}
        >
          Brainstorm Your Perfect Brand Name
        </Heading>
        <Heading
          as="h2"
          size={{ base: "md", md: "lg" }}
          fontWeight="bold"
          color={heroHeadingColor}
          mb={4}
        >
          And a domain name to go with it!
        </Heading>
        <Text fontSize={{ base: "lg", md: "xl" }} color={textColor} mb={8}>
          Get instant domain availability checks, brand name suggestions, and
          top-level domain options. Your next big idea starts here.
        </Text>
      </Container>
    </Box>
  );
};

