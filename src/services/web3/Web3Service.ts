/**
 * Web3 Service - Wallet Connection & Blockchain Interactions
 * Supports MetaMask, Rabby, and other EIP-1193 compatible wallets
 */

import { ethers } from 'ethers';

// Token ABI for ERC-20 balance queries
const ERC20_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
];

// Chain configurations
export const SUPPORTED_CHAINS = {
    1: { name: 'Ethereum', symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
    56: { name: 'BSC', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org' },
    137: { name: 'Polygon', symbol: 'MATIC', rpc: 'https://polygon.llamarpc.com' },
    42161: { name: 'Arbitrum', symbol: 'ETH', rpc: 'https://arb1.arbitrum.io/rpc' },
    10: { name: 'Optimism', symbol: 'ETH', rpc: 'https://mainnet.optimism.io' },
    8453: { name: 'Base', symbol: 'ETH', rpc: 'https://mainnet.base.org' },
    43114: { name: 'Avalanche', symbol: 'AVAX', rpc: 'https://api.avax.network/ext/bc/C/rpc' },
    59144: { name: 'Linea', symbol: 'ETH', rpc: 'https://rpc.linea.build' },
};

export interface WalletState {
    address: string | null;
    chainId: number | null;
    balance: string;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

export interface TokenBalance {
    symbol: string;
    name: string;
    balance: string;
    rawBalance: bigint;
    decimals: number;
    address: string;
}

class Web3Service {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;
    private listeners: Set<(state: WalletState) => void> = new Set();
    private currentState: WalletState = {
        address: null,
        chainId: null,
        balance: '0',
        isConnected: false,
        isConnecting: false,
        error: null,
    };

    constructor() {
        // Check if wallet was previously connected
        this.checkExistingConnection();
    }

    private getEthereum(): any {
        return (window as any).ethereum;
    }

    private hasWallet(): boolean {
        return typeof window !== 'undefined' && !!(window as any).ethereum;
    }

    private async checkExistingConnection() {
        if (!this.hasWallet()) return;
        
        try {
            const ethereum = this.getEthereum();
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length > 0) {
                await this.connect();
            }
        } catch (error) {
            console.log('[Web3] No existing connection');
        }
    }

    private updateState(updates: Partial<WalletState>) {
        this.currentState = { ...this.currentState, ...updates };
        this.listeners.forEach(listener => listener(this.currentState));
    }

    subscribe(listener: (state: WalletState) => void): () => void {
        this.listeners.add(listener);
        // Immediately call with current state
        listener(this.currentState);
        
        return () => {
            this.listeners.delete(listener);
        };
    }

    getState(): WalletState {
        return this.currentState;
    }

    async connect(): Promise<WalletState> {
        if (!this.hasWallet()) {
            this.updateState({ 
                error: 'No wallet detected. Please install MetaMask or Rabby Wallet.' 
            });
            return this.currentState;
        }

        this.updateState({ isConnecting: true, error: null });

        try {
            const ethereum = this.getEthereum();
            
            // Request account access
            const accounts = await ethereum.request({ 
                method: 'eth_requestAccounts' 
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            const address = accounts[0];
            
            // Create provider
            this.provider = new ethers.BrowserProvider(ethereum);
            this.signer = await this.provider.getSigner();
            
            // Get chain ID
            const network = await this.provider.getNetwork();
            const chainId = Number(network.chainId);
            
            // Get balance
            const balanceWei = await this.provider.getBalance(address);
            const balance = ethers.formatEther(balanceWei);

            this.updateState({
                address,
                chainId,
                balance,
                isConnected: true,
                isConnecting: false,
                error: null,
            });

            // Setup event listeners
            this.setupEventListeners();

            return this.currentState;
        } catch (error: any) {
            console.error('[Web3] Connection error:', error);
            this.updateState({
                isConnecting: false,
                error: error.message || 'Failed to connect wallet',
            });
            return this.currentState;
        }
    }

    async disconnect(): Promise<void> {
        // Note: Most wallets don't support programmatic disconnect
        // We just clear our local state
        this.updateState({
            address: null,
            chainId: null,
            balance: '0',
            isConnected: false,
            isConnecting: false,
            error: null,
        });
        
        this.provider = null;
        this.signer = null;
        
        // Remove event listeners
        const ethereum = this.getEthereum();
        if (ethereum) {
            ethereum.removeAllListeners('accountsChanged');
            ethereum.removeAllListeners('chainChanged');
        }
    }

    private setupEventListeners() {
        const ethereum = this.getEthereum();
        if (!ethereum) return;

        // Account changed
        ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
                // User disconnected
                this.disconnect();
            } else {
                // Switched to different account
                this.connect();
            }
        });

        // Chain changed
        ethereum.on('chainChanged', (chainIdHex: string) => {
            const chainId = parseInt(chainIdHex, 16);
            this.updateState({ chainId });
            // Refresh balance on new chain
            this.refreshBalance();
        });
    }

    async refreshBalance(): Promise<string> {
        if (!this.provider || !this.currentState.address) {
            return '0';
        }

        try {
            const balanceWei = await this.provider.getBalance(this.currentState.address);
            const balance = ethers.formatEther(balanceWei);
            this.updateState({ balance });
            return balance;
        } catch (error) {
            console.error('[Web3] Failed to refresh balance:', error);
            return this.currentState.balance;
        }
    }

    async getTokenBalance(tokenAddress: string): Promise<TokenBalance | null> {
        if (!this.provider || !this.currentState.address) {
            return null;
        }

        try {
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            
            const [rawBalance, decimals, symbol, name] = await Promise.all([
                contract.balanceOf(this.currentState.address),
                contract.decimals(),
                contract.symbol(),
                contract.name(),
            ]);

            const balance = ethers.formatUnits(rawBalance, decimals);

            return {
                symbol,
                name,
                balance,
                rawBalance,
                decimals,
                address: tokenAddress,
            };
        } catch (error) {
            console.error('[Web3] Failed to get token balance:', error);
            return null;
        }
    }

    async switchChain(chainId: number): Promise<boolean> {
        if (!this.hasWallet()) return false;

        const ethereum = this.getEthereum();
        const chainIdHex = '0x' + chainId.toString(16);

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
            return true;
        } catch (switchError: any) {
            // Chain not added, try to add it
            if (switchError.code === 4902) {
                return this.addChain(chainId);
            }
            console.error('[Web3] Failed to switch chain:', switchError);
            return false;
        }
    }

    private async addChain(chainId: number): Promise<boolean> {
        const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
        if (!chain) return false;

        const ethereum = this.getEthereum();
        const chainIdHex = '0x' + chainId.toString(16);

        try {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: chainIdHex,
                    chainName: chain.name,
                    rpcUrls: [chain.rpc],
                    nativeCurrency: {
                        name: chain.symbol,
                        symbol: chain.symbol,
                        decimals: 18,
                    },
                }],
            });
            return true;
        } catch (error) {
            console.error('[Web3] Failed to add chain:', error);
            return false;
        }
    }

    async signMessage(message: string): Promise<string | null> {
        if (!this.signer) {
            throw new Error('Wallet not connected');
        }

        try {
            const signature = await this.signer.signMessage(message);
            return signature;
        } catch (error: any) {
            console.error('[Web3] Failed to sign message:', error);
            throw error;
        }
    }

    formatAddress(address: string, chars: number = 4): string {
        if (!address) return '';
        return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
    }

    getExplorerUrl(chainId: number, address: string): string {
        const explorers: Record<number, string> = {
            1: 'https://etherscan.io',
            56: 'https://bscscan.com',
            137: 'https://polygonscan.com',
            42161: 'https://arbiscan.io',
            10: 'https://optimistic.etherscan.io',
            8453: 'https://basescan.org',
            43114: 'https://snowtrace.io',
            59144: 'https://lineascan.build',
        };
        
        const base = explorers[chainId] || explorers[1];
        return `${base}/address/${address}`;
    }
}

// Singleton instance
export const web3Service = new Web3Service();
export default web3Service;
