export const primaryColorScheme = "primary";
export const secondaryColorScheme = "secondary";
export const accentColorScheme = "accent";
export const backgroundScheme = "background";

export interface Shade {
  light: string;
  dark: string;
}

export function shadesFor(
  colorScheme: string,
  light: string,
  dark: string
): Shade {
  return {
    light: `${colorScheme}.${light}`,
    dark: `${colorScheme}.${dark}`,
  };
}

export const backgroundShade: Shade = shadesFor(backgroundScheme, "100", "900");
export const cardBackgroundShade: Shade = shadesFor(secondaryColorScheme, "50", "800");
export const headingShade: Shade = shadesFor(primaryColorScheme, "900", "50");
export const textShade: Shade = shadesFor(primaryColorScheme, "800", "100");
export const borderShade: Shade = shadesFor(backgroundScheme, "300", "800");
export const accentShade: Shade = shadesFor(accentColorScheme, "500", "500");

export const headerFooterBackgroundShade: Shade = shadesFor(
  backgroundScheme,
  "400",
  "800"
);
