export const primaryColorScheme = "blue";
export const secondaryColorScheme = "green";

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

export function primaryLight(shade: Shade) {
  return `${primaryColorScheme}.${shade.light}`;
}

export function primaryDark(shade: Shade) {
  return `${primaryColorScheme}.${shade.dark}`;
}

export function secondaryLight(shade: Shade) {
  return `${secondaryColorScheme}.${shade.light}`;
}

export function secondaryDark(shade: Shade) {
  return `${secondaryColorScheme}.${shade.dark}`;
}