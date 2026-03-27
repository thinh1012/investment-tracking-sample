import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTransactionData } from './useTransactionData';
import { usePriceFeeds } from './usePriceFeeds';
import { Asset, Transaction } from '../types';
import { MarketPick } from '../services/database/types';
import { calculateAssets, calculatePortfolioHistory } from '../domain/portfolioCalculator';
import { historicalPriceService } from '../services/HistoricalPriceService';

export const usePortfolio = (picks: MarketPick[] = [], watchlistSymbols: string[] = []) => {
    // 1. Get Transactions
    const {
        transactions,
        isLoading,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        importTransactions
    } = useTransactionData();

    // 2. Compute Active Symbols for Price Fetching
    const activeSymbols = useMemo(() => {
        const rawSymbols = [
            ...(transactions || []).map((t: Transaction) => t.assetSymbol),
            ...(picks || []).map(p => p.symbol),
            ...(watchlistSymbols || [])
        ];

        // Include tokens from INTEREST transactions (earnings)
        const earningsSymbols = (transactions || [])
            .filter((t: Transaction) => t.type === 'INTEREST')
            .map((t: Transaction) => t.assetSymbol);

        const allSymbols = [...rawSymbols, ...earningsSymbols]
            .filter(s => typeof s === 'string' && s.length > 0)
            .map(s => s.trim().toUpperCase())
            .filter(s => !s.endsWith('.D')); // skip dominance metrics — no price API supports them

        // only fetch prices for portfolio transactions, not watchlist picks
        const transactionSymbols = (transactions || [])
            .map((t: Transaction) => t.assetSymbol.trim().toUpperCase())
            .filter(s => !s.endsWith('.D'));

        return Array.from(new Set(transactionSymbols));
    }, [transactions, picks, watchlistSymbols]);

    // 3. Trigger Historical Price Sync
    useEffect(() => {
        const STABLE_COINS = ['USDT', 'USDC', 'FDUSD', 'DAI', 'USDS', 'PYUSD'];
        const tokenSymbols = activeSymbols.filter(sym => {
            const s = sym.toUpperCase();
            if (picks.some(p => p.symbol === s)) return true;
            if (STABLE_COINS.includes(s)) return false;
            const hasLpChars = s.includes(' ') || s.includes('-') || s.includes('/');
            const hasLpKeywords = s.includes('LP') || s.includes('POOL') || s.includes('SWAP');
            if (hasLpChars || hasLpKeywords) return false;
            if (s.endsWith('.D')) return false;
            return true;
        });
        if (tokenSymbols.length > 0) {
            historicalPriceService.syncHistoricalPrices(tokenSymbols);
        }
    }, [activeSymbols, picks]);

    // 4. Get Prices
    const {
        prices,
        priceChanges,
        priceVolumes,
        refreshPrices,
        updateAssetPrice,
        clearManualPrice,
        updateAssetOverride,
        manualPrices,
        manualPriceSources,
        assetOverrides
    } = usePriceFeeds(activeSymbols);

    // 5. Worker & State Logic (Refactored for Stability)
    const [workerAssets, setWorkerAssets] = useState<Asset[] | null>(null);
    const [workerHistory, setWorkerHistory] = useState<any | null>(null);
    const workerRef = React.useRef<Worker | null>(null);

    // Synchronous derivation for immediate response (No setState used here)
    const syncAssets = useMemo(() => {
        if (!transactions || !prices) return [];
        return calculateAssets(transactions, prices, assetOverrides, manualPriceSources);
    }, [transactions, prices, assetOverrides, manualPriceSources]);

    const syncHistory = useMemo(() => {
        if (!transactions || !prices) return { invested: [], earnings: [] };
        return calculatePortfolioHistory(transactions, prices);
    }, [transactions, prices, assetOverrides]);

    // Worker effect for background refinement
    useEffect(() => {
        if (!transactions || !prices || Object.keys(prices).length === 0) return;

        if (!workerRef.current) {
            try {
                const workerUrl = new URL('../workers/portfolio.worker.ts', import.meta.url);
                workerRef.current = new Worker(workerUrl, { type: 'module' });

                workerRef.current.onmessage = (e) => {
                    if (e.data.type === 'CALCULATE_SUCCESS') {
                        setWorkerAssets(e.data.payload.assets);
                        setWorkerHistory(e.data.payload.history);
                    }
                };
            } catch (e) {
                console.error('[PortfolioWorker] Init failed', e);
            }
        }

        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'CALCULATE_PORTFOLIO',
                payload: { transactions, prices, assetOverrides, manualPriceSources }
            });
        }
    }, [transactions, prices, assetOverrides, manualPriceSources]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    const getAssets = useCallback((): Asset[] => workerAssets || syncAssets, [workerAssets, syncAssets]);
    const getPortfolioHistory = useCallback(() => workerHistory || syncHistory, [workerHistory, syncHistory]);

    return {
        transactions,
        getAssets,
        getPortfolioHistory,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importTransactions,
        updateAssetPrice,
        clearManualPrice,
        updateAssetOverride,
        refreshPrices,
        prices,
        priceChanges,
        priceVolumes,
        assetOverrides,
        manualPrices,
        manualPriceSources
    };
};
