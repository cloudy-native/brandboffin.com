export const primaryColorScheme = "primary";
export const secondaryColorScheme = "secondary";
export const accentColorScheme = "accent";
export const backgroundScheme = "background";

export interface Shade {
  light: string;
  dark: string;
}

export const bgShade: Shade = {
  light: "50",
  dark: "900",
};

export const panelBgShade: Shade = {
  light: "50",
  dark: "900",
};

export const uiShade: Shade = {
  light: "50",
  dark: "900",
};

export const headingShade: Shade = {
  light: "800",
  dark: "200",
};

export const textShade: Shade = {
  light: "700",
  dark: "100",
};

export const borderShade: Shade = {
  light: "200",
  dark: "800",
};

export const headerFooterBackgroundShade: Shade = {
  light: "100",
  dark: "900",
};

export function getThemedColorLight(colorScheme: string, shade: Shade): string {
  return `${colorScheme}.${shade.light}`;
}

export function getThemedColorDark(colorScheme: string, shade: Shade): string {
  return `${colorScheme}.${shade.dark}`;
}