import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { backgroundShade } from "../theme/design";
import Footer from "./Footer";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const backgroundColor = useColorModeValue(
    backgroundShade.light,
    backgroundShade.dark,
  );

  return (
    <Box bg={backgroundColor}>
      <Flex direction="column" minH="100vh">
        <Header />
        <Box as="main" flex="1" width="100%">
          {children}
        </Box>
        <Footer />
      </Flex>
    </Box>
  );
};

export default Layout;
