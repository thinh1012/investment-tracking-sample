import { useState, useEffect } from 'react';
import { fetchPrice, fetchHyperliquidPrices } from '../services/priceService';
import { PriceDataService, AssetOverrideService } from '../services/db';

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
    const [assetOverrides, setAssetOverrides] = useState<Record<string, { symbol: string; avgBuyPrice?: number; rewardTokens?: string[] }>>({});

    // Load Manual Prices & Overrides
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedPrices = await PriceDataService.getManualPrices();
                setManualPrices(storedPrices);

                const storedOverrides = await AssetOverrideService.getAll();
                setAssetOverrides(storedOverrides);
            } catch (e) {
                console.error("Failed to load price data", e);
            }
        };
        loadData();
    }, []);

    const refreshPrices = async (force: boolean = false) => {
        // Get Watchlist Symbols
        let watchlistSymbols: string[] = [];
        const watchlist = safeJsonParse(localStorage.getItem('investment_tracker_watchlist'), []);
        if (Array.isArray(watchlist)) {
            watchlistSymbols = watchlist.map((item: any) => item.symbol);
        }

        const uniqueSymbols = Array.from(new Set([
            ...activeSymbols,
            ...watchlistSymbols
        ]))
            .flatMap(s => s.includes('/') ? s.split('/') : [s]) // Split pairs
            .filter(s => !s.toUpperCase().startsWith('LP'));

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
            // (Unless it's a .D metric which might legitimately have no change data yet, but safe to retry once)
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
                const hlPrices = await fetchHyperliquidPrices(); // Returns Record<string, PriceData>
                Object.entries(hlPrices).forEach(([sym, data]) => {
                    newPrices[sym] = data.price;
                    if (data.change24h !== undefined) newChanges[sym] = data.change24h ?? null;
                    if (data.volume24h !== undefined) newVolumes[sym] = data.volume24h ?? null;

                    newCacheUpdates[sym] = {
                        price: data.price,
                        change24h: data.change24h,
                        volume24h: data.volume24h,
                        updatedAt: now
                    };
                });
            } catch (e) {
                console.warn("Failed to fetch Hyperliquid prices:", e);
            }
        }

        // 2. Identify still missing (HL might not cover all)
        const missingSymbols = symbolsToFetch.filter(sym => {
            const foundInNew = newPrices[sym.toUpperCase()] !== undefined || newPrices[sym] !== undefined;
            return !foundInNew;
        });

        // Update state with HL results immediately
        setPrices(prev => ({ ...prev, ...newPrices }));
        setPriceChanges(prev => ({ ...prev, ...newChanges }));
        setPriceVolumes(prev => ({ ...prev, ...newVolumes }));

        // 3. Sequential Fetch for missing
        for (const symbol of missingSymbols) {
            if (manualPrices[symbol]) continue;

            const data = await fetchPrice(symbol, { skipHyperliquid: true }); // Returns PriceData | null
            if (data !== null) {
                const change = data.change24h ?? null;
                const volume = data.volume24h ?? null;

                newCacheUpdates[symbol] = { price: data.price, change24h: change, volume24h: volume, updatedAt: now };

                setPrices(prev => ({ ...prev, [symbol]: data.price }));
                if (data.change24h !== undefined) {
                    setPriceChanges(prev => ({ ...prev, [symbol]: change }));
                }
                if (data.volume24h !== undefined) {
                    setPriceVolumes(prev => ({ ...prev, [symbol]: volume }));
                }
            }
            await new Promise(resolve => setTimeout(resolve, 1200));
        }

        // Save updated cache
        // We need to merge carefully into current cache
        const finalCache = { ...priceCache, ...newCacheUpdates };
        localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(finalCache));
    };

    // Auto Refresh Loop
    useEffect(() => {
        refreshPrices(false);
        const intervalId = setInterval(() => {
            refreshPrices(false);
        }, 15 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, [activeSymbols.join(','), manualPrices]); // Re-run if symbols change

    const updateAssetPrice = async (symbol: string, price: number) => {
        setManualPrices(prev => ({ ...prev, [symbol]: price }));
        await PriceDataService.saveManualPrice(symbol, price);
    };

    const updateAssetOverride = async (symbol: string, overrides: { avgBuyPrice?: number; rewardTokens?: string[] }) => {
        await AssetOverrideService.save(symbol, overrides);
        setAssetOverrides(prev => {
            const existing = prev[symbol] || { symbol };
            return { ...prev, [symbol]: { ...existing, ...overrides } };
        });
    };

    return {
        prices: { ...prices, ...manualPrices },
        priceChanges,
        priceVolumes,
        manualPrices,
        assetOverrides,
        refreshPrices,
        updateAssetPrice,
        updateAssetOverride
    };
};
