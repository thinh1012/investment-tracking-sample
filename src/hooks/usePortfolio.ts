import { useTransactionData } from './useTransactionData';
import { usePriceFeeds } from './usePriceFeeds';
import { useMarketPicks } from './useMarketPicks';
import { Asset } from '../types';
import { calculateAssets, calculatePortfolioHistory } from '../domain/portfolioCalculator';

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

    // 3. Get Prices
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
