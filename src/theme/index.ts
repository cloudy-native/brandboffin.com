import { Colors, extendTheme, ThemeConfig } from "@chakra-ui/react";

// Color configuration for light/dark mode
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors: Colors = {
  primary: {
    "50": "#c5dcf1",
    "100": "#adcdeb",
    "200": "#8cb9e4",
    "300": "#6ba5dc",
    "400": "#4a91d4",
    "500": "#3182ce",
    "600": "#2b72b5",
    "700": "#235e94",
    "800": "#1b4973",
    "900": "#143452",
  },
  background: {
    "50": "#ededed",
    "100": "#e5e5e5",
    "200": "#dadada",
    "300": "#cfcfcf",
    "400": "#c5c5c5",
    "500": "#bdbdbd",
    "600": "#a2a2a2",
    "700": "#7f7f7f",
    "800": "#5b5b5b",
    "900": "#383838",
  },
  secondary: {
    "50": "#d7dbe2",
    "100": "#c6ccd5",
    "200": "#afb8c4",
    "300": "#99a4b3",
    "400": "#828fa3",
    "500": "#718096",
    "600": "#627085",
    "700": "#505c6d",
    "800": "#3f4855",
    "900": "#2d333c",
  },
  accent: {
    "50": "#f6d5c0",
    "100": "#f2c4a5",
    "200": "#edac81",
    "300": "#e8945d",
    "400": "#e27c39",
    "500": "#dd6b20",
    "600": "#c25e1c",
    "700": "#9f4d17",
    "800": "#7c3c12",
    "900": "#582b0d",
  },
};

// Custom theme definition with jewel tones
const theme = extendTheme({
  config,
  colors,
  components: {},
  styles: {},
});

export default theme;
