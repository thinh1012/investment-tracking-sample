/**
 * useWeb3 Hook - React hook for Web3 wallet interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { web3Service, WalletState, TokenBalance, SUPPORTED_CHAINS } from '../services/web3/Web3Service';

interface UseWeb3Return {
    // State
    address: string | null;
    chainId: number | null;
    balance: string;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    chainName: string;
    
    // Actions
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    refreshBalance: () => Promise<void>;
    switchChain: (chainId: number) => Promise<boolean>;
    getTokenBalance: (tokenAddress: string) => Promise<TokenBalance | null>;
    signMessage: (message: string) => Promise<string | null>;
    
    // Helpers
    formatAddress: (address: string, chars?: number) => string;
    getExplorerUrl: (address: string) => string;
}

export function useWeb3(): UseWeb3Return {
    const [state, setState] = useState<WalletState>(web3Service.getState());

    useEffect(() => {
        // Subscribe to Web3 service state changes
        const unsubscribe = web3Service.subscribe((newState) => {
            setState(newState);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const connect = useCallback(async () => {
        await web3Service.connect();
    }, []);

    const disconnect = useCallback(async () => {
        await web3Service.disconnect();
    }, []);

    const refreshBalance = useCallback(async () => {
        await web3Service.refreshBalance();
    }, []);

    const switchChain = useCallback(async (chainId: number) => {
        return await web3Service.switchChain(chainId);
    }, []);

    const getTokenBalance = useCallback(async (tokenAddress: string) => {
        return await web3Service.getTokenBalance(tokenAddress);
    }, []);

    const signMessage = useCallback(async (message: string) => {
        try {
            return await web3Service.signMessage(message);
        } catch {
            return null;
        }
    }, []);

    const formatAddress = useCallback((address: string, chars?: number) => {
        return web3Service.formatAddress(address, chars);
    }, []);

    const getExplorerUrl = useCallback((address: string) => {
        if (!state.chainId) return '';
        return web3Service.getExplorerUrl(state.chainId, address);
    }, [state.chainId]);

    // Get chain name from chain ID
    const chainName = state.chainId 
        ? SUPPORTED_CHAINS[state.chainId as keyof typeof SUPPORTED_CHAINS]?.name || 'Unknown'
        : '';

    return {
        // State
        address: state.address,
        chainId: state.chainId,
        balance: state.balance,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        chainName,
        
        // Actions
        connect,
        disconnect,
        refreshBalance,
        switchChain,
        getTokenBalance,
        signMessage,
        
        // Helpers
        formatAddress,
        getExplorerUrl,
    };
}

export default useWeb3;
