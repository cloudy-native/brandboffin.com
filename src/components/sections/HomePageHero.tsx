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
  primaryDark,
  primaryLight,
  textShade,
} from "../../theme/design";

interface HomePageHeroProps {}

export const HomePageHero: React.FC<HomePageHeroProps> = () => {
  const heroBg = useColorModeValue(primaryLight(bgShade), primaryDark(bgShade));
  const heroHeadingColor = useColorModeValue(
    primaryLight(headingShade),
    primaryDark(headingShade)
  );
  const textColor = useColorModeValue(
    primaryLight(textShade),
    primaryDark(textShade)
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

