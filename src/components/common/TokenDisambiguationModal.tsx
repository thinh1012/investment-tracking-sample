/**
 * [TOKEN_DISAMBIGUATION_MODAL]
 * Modal component for resolving ambiguous token symbols.
 * Shows when Auto-Scout detects a symbol that could refer to multiple tokens.
 * 
 * User selects the correct token, choice is saved to aliases for future use.
 */

import React, { useState } from 'react';
import { AmbiguousTokenOption, ScoutAliasService } from '../../services/scout/ScoutAliasService';

interface TokenDisambiguationModalProps {
    isOpen: boolean;
    symbol: string;
    options: AmbiguousTokenOption[];
    onSelect: (choice: AmbiguousTokenOption) => void;
    onSkip: () => void;
    onClose: () => void;
}

// Chain icons mapping
const CHAIN_COLORS: Record<string, string> = {
    ethereum: 'bg-indigo-500',
    solana: 'bg-purple-500',
    base: 'bg-blue-500',
    arbitrum: 'bg-cyan-500',
    optimism: 'bg-red-500',
    polygon: 'bg-violet-500',
    hyperliquid: 'bg-emerald-500',
    sei: 'bg-indigo-500',
    default: 'bg-slate-500'
};

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
    'DEX': '🔄',
    'DEX Aggregator': '🔀',
    'L2': '⚡',
    'Oracle': '🔮',
    'Gaming': '🎮',
    'NFT': '🖼️',
    'RWA': '🏦',
    'Lending': '💰',
    'Staking': '🔒',
    'default': '🪙'
};

export const TokenDisambiguationModal: React.FC<TokenDisambiguationModalProps> = ({
    isOpen,
    symbol,
    options,
    onSelect,
    onSkip,
    onClose
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSelect = async (option: AmbiguousTokenOption, index: number) => {
        setSelectedIndex(index);
        setIsLoading(true);

        try {
            // Save the user's choice to aliases
            await ScoutAliasService.saveUserChoice(symbol, option);
            onSelect(option);
        } catch (error) {
            console.error('[DISAMBIGUATION] Failed to save choice:', error);
            // Still proceed with selection even if save fails
            onSelect(option);
        } finally {
            setIsLoading(false);
        }
    };

    const getChainColor = (chain: string) => {
        return CHAIN_COLORS[chain.toLowerCase()] || CHAIN_COLORS.default;
    };

    const getCategoryIcon = (category: string) => {
        return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-2xl">🔍</span>
                        Which {symbol} token did you buy?
                    </h2>
                    <p className="text-cyan-100 text-sm mt-1">
                        Multiple tokens use the symbol "{symbol}". Please select the correct one.
                    </p>
                </div>

                {/* Options */}
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {options.map((option, index) => (
                        <button
                            key={option.coingeckoId}
                            onClick={() => handleSelect(option, index)}
                            disabled={isLoading}
                            className={`
                                w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                                ${selectedIndex === index
                                    ? 'border-cyan-400 bg-cyan-900/30 ring-2 ring-cyan-400/50'
                                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500 hover:bg-slate-700'
                                }
                                ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                            `}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Token Name with Category Icon */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{getCategoryIcon(option.category)}</span>
                                        <h3 className="text-lg font-semibold text-white">
                                            {option.name}
                                        </h3>
                                    </div>

                                    {/* Description */}
                                    <p className="text-slate-400 text-sm mt-1">
                                        {option.description}
                                    </p>

                                    {/* Metadata Tags */}
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {/* Chain Badge */}
                                        <span className={`
                                            px-2 py-0.5 rounded-full text-xs font-medium text-white
                                            ${getChainColor(option.chain)}
                                        `}>
                                            {option.chain.charAt(0).toUpperCase() + option.chain.slice(1)}
                                        </span>

                                        {/* Category Badge */}
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-600 text-slate-200">
                                            {option.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Selection Indicator */}
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 mt-1
                                    ${selectedIndex === index
                                        ? 'border-cyan-400 bg-cyan-400'
                                        : 'border-slate-500'
                                    }
                                `}>
                                    {selectedIndex === index && (
                                        <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* CoinGecko ID (subtle) */}
                            <div className="text-xs text-slate-500 mt-2 font-mono">
                                coingecko: {option.coingeckoId}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 px-6 py-4 flex justify-between items-center bg-slate-800/80">
                    <button
                        onClick={onSkip}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                    >
                        Skip Auto-Scout for now
                    </button>

                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving choice...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TokenDisambiguationModal;
