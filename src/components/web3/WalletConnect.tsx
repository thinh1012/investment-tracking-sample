/**
 * WalletConnect Component - Connect to Web3 wallets
 */

import React, { useState } from 'react';
import { Wallet, Loader2, AlertCircle, ExternalLink, ChevronDown, LogOut, Copy, Check } from 'lucide-react';
import { useWeb3 } from '../../hooks/useWeb3';
import { SUPPORTED_CHAINS } from '../../services/web3/Web3Service';

interface WalletConnectProps {
    variant?: 'button' | 'card';
    showBalance?: boolean;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ 
    variant = 'button',
    showBalance = true 
}) => {
    const {
        address,
        chainId,
        balance,
        isConnected,
        isConnecting,
        error,
        chainName,
        connect,
        disconnect,
        refreshBalance,
        switchChain,
        formatAddress,
        getExplorerUrl,
    } = useWeb3();

    const [showDropdown, setShowDropdown] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showChainSelector, setShowChainSelector] = useState(false);

    const handleCopy = async () => {
        if (!address) return;
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSwitchChain = async (newChainId: number) => {
        await switchChain(newChainId);
        setShowChainSelector(false);
    };

    // Card variant for settings/dashboard
    if (variant === 'card') {
        return (
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7b3fe4] to-[#3b82f6] rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Web3 Wallet</h3>
                        <p className="text-sm text-[#888888]">
                            {isConnected ? 'Connected to ' + chainName : 'Connect your wallet'}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-[#ef4444] text-sm mb-4 p-3 bg-[#ef4444]/10 rounded-lg">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {!isConnected ? (
                    <button
                        onClick={connect}
                        disabled={isConnecting}
                        className="w-full bg-[#7b3fe4] hover:bg-[#5a2db8] text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Wallet className="w-5 h-5" />
                                Connect Wallet
                            </>
                        )}
                    </button>
                ) : (
                    <div className="space-y-4">
                        {/* Address & Actions */}
                        <div className="flex items-center justify-between p-3 bg-[#252525] rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#7b3fe4]/20 rounded-full flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-[#7b3fe4]" />
                                </div>
                                <span className="font-mono text-white">
                                    {formatAddress(address!, 6)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-[#22c55e]" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-[#888888]" />
                                    )}
                                </button>
                                <a
                                    href={getExplorerUrl(address!)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                    title="View on explorer"
                                >
                                    <ExternalLink className="w-4 h-4 text-[#888888]" />
                                </a>
                            </div>
                        </div>

                        {/* Balance */}
                        {showBalance && (
                            <div className="flex items-center justify-between p-3 bg-[#252525] rounded-lg">
                                <span className="text-[#888888]">Balance</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">
                                        {parseFloat(balance).toFixed(4)} {SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.symbol || 'ETH'}
                                    </span>
                                    <button
                                        onClick={refreshBalance}
                                        className="p-1 hover:bg-white/5 rounded transition-colors"
                                    >
                                        <Loader2 className="w-4 h-4 text-[#888888]" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Chain Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowChainSelector(!showChainSelector)}
                                className="w-full flex items-center justify-between p-3 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                            >
                                <span className="text-[#888888]">Network</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white">{chainName}</span>
                                    <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform ${showChainSelector ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {showChainSelector && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl overflow-hidden z-50 shadow-xl">
                                    {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => (
                                        <button
                                            key={id}
                                            onClick={() => handleSwitchChain(Number(id))}
                                            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#252525] transition-colors ${
                                                chainId === Number(id) ? 'bg-[#7b3fe4]/10' : ''
                                            }`}
                                        >
                                            <span className="text-white">{chain.name}</span>
                                            {chainId === Number(id) && (
                                                <div className="w-2 h-2 bg-[#7b3fe4] rounded-full" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Disconnect */}
                        <button
                            onClick={disconnect}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/10 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Button variant for header/navbar
    if (!isConnected) {
        return (
            <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-[#7b3fe4] hover:bg-[#5a2db8] text-white font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 text-sm"
            >
                {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Wallet className="w-4 h-4" />
                )}
                Connect
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-all"
            >
                <div className="w-6 h-6 bg-gradient-to-br from-[#7b3fe4] to-[#3b82f6] rounded-full flex items-center justify-center">
                    <Wallet className="w-3 h-3 text-white" />
                </div>
                <span className="font-mono text-sm">{formatAddress(address!, 4)}</span>
                <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl overflow-hidden z-50 shadow-xl">
                    {/* Balance */}
                    {showBalance && (
                        <div className="px-4 py-3 border-b border-[#2a2a2a]">
                            <p className="text-xs text-[#888888] mb-1">Balance</p>
                            <p className="font-semibold text-white">
                                {parseFloat(balance).toFixed(4)} {SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.symbol || 'ETH'}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-2">
                        <button
                            onClick={() => {
                                handleCopy();
                                setShowDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#252525] rounded-lg transition-colors text-left"
                        >
                            {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4 text-[#888888]" />}
                            <span className="text-white text-sm">{copied ? 'Copied!' : 'Copy Address'}</span>
                        </button>

                        <a
                            href={getExplorerUrl(address!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#252525] rounded-lg transition-colors text-left"
                        >
                            <ExternalLink className="w-4 h-4 text-[#888888]" />
                            <span className="text-white text-sm">View on Explorer</span>
                        </a>

                        <button
                            onClick={() => {
                                disconnect();
                                setShowDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#ef4444]/10 text-[#ef4444] rounded-lg transition-colors text-left"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Disconnect</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletConnect;
