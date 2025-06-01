import {
  Box,
  Container,
  Heading,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React from "react";
import { accentShade, headingShade } from "../theme/design";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  const topBar = useColorModeValue(accentShade.light, accentShade.dark);
  const headingColor = useColorModeValue(headingShade.light, headingShade.dark);

  return (
    <Box pb={10}>
      <Box h="4px" w="full" bg={topBar} />
      <Container maxW="4xl" pt={10}>
        <VStack spacing={4} align="stretch">
          <Heading as="h2" size="xl" textAlign="center" color={headingColor}>
            {title}
          </Heading>
          {children}
        </VStack>
      </Container>
    </Box>
  );
};

export default Section;
