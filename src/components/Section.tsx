import {
  Box,
  Container,
  Heading,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import React from "react";

interface SectionProps {
  title: string;
  colorScheme: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, colorScheme, children }) => {
  const bg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const topBar = useColorModeValue(`${colorScheme}.500`, `${colorScheme}.500`);
  const titleColor = useColorModeValue(
    `${colorScheme}.600`,
    `${colorScheme}.300`
  );

  return (
    <Box pb={10} bg={bg}>
      <Box h="8px" bg={topBar} w="full" />
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
