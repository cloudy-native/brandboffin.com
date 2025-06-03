import React from "react";
import { Box, Flex, Grid, Heading, Text } from "@chakra-ui/react";
import theme from "../../theme"; // Adjust path if necessary based on actual theme file location

const { colors } = theme;

interface ColorSwatchProps {
  colorValue: string;
  colorName?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ colorValue, colorName }) => (
  <Flex
    direction="column"
    align="center"
    m={1}
    p={2}
    borderWidth="1px"
    borderRadius="md"
  >
    <Box
      w="60px"
      h="60px"
      bg={colorValue}
      border="1px solid"
      borderColor="gray.300"
      borderRadius="sm"
    />
    {colorName && (
      <Text fontSize="sm" fontWeight="medium" mt={2}>
        {colorName}
      </Text>
    )}
    <Text fontSize="xs" color="gray.600" mt={1}>
      {colorValue}
    </Text>
  </Flex>
);

interface ColorSchemeDisplayProps {
  schemeName: string;
  // Assuming shades is an object like { '50': '#hex', '100': '#hex', ... }
  shades: Record<string, string>;
}

const ColorSchemeDisplay: React.FC<ColorSchemeDisplayProps> = ({
  schemeName,
  shades,
}) => (
  <Box mb={10}>
    <Heading
      size="md"
      mb={4}
      textTransform="capitalize"
      borderBottomWidth="1px"
      pb={2}
    >
      {schemeName}
    </Heading>
    <Grid templateColumns="repeat(auto-fill, minmax(100px, 1fr))" gap={4}>
      {Object.entries(shades).map(([shadeName, colorValue]) => (
        <ColorSwatch
          key={`${schemeName}-${shadeName}`}
          colorValue={colorValue}
          colorName={shadeName}
        />
      ))}
    </Grid>
  </Box>
);

const AllColorSwatches: React.FC = () => {
  // Explicitly type 'colors' to ensure we know its structure.
  // This assumes 'colors' has a structure like: { primary: { '50': '...', ... }, secondary: ..., etc. }
  const typedColors = colors as Record<string, Record<string, string>>;

  const schemesToDisplay: { [key: string]: Record<string, string> } = {
    primary: typedColors.primary,
    secondary: typedColors.secondary,
    accent: typedColors.accent,
    background: typedColors.background,
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" m={4} boxShadow="lg">
      <Heading size="xl" mb={8} textAlign="center" color="primary.500">
        Color Palette Swatches
      </Heading>
      {Object.entries(schemesToDisplay).map(([schemeName, shades]) => {
        if (!shades) {
          console.warn(
            `Color scheme "${schemeName}" is undefined in the theme.`,
          );
          return null; // Skip rendering if a scheme is missing
        }
        return (
          <ColorSchemeDisplay
            key={schemeName}
            schemeName={schemeName}
            shades={shades}
          />
        );
      })}
    </Box>
  );
};

export default AllColorSwatches;
