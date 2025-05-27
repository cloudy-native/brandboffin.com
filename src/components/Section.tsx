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
  primaryDark,
  primaryLight,
} from "../theme/design";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  const topBar = useColorModeValue(
    primaryLight(borderShade),
    primaryDark(borderShade)
  );
  const bg = useColorModeValue(primaryLight(bgShade), primaryDark(bgShade));
  const titleColor = useColorModeValue(
    primaryLight(headingShade),
    primaryDark(headingShade)
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
