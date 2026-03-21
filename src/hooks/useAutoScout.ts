/**
 * [USE_AUTO_SCOUT_HOOK]
 * React hook for integrating Auto-Scout Registration with the transaction form.
 * 
 * Handles:
 * - Automatic registration attempts when transactions are saved
 * - Disambiguation modal state management
 * - User choice handling and persistence
 */

import { useState, useCallback } from 'react';
import { AutoScoutRegistrationService } from '../services/AutoScoutRegistrationService';
import { AmbiguousTokenOption } from '../services/scout/ScoutAliasService';

interface UseAutoScoutResult {
    // State
    isModalOpen: boolean;
    currentSymbol: string | null;
    ambiguousOptions: AmbiguousTokenOption[];
    isRegistering: boolean;
    lastMessage: string | null;

    // Actions
    registerAsset: (symbol: string) => Promise<void>;
    handleSelect: (choice: AmbiguousTokenOption) => Promise<void>;
    handleSkip: () => void;
    closeModal: () => void;
    clearMessage: () => void;
}

export function useAutoScout(): UseAutoScoutResult {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
    const [ambiguousOptions, setAmbiguousOptions] = useState<AmbiguousTokenOption[]>([]);
    const [isRegistering, setIsRegistering] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);

    /**
     * Attempt to register an asset with Scout.
     * Opens disambiguation modal if needed.
     */
    const registerAsset = useCallback(async (symbol: string) => {
        if (!symbol || symbol.trim() === '') return;

        setIsRegistering(true);
        setLastMessage(null);

        try {
            const result = await AutoScoutRegistrationService.attemptRegistration(symbol);

            if (result.requiresDisambiguation && result.ambiguousOptions) {
                // Open disambiguation modal
                setCurrentSymbol(symbol);
                setAmbiguousOptions(result.ambiguousOptions);
                setIsModalOpen(true);
            } else {
                // Show result message
                setLastMessage(result.message);

                // Auto-clear success messages after 3 seconds
                if (result.success) {
                    setTimeout(() => setLastMessage(null), 3000);
                }
            }
        } catch (error: any) {
            setLastMessage(`Error: ${error.message}`);
        } finally {
            setIsRegistering(false);
        }
    }, []);

    /**
     * Handle user selection from disambiguation modal.
     */
    const handleSelect = useCallback(async (choice: AmbiguousTokenOption) => {
        if (!currentSymbol) return;

        setIsRegistering(true);

        try {
            const result = await AutoScoutRegistrationService.completeRegistrationWithChoice(
                currentSymbol,
                choice
            );

            setLastMessage(result.message);
            setIsModalOpen(false);
            setCurrentSymbol(null);
            setAmbiguousOptions([]);

            // Auto-clear success messages after 3 seconds
            if (result.success) {
                setTimeout(() => setLastMessage(null), 3000);
            }
        } catch (error: any) {
            setLastMessage(`Error: ${error.message}`);
        } finally {
            setIsRegistering(false);
        }
    }, [currentSymbol]);

    /**
     * Handle user skipping disambiguation.
     */
    const handleSkip = useCallback(() => {
        if (currentSymbol) {
            AutoScoutRegistrationService.skipRegistration(currentSymbol);
            setLastMessage(`Skipped Auto-Scout registration for ${currentSymbol}`);
        }

        setIsModalOpen(false);
        setCurrentSymbol(null);
        setAmbiguousOptions([]);

        // Auto-clear message after 3 seconds
        setTimeout(() => setLastMessage(null), 3000);
    }, [currentSymbol]);

    /**
     * Close the modal without action.
     */
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setCurrentSymbol(null);
        setAmbiguousOptions([]);
    }, []);

    /**
     * Clear the last message.
     */
    const clearMessage = useCallback(() => {
        setLastMessage(null);
    }, []);

    return {
        // State
        isModalOpen,
        currentSymbol,
        ambiguousOptions,
        isRegistering,
        lastMessage,

        // Actions
        registerAsset,
        handleSelect,
        handleSkip,
        closeModal,
        clearMessage
    };
}
