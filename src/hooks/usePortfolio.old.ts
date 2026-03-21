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
    const activeSymbols = Array.from(new Set([
        ...transactions.map(t => t.assetSymbol),
        ...picks.map(p => p.symbol)
    ]));

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
        return calculateAssets(transactions, prices, assetOverrides);
    };

    const getPortfolioHistory = () => {
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
        priceVolumes
    };
};
