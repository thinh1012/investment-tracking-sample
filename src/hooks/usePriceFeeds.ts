import { useState, useEffect, useMemo, useCallback } from 'react';
// ... (omitting middle parts for clarity in replace_file_content tool usage, will provide full replacement range)
import { fetchHyperliquidPrices, fetchCryptoPricesCC } from '../services/PriceService';
import { PriceDataService, AssetOverrideService } from '../services/database/OtherServices';

const PRICE_CACHE_KEY = 'investment_tracker_price_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes

interface PriceCacheItem {
    price: number;
    updatedAt: number;
    change24h?: number | null;
    volume24h?: number | null;
}

const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn("Failed to parse JSON:", e);
        return fallback;
    }
};

export const usePriceFeeds = (activeSymbols: string[]) => {
    const [prices, setPrices] = useState<Record<string, number>>(() => {
        // Load initial prices from cache
        const cached = safeJsonParse(localStorage.getItem(PRICE_CACHE_KEY), {});
        try {
            const pricesOnly: Record<string, number> = {};
            Object.entries(cached).forEach(([key, val]: [string, any]) => {
                // Compatible with old cache (price: number) or new cache (price: number, change: number)
                if (val && typeof val.price === 'number') {
                    pricesOnly[key] = val.price;
                }
            });
            return pricesOnly;
        } catch (e) {
            return {};
        }
    });

    // New State for 24h Changes
    const [priceChanges, setPriceChanges] = useState<Record<string, number | null>>({});
    // New State for 24h Volume
    const [priceVolumes, setPriceVolumes] = useState<Record<string, number | null>>({});

    const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
    const [manualPriceSources, setManualPriceSources] = useState<Record<string, string>>({});
    const [assetOverrides, setAssetOverrides] = useState<Record<string, { symbol: string; avgBuyPrice?: number; rewardTokens?: string[] }>>({});

    // Load Manual Prices & Overrides
    useEffect(() => {
        const loadData = async () => {
            try {
                const { prices: storedPrices, sources: storedSources } = await PriceDataService.getManualPrices();
                setManualPrices(storedPrices);
                setManualPriceSources(storedSources);

                const storedOverrides = await AssetOverrideService.getAll();
                setAssetOverrides(storedOverrides);
            } catch (e) {
                console.error("Failed to load price data", e);
            }
        };
        loadData();
    }, []);

    const refreshPrices = useCallback(async (force: boolean = false) => {
        const isLiquidityPool = (s: string) => {
            const u = s.toUpperCase();
            return (
                u.startsWith('LP') ||
                u.includes(' ') ||        // e.g. "HYPE-USDC 1"
                u.includes('-') ||        // e.g. "SOL-USDC", "SUI-USDC-2"
                u.includes('PRJX') ||
                u.includes('SWAP') ||
                u.includes('MMT')
            );
        };

        const uniqueSymbols = Array.from(new Set(activeSymbols))
            .flatMap(s => s.includes('/') ? s.split('/') : [s])
            .filter(s => !isLiquidityPool(s));

        // Load Cache
        let priceCache: Record<string, any> = safeJsonParse(localStorage.getItem(PRICE_CACHE_KEY), {});
        const now = Date.now();

        const symbolsToFetch = uniqueSymbols.filter(sym => {
            if (force) return true;
            if (manualPrices[sym]) return false; // Never auto-fetch manual overridden prices

            const cachedItem = priceCache[sym];
            if (!cachedItem) return true; // Not in cache
            if (now - cachedItem.updatedAt > CACHE_DURATION) return true; // Expired

            // Re-fetch if we are missing 24h change data (legacy cache upgrade)
            if (cachedItem.change24h === undefined) return true;
            if (cachedItem.volume24h === undefined) return true; // Missing Volume

            return false; // Valid in cache
        });

        // Initialize state changes
        const newPrices: Record<string, number> = {};
        const newChanges: Record<string, number | null> = {};
        const newVolumes: Record<string, number | null> = {};
        const newCacheUpdates: Record<string, any> = {};

        // 1. Bulk Fetch Hyperliquid
        if (symbolsToFetch.length > 0) {
            try {
                const hlPrices = await fetchHyperliquidPrices();
                Object.entries(hlPrices).forEach(([sym, data]) => {
                    newPrices[sym] = data.price;
                    if (data.change24h !== undefined) newChanges[sym] = data.change24h ?? null;
                    if (data.volume24h !== undefined) newVolumes[sym] = data.volume24h ?? null;
                    newCacheUpdates[sym] = { price: data.price, change24h: data.change24h, volume24h: data.volume24h, updatedAt: now };
                });
            } catch (e) { console.warn("[PriceFeeds] Hyperliquid fetch failed", e); }
        }

        // 2. Fallback: cryptoprices.cc for tokens Hyperliquid doesn't cover
        const missingAfterHL = symbolsToFetch.filter(sym => !newPrices[sym.toUpperCase()] && !newPrices[sym]);
        if (missingAfterHL.length > 0) {
            try {
                const ccPrices = await fetchCryptoPricesCC(missingAfterHL);
                Object.entries(ccPrices).forEach(([sym, data]) => {
                    newPrices[sym] = data.price;
                    newChanges[sym] = null;
                    newVolumes[sym] = null;
                    newCacheUpdates[sym] = { price: data.price, change24h: null, volume24h: null, updatedAt: now };
                });
            } catch (e) { console.warn("[PriceFeeds] cryptoprices.cc fetch failed", e); }
        }

        // Final State Update
        setPrices(prev => ({ ...prev, ...newPrices }));
        setPriceChanges(prev => ({ ...prev, ...newChanges }));
        setPriceVolumes(prev => ({ ...prev, ...newVolumes }));

        const finalCache = { ...priceCache, ...newCacheUpdates };
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(finalCache));
    }, [activeSymbols, manualPrices]);

    // Auto Refresh Loop
    useEffect(() => {
        refreshPrices(false);
        const intervalId = setInterval(() => {
            refreshPrices(false);
        }, 15 * 60 * 1000);

        const handleOracleUpdate = async () => {
            const { prices: storedPrices, sources: storedSources } = await PriceDataService.getManualPrices();
            setManualPrices(storedPrices);
            setManualPriceSources(storedSources);
        };
        window.addEventListener('oracle_prices_updated', handleOracleUpdate);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('oracle_prices_updated', handleOracleUpdate);
        };
    }, [refreshPrices]);

    const updateAssetPrice = useCallback(async (symbol: string, price: number) => {
        setManualPrices(prev => ({ ...prev, [symbol]: price }));
        await PriceDataService.saveManualPrice(symbol, price);
    }, []);

    const clearManualPrice = useCallback(async (symbol: string) => {
        setManualPrices(prev => { const next = { ...prev }; delete next[symbol]; return next; });
        setManualPriceSources(prev => { const next = { ...prev }; delete next[symbol]; return next; });
        await PriceDataService.deleteManualPrice(symbol);
    }, []);

    const updateAssetOverride = useCallback(async (symbol: string, overrides: { avgBuyPrice?: number; rewardTokens?: string[] }) => {
        await AssetOverrideService.save(symbol, overrides);
        setAssetOverrides(prev => {
            const existing = prev[symbol] || { symbol };
            return { ...prev, [symbol]: { ...existing, ...overrides } };
        });
    }, []);

    const memoizedPrices = useMemo(() => ({ ...prices, ...manualPrices }), [prices, manualPrices]);
    const memoizedAssetOverrides = useMemo(() => assetOverrides, [assetOverrides]);

    return {
        prices: memoizedPrices,
        priceChanges,
        priceVolumes,
        manualPrices,
        manualPriceSources,
        assetOverrides: memoizedAssetOverrides,
        refreshPrices,
        updateAssetPrice,
        clearManualPrice,
        updateAssetOverride
    };
};
