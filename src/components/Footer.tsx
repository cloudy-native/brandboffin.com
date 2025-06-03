import {
  Box,
  Container,
  Divider,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as GatsbyLink } from "gatsby";
import React from "react";
import { headerFooterBackgroundShade } from "../theme/design";
import BuyMeCoffeeButton from "./BuyMeCoffeeButton";

const Footer = () => {
  const backgroundColor = useColorModeValue(
    headerFooterBackgroundShade.light,
    headerFooterBackgroundShade.dark,
  );

  return (
    <Box as="footer" borderTop="1px" bg={backgroundColor}>
      <Container as={Stack} maxW={"container.xl"} py={10}>
        <SimpleGrid
          templateColumns={{ sm: "1fr 1fr", md: "2fr 1fr 1fr 2fr" }}
          spacing={8}
        >
          <Stack spacing={6}>
            <Box>
              <Text
                as={GatsbyLink}
                to="/"
                fontFamily={"heading"}
                fontWeight="bold"
                fontSize="xl"
              >
                Brand Boffin
              </Text>
            </Box>
            <Text fontSize={"sm"}>
              A domain name idea generator for brands.
            </Text>
          </Stack>

          <Stack align={"flex-start"}>
            <Text>
              If you like this and want to help a little bit, you can send small
              donation.
            </Text>
            <BuyMeCoffeeButton />
          </Stack>
        </SimpleGrid>
      </Container>

      <Divider />

      <Box py={4}>
        <Text pt={2} fontSize={"sm"} textAlign={"center"}>
          © {new Date().getFullYear()} Brand Boffin. All rights reserved.
        </Text>
      </Box>
    </Box>
  );
};

export default Footer;
