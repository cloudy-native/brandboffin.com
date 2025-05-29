import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import {
  backgroundScheme,
  getThemedColorLight,
  getThemedColorDark,
  bgShade,
} from "../theme/design";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const globalBgColor = useColorModeValue(
    getThemedColorLight(backgroundScheme, bgShade),
    getThemedColorDark(backgroundScheme, bgShade)
  );
  return (
    <Flex direction="column" minH="100vh" bg={globalBgColor}>
      <Header />
      <Box as="main" flex="1" width="100%">
        {children}
      </Box>
      <Footer />
    </Flex>
  );
};

export default Layout;
