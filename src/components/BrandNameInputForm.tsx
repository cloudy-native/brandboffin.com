import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Spacer,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Dices } from "lucide-react";
import * as React from "react";

interface BrandNameInputFormProps {
  brandPrompt: string;
  setBrandPrompt: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  keywords: string;
  setKeywords: (value: string) => void;
  length: number;
  setLength: (value: number) => void;
  count: number;
  setCount: (value: number) => void;
  handleRandomizeOptionalFields: () => void;
  headingColor: string;
  textColor: string;
  borderColor: string;
}

export const BrandNameInputForm: React.FC<BrandNameInputFormProps> = ({
  brandPrompt,
  setBrandPrompt,
  industry,
  setIndustry,
  style,
  setStyle,
  keywords,
  setKeywords,
  length,
  setLength,
  count,
  setCount,
  handleRandomizeOptionalFields,
  headingColor,
  textColor,
  borderColor,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl id="brand-prompt">
        <FormLabel fontWeight="bold" fontSize="lg" color={headingColor}>
          Describe your business or idea:
        </FormLabel>
        <Textarea
          borderColor={borderColor}
          value={brandPrompt}
          onChange={e => setBrandPrompt(e.target.value)}
          placeholder="Describe your next big business idea. It works best with 3-5 sentences that are clear, concise, and reflect the essence of your company or product."
          size="lg"
          minHeight="100px"
        />
      </FormControl>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        p={4}
        mt={4} // mt={4} is redundant if VStack spacing is applied, but keeping for consistency with original
        borderColor={borderColor}
        position="relative"
      >
        <Flex alignItems="center" mb={4}>
          <Heading as="h3" size="sm" fontWeight="semibold" color={headingColor}>
            Optional Details
          </Heading>
          <Spacer />
          <Button
            aria-label="Randomize optional fields - Inspire me"
            leftIcon={<Dices size={20} />}
            size="md"
            variant="ghost"
            onClick={handleRandomizeOptionalFields}
            color={textColor}
          >
            Inspire me
          </Button>
        </Flex>
        <VStack spacing={4} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="industry">
              <FormLabel>Industry</FormLabel>
              <Input
                borderColor={borderColor}
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Food, Fashion"
              />
            </FormControl>
            <FormControl id="style">
              <FormLabel>Style</FormLabel>
              <Input
                borderColor={borderColor}
                value={style}
                onChange={e => setStyle(e.target.value)}
                placeholder="e.g., Modern, Playful, Elegant"
              />
            </FormControl>
          </SimpleGrid>
          <FormControl id="keywords">
            <FormLabel>
              Keywords{" "}
              <Text
                as="span"
                fontSize="xs"
                color={textColor}
                fontWeight="normal"
              >
                (comma-separated)
              </Text>
            </FormLabel>
            <Input
              borderColor={borderColor}
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="e.g., sustainable, innovative, luxury"
            />
          </FormControl>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl id="length">
              <FormLabel>Max Name Length</FormLabel>
              <NumberInput
                borderColor={borderColor}
                value={isNaN(length) ? "" : length}
                onChange={(valueAsString, valueAsNumber) => {
                  setLength(valueAsString === "" ? NaN : valueAsNumber);
                }}
                min={3}
                max={30}
                precision={0}
                step={1}
              >
                <NumberInputField placeholder="e.g., 10 characters" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            <FormControl id="count">
              <FormLabel>Number of Suggestions</FormLabel>
              <NumberInput
                borderColor={borderColor}
                value={isNaN(count) ? "" : count}
                onChange={(valueAsString, valueAsNumber) => {
                  setCount(valueAsString === "" ? NaN : valueAsNumber);
                }}
                min={1}
                max={50}
                precision={0}
                step={1}
              >
                <NumberInputField placeholder="e.g., 10 suggestions" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Box>
    </VStack>
  );
};
