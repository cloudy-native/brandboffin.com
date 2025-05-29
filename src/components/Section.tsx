import {
  Box,
  Container,
  Heading,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import {
  bgShade,
  borderShade,
  headingShade,
  primaryColorScheme as defaultColorScheme,
  getThemedColorLight,
  getThemedColorDark,
} from "../theme/design";

interface SectionProps {
  title: string;
  children: React.ReactNode;
  colorScheme?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, colorScheme: propColorScheme }) => {
  const activeColorScheme = propColorScheme || defaultColorScheme;
  const topBar = useColorModeValue(
    getThemedColorLight(activeColorScheme, borderShade),
    getThemedColorDark(activeColorScheme, borderShade)
  );
  const bg = useColorModeValue(getThemedColorLight(activeColorScheme, bgShade), getThemedColorDark(activeColorScheme, bgShade));
  const titleColor = useColorModeValue(
    getThemedColorLight(activeColorScheme, headingShade),
    getThemedColorDark(activeColorScheme, headingShade)
  );

  return (
    <Box pb={10} bg={bg}>
      <Box h="2px" bg={topBar} w="full" />
      <Container maxW="4xl" pt={10}>
        <VStack spacing={4} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" color={titleColor}>
            {title}
          </Heading>
          {children}
        </VStack>
      </Container>
    </Box>
  );
};

export default Section;
