/**
 * useWatchAddresses Hook - Track multiple wallet addresses
 */

import { useState, useEffect, useCallback } from 'react';
import { watchAddressService, WatchedAddress, SUPPORTED_CHAINS } from '../services/web3/WatchAddressService';

export function useWatchAddresses() {
    const [addresses, setAddresses] = useState<WatchedAddress[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = watchAddressService.subscribe((newAddresses) => {
            setAddresses(newAddresses);
        });
        return unsubscribe;
    }, []);

    const addAddress = useCallback(async (address: string, label: string, chainId?: number) => {
        setIsLoading(true);
        try {
            // Auto-detect Solana if no chainId provided
            const trimmedAddress = address.trim();
            const isSolana = !trimmedAddress.startsWith('0x') && trimmedAddress.length >= 32;
            const finalChainId = chainId || (isSolana ? 999999 : 1);
            
            const result = await watchAddressService.addAddress(trimmedAddress, label, finalChainId);
            return result;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const removeAddress = useCallback((id: string) => {
        watchAddressService.removeAddress(id);
    }, []);

    const refreshAddress = useCallback(async (id: string) => {
        await watchAddressService.refreshAddress(id);
    }, []);

    const refreshAll = useCallback(async () => {
        setIsLoading(true);
        try {
            await watchAddressService.refreshAll();
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateLabel = useCallback((id: string, label: string) => {
        watchAddressService.updateLabel(id, label);
    }, []);

    const formatAddress = useCallback((address: string, chars?: number) => {
        return watchAddressService.formatAddress(address, chars);
    }, []);

    // Calculate totals by chain
    const totalBalance = addresses.reduce((sum, addr) => {
        return sum + parseFloat(addr.balance || '0');
    }, 0);

    return {
        addresses,
        isLoading,
        addAddress,
        removeAddress,
        refreshAddress,
        refreshAll,
        updateLabel,
        formatAddress,
        totalBalance,
        count: addresses.length,
        SUPPORTED_CHAINS,
    };
}

export default useWatchAddresses;
