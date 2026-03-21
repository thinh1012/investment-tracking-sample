/**
 * Watch Address Service - Track wallet addresses without connecting
 * Supports EVM chains (ETH, BSC, etc.) and Solana
 */

import { ethers } from 'ethers';
import { Connection as SolanaConnection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface WatchedAddress {
    id: string;
    address: string;
    label: string;
    chainId: number;
    chainType: 'evm' | 'solana';
    balance: string;
    lastUpdated: number;
    isLoading: boolean;
    error?: string;
}

// Chain configurations
export const SUPPORTED_CHAINS = {
    // EVM Chains
    1: { name: 'Ethereum', symbol: 'ETH', type: 'evm' as const, rpc: 'https://eth.llamarpc.com' },
    56: { name: 'BSC', symbol: 'BNB', type: 'evm' as const, rpc: 'https://bsc-dataseed.binance.org' },
    137: { name: 'Polygon', symbol: 'MATIC', type: 'evm' as const, rpc: 'https://polygon.llamarpc.com' },
    42161: { name: 'Arbitrum', symbol: 'ETH', type: 'evm' as const, rpc: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'Optimism', symbol: 'ETH', type: 'evm' as const, rpc: 'https://mainnet.optimism.io' },
    8453: { name: 'Base', symbol: 'ETH', type: 'evm' as const, rpc: 'https://mainnet.base.org' },
    43114: { name: 'Avalanche', symbol: 'AVAX', type: 'evm' as const, rpc: 'https://api.avax.network/ext/bc/C/rpc' },
    // Solana
    999999: { name: 'Solana', symbol: 'SOL', type: 'solana' as const, rpc: 'https://api.mainnet-beta.solana.com' },
};

class WatchAddressService {
    private addresses: Map<string, WatchedAddress> = new Map();
    private listeners: Set<(addresses: WatchedAddress[]) => void> = new Set();
    private solanaConnection: SolanaConnection | null = null;

    constructor() {
        this.loadFromStorage();
        this.initSolanaConnection();
    }

    private initSolanaConnection() {
        try {
            this.solanaConnection = new SolanaConnection(SUPPORTED_CHAINS[999999].rpc, 'confirmed');
        } catch (e) {
            console.error('[WatchAddress] Failed to init Solana:', e);
        }
    }

    private loadFromStorage() {
        try {
            const saved = localStorage.getItem('watched_addresses_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.forEach((addr: WatchedAddress) => {
                    this.addresses.set(addr.id, addr);
                });
            }
        } catch (e) {
            console.error('[WatchAddress] Failed to load:', e);
        }
    }

    private saveToStorage() {
        try {
            const data = Array.from(this.addresses.values());
            localStorage.setItem('watched_addresses_v2', JSON.stringify(data));
        } catch (e) {
            console.error('[WatchAddress] Failed to save:', e);
        }
    }

    private notifyListeners() {
        const addresses = Array.from(this.addresses.values());
        this.listeners.forEach(listener => listener(addresses));
    }

    subscribe(listener: (addresses: WatchedAddress[]) => void): () => void {
        this.listeners.add(listener);
        listener(Array.from(this.addresses.values()));
        return () => this.listeners.delete(listener);
    }

    getAddresses(): WatchedAddress[] {
        return Array.from(this.addresses.values());
    }

    private detectChainType(address: string): 'evm' | 'solana' {
        // Solana addresses are base58 encoded and typically 32-44 characters
        // They don't start with 0x
        if (!address.startsWith('0x') && address.length >= 32 && address.length <= 44) {
            return 'solana';
        }
        return 'evm';
    }

    private isValidSolanaAddress(address: string): boolean {
        try {
            new PublicKey(address);
            return true;
        } catch {
            return false;
        }
    }

    async addAddress(address: string, label: string, chainId: number = 1): Promise<boolean> {
        const trimmedAddress = address.trim();
        
        // Auto-detect chain type
        const detectedType = this.detectChainType(trimmedAddress);
        
        // Validate address based on type
        if (detectedType === 'evm') {
            if (!ethers.isAddress(trimmedAddress)) {
                return false;
            }
        } else {
            if (!this.isValidSolanaAddress(trimmedAddress)) {
                return false;
            }
            // Force Solana chain ID for Solana addresses
            chainId = 999999;
        }

        const normalizedAddress = detectedType === 'evm' 
            ? ethers.getAddress(trimmedAddress)
            : trimmedAddress;

        // Check if already exists
        const exists = Array.from(this.addresses.values()).some(
            a => a.address.toLowerCase() === normalizedAddress.toLowerCase()
        );
        if (exists) {
            return false;
        }

        const id = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const watchedAddress: WatchedAddress = {
            id,
            address: normalizedAddress,
            label: label || `Wallet ${this.addresses.size + 1}`,
            chainId,
            chainType: detectedType,
            balance: '0',
            lastUpdated: 0,
            isLoading: true,
        };

        this.addresses.set(id, watchedAddress);
        this.saveToStorage();
        this.notifyListeners();

        // Fetch balance
        await this.refreshAddress(id);

        return true;
    }

    removeAddress(id: string): void {
        this.addresses.delete(id);
        this.saveToStorage();
        this.notifyListeners();
    }

    async refreshAddress(id: string): Promise<void> {
        const addr = this.addresses.get(id);
        if (!addr) return;

        this.addresses.set(id, { ...addr, isLoading: true, error: undefined });
        this.notifyListeners();

        try {
            let balance = '0';

            if (addr.chainType === 'solana') {
                // Fetch Solana balance
                if (!this.solanaConnection) {
                    throw new Error('Solana connection not available');
                }
                const publicKey = new PublicKey(addr.address);
                const lamports = await this.solanaConnection.getBalance(publicKey);
                balance = (lamports / LAMPORTS_PER_SOL).toFixed(9);
            } else {
                // Fetch EVM balance
                const chain = SUPPORTED_CHAINS[addr.chainId as keyof typeof SUPPORTED_CHAINS];
                if (!chain || chain.type !== 'evm') {
                    throw new Error('Unsupported chain');
                }

                const provider = new ethers.JsonRpcProvider(chain.rpc);
                const balanceWei = await provider.getBalance(addr.address);
                balance = ethers.formatEther(balanceWei);
            }

            this.addresses.set(id, {
                ...addr,
                balance,
                lastUpdated: Date.now(),
                isLoading: false,
            });
        } catch (error: any) {
            console.error('[WatchAddress] Failed to fetch:', error);
            this.addresses.set(id, {
                ...addr,
                isLoading: false,
                error: 'Failed to fetch balance',
            });
        }

        this.saveToStorage();
        this.notifyListeners();
    }

    async refreshAll(): Promise<void> {
        const promises = Array.from(this.addresses.keys()).map(id => 
            this.refreshAddress(id)
        );
        await Promise.all(promises);
    }

    updateLabel(id: string, label: string): void {
        const addr = this.addresses.get(id);
        if (addr) {
            this.addresses.set(id, { ...addr, label });
            this.saveToStorage();
            this.notifyListeners();
        }
    }

    formatAddress(address: string, chars: number = 4): string {
        if (!address) return '';
        if (address.length <= chars * 2 + 4) return address;
        return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
    }
}

export const watchAddressService = new WatchAddressService();
export default watchAddressService;
