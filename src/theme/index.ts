import { Colors, extendTheme, ThemeConfig } from "@chakra-ui/react";

// Color configuration for light/dark mode
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors: Colors = {
  primary: {
    "50": "#cae2f7",
    "100": "#b3d6f3",
    "200": "#95c6ee",
    "300": "#77b6e9",
    "400": "#59a5e5",
    "500": "#4299e1",
    "600": "#2489dc",
    "700": "#1d70b5",
    "800": "#16578d",
    "900": "#103e64",
  },
  background: {
    "50": "#f9fdff",
    "100": "#f7fcff",
    "200": "#f4fbff",
    "300": "#f1faff",
    "400": "#edf9ff",
    "500": "#ebf8ff",
    "600": "#96daff",
    "700": "#24b2ff",
    "800": "#0073b1",
    "900": "#00293f",
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
    "50": "#fcd4d4",
    "100": "#fbc1c1",
    "200": "#f9a9a9",
    "300": "#f89090",
    "400": "#f67777",
    "500": "#f56565",
    "600": "#f23a3a",
    "700": "#e10f0f",
    "800": "#a80b0b",
    "900": "#6f0707",
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
