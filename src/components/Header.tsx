import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Box,
  Container,
  Flex,
  IconButton,
  Link,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as GatsbyLink } from 'gatsby';
import React from 'react';
import { headerFooterBackgroundShade, textShade } from '../theme/design';

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // {
  //   label: "Home",
  //   href: "/",
  // },
];

const Header = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const backgroundColor = useColorModeValue(
    headerFooterBackgroundShade.light,
    headerFooterBackgroundShade.dark,
  );
  const textColor = useColorModeValue(textShade.light, textShade.dark);

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={10}
      borderBottom="1px"
      boxShadow="sm"
      backdropFilter="none"
      bg={backgroundColor}
    >
      <Container maxW="container.xl" px={4}>
        <Flex
          minH={'60px'}
          py={{ base: 2 }}
          align={'center'}
          justify="space-between"
        >
          <Flex flex={{ base: 1 }} justify="start">
            <Text
              as={GatsbyLink}
              to="/"
              textAlign="left"
              fontFamily={'heading'}
              fontWeight="bold"
              fontSize="xl"
              color={textColor}
            >
              Brand Boffin
            </Text>

            <Flex display="flex" ml={10}>
              <Stack direction={'row'} spacing={6} align="center">
                {NAV_ITEMS.map((navItem) => (
                  <Link
                    key={navItem.label}
                    as={!navItem.isExternal ? GatsbyLink : undefined}
                    to={!navItem.isExternal ? navItem.href : undefined}
                    href={navItem.isExternal ? navItem.href : undefined}
                    fontSize={'md'}
                    fontWeight={500}
                    color={textColor}
                  >
                    {navItem.label}
                  </Link>
                ))}
              </Stack>
            </Flex>
          </Flex>

          <Stack flex={1} justify={'flex-end'} direction={'row'} spacing={6}>
            <IconButton
              aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
              variant="ghost"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              color={textColor}
            />
          </Stack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
