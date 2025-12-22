import { useEffect } from 'react';
import { useTransactionData } from './useTransactionData';
import { usePriceFeeds } from './usePriceFeeds';
import { useMarketPicks } from './useMarketPicks';
import { Asset } from '../types';
import { calculateAssets, calculatePortfolioHistory } from '../domain/portfolioCalculator';
import { historicalPriceService } from '../services/historicalPriceService';

export const usePortfolio = () => {
    // 1. Get Transactions
    const {
        transactions,
        isLoading,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        importTransactions
    } = useTransactionData();

    const { picks } = useMarketPicks();

    // 2. Compute Active Symbols for Price Fetching
    // Added robustness checks: handle nulls and filter for valid strings
    const rawSymbols = [
        ...(transactions || []).map(t => t.assetSymbol),
        ...(picks || []).map(p => p.symbol)
    ];
    const activeSymbols = Array.from(new Set(rawSymbols.filter(s => typeof s === 'string' && s.length > 0)));

    // 3. Trigger Historical Price Sync (Exclude LPs, Stablecoins, and Indicators - but ALWAYS include Market Picks)
    useEffect(() => {
        const STABLE_COINS = ['USDT', 'USDC', 'FDUSD', 'DAI', 'USDS', 'PYUSD'];

        const tokenSymbols = activeSymbols.filter(sym => {
            const s = sym.toUpperCase();

            // ALWAYS include if it's in market picks
            const isInPicks = picks.some(p => p.symbol === s);
            if (isInPicks) return true;

            // 1. Explicit Stablecoins
            if (STABLE_COINS.includes(s)) return false;
            // 2. Stricter LP detection (spaces, hyphens, slashes or keywords)
            const hasLpChars = s.includes(' ') || s.includes('-') || s.includes('/');
            const hasLpKeywords = s.includes('LP') || s.includes('POOL') || s.includes('SWAP');
            if (hasLpChars || hasLpKeywords) return false;
            // 3. Exclude market indicators (.D)
            if (s.endsWith('.D')) return false;

            return true;
        });

        if (tokenSymbols.length > 0) {
            historicalPriceService.syncHistoricalPrices(tokenSymbols);
        }
    }, [activeSymbols.length, picks.length]);

    // 4. Get Prices
    const {
        prices,
        priceChanges,
        priceVolumes,
        refreshPrices,
        updateAssetPrice,
        updateAssetOverride,
        manualPrices,
        assetOverrides
    } = usePriceFeeds(activeSymbols);

    // 4. Portfolio Calculations (Delegated to Domain Layer)
    const getAssets = (): Asset[] => {
        // Guard against initial null states
        if (!transactions || !prices) return [];
        return calculateAssets(transactions, prices, assetOverrides);
    };

    const getPortfolioHistory = () => {
        if (!transactions || !prices) return { invested: [], earnings: [] };
        return calculatePortfolioHistory(transactions, prices);
    };

    return {
        transactions,
        getAssets,
        getPortfolioHistory,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,
        updateAssetPrice,
        updateAssetOverride,
        refreshPrices,
        prices,
        priceChanges,
        priceVolumes,
        assetOverrides,
        manualPrices
    };
};
