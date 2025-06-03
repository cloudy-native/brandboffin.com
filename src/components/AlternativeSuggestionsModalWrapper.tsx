import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from '@chakra-ui/react';
import * as React from 'react';
import type { DomainSuggestion } from '../../common/types';
import { AlternativeSuggestionsDisplay } from './AlternativeSuggestionsDisplay';

interface AlternativeSuggestionsModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDomain: string | null;
  suggestions: DomainSuggestion[] | null;
  isLoading: boolean;
  error: string | null;
  modalBgColor: string;
  spinnerColor: string;
  primaryColorScheme: string;
}

export const AlternativeSuggestionsModalWrapper: React.FC<
  AlternativeSuggestionsModalWrapperProps
> = ({
  isOpen,
  onClose,
  selectedDomain,
  suggestions,
  isLoading,
  error,
  modalBgColor,
  spinnerColor,
  primaryColorScheme,
}) => {
  if (!selectedDomain) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent bg={modalBgColor}>
        <ModalHeader>Alternatives for {selectedDomain}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading && (
            <Box textAlign="center" py={10}>
              <Spinner size="xl" color={spinnerColor} />
              <Text mt={2}>Loading alternative suggestions...</Text>
            </Box>
          )}
          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}
          {!isLoading && !error && suggestions && suggestions.length > 0 && (
            <AlternativeSuggestionsDisplay
              suggestions={suggestions}
              domainName={selectedDomain}
            />
          )}
          {!isLoading &&
            !error &&
            (!suggestions || suggestions.length === 0) && (
              <Text>
                No alternative suggestions found for {selectedDomain}.
              </Text>
            )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme={primaryColorScheme} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
