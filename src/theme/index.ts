import { extendTheme, ThemeConfig } from "@chakra-ui/react";

// Color configuration for light/dark mode
const config: ThemeConfig = {
  initialColorMode: "system",
  useSystemColorMode: true,
};

// Custom theme definition with jewel tones
const theme = extendTheme({
  config,
  components: {},
  styles: {},
});

export default theme;
