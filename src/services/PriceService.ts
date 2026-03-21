import { globalMarketService } from './GlobalMarketService';

const RESOLVED_ID_CACHE_KEY = 'investment_tracker_coingecko_ids';

// Helper to resolve multiple IDs at once with parallel execution
export const resolveCoinGeckoIds = async (symbols: string[]): Promise<Record<string, string>> => {
    const results: Record<string, string> = {};
    const BATCH_SIZE = 5; // Resolve in small batches to respect rate limits

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const resolvedBatch = await Promise.all(batch.map(async (symbol) => ({
            symbol: symbol.toUpperCase(),
            id: await resolveCoinGeckoId(symbol)
        })));

        resolvedBatch.forEach(item => {
            results[item.symbol] = item.id;
        });
    }

    return results;
};

const resolveCoinGeckoId = async (symbol: string): Promise<string> => {
    const upperSymbol = symbol.toUpperCase();
    const lowerSymbol = symbol.toLowerCase();

    // [PHASE 97 + 22] Fast exclusion for metrics and LPs
    // Skip price lookups for:
    // - Metrics ending in .D (e.g., USDC.D, USDT.D)
    // - LP tokens starting with LP
    // - Symbols with spaces (e.g., "PUMP-HYPE PRJX 3", "SUI-USDC 2")
    // - Symbols containing PRJX, SWAP, MMT (LP position indicators)
    // - Symbols ending with numbers/dates (e.g., "SUI-USDC 2", "HYPE-USDC 1")
    if (
        upperSymbol.endsWith('.D') ||
        upperSymbol.startsWith('LP') ||
        upperSymbol.includes(' ') ||
        upperSymbol.includes('PRJX') ||
        upperSymbol.includes('SWAP') ||
        upperSymbol.includes('MMT') ||
        /\s\d+$/.test(upperSymbol) || // Ends with space + number
        /-\d+$/.test(upperSymbol)     // Ends with dash + number
    ) {
        // Silently skip - these are LP positions, not tradeable assets
        return lowerSymbol;
    }

    // 1. Hardcoded "Golden Mapping" (Fallback for common assets)
    const COINGECKO_ID_MAP: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'SUI': 'sui',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'CVX': 'convex-finance',
        'ARB': 'arbitrum',
        'OP': 'optimism',
        'LDO': 'lido-dao',
        'LINK': 'chainlink',
        'UNI': 'uniswap',
        'AAVE': 'aave',
        'MKR': 'maker',
        'SNX': 'havven',
        'TIA': 'celestia',
        'JUP': 'jupiter-exchange-solana',
        'PYTH': 'pyth-network',
        'ENA': 'ethena',
        'W': 'wormhole',
        'RAY': 'raydium',
        'JTO': 'jito-governance-token',
        'STRK': 'starknet',
        'MANTA': 'manta-network',
        'ALT': 'altlayer',
        'DYM': 'dymension',
        'METIS': 'metis-token',
        'IMX': 'immutable-x',
        'NEAR': 'near',
        'AVAX': 'avalanche-2',
        'DOT': 'polkadot',
        'MATIC': 'matic-network',
        'POL': 'polygon-ecosystem-token'
    };
    if (COINGECKO_ID_MAP[upperSymbol]) return COINGECKO_ID_MAP[upperSymbol];

    // 2. Local Storage Cache (Fast)
    try {
        const cached = localStorage.getItem(RESOLVED_ID_CACHE_KEY);
        if (cached) {
            const cacheMap = JSON.parse(cached);
            if (cacheMap[upperSymbol]) return cacheMap[upperSymbol];
        }
    } catch (e) { /* ignore */ }

    // 3. Search API (Slow, Network, Rate-Limited)
    try {
        console.log(`[PriceService] 🔍 Locating CoinGecko ID for ${symbol}...`);
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);

        if (response.status === 429) {
            console.warn(`[PriceService] ⚠️ CoinGecko Search Rate Limited (429) for ${symbol}. Using fallback.`);
            return lowerSymbol;
        }

        if (response.ok) {
            const data = await response.json();
            if (data.coins && data.coins.length > 0) {
                // Find exact symbol match preferred
                const exactMatch = data.coins.find((c: any) => c.symbol.toUpperCase() === upperSymbol);
                const bestMatch = exactMatch || data.coins[0];

                if (bestMatch) {
                    const resolvedId = bestMatch.id;
                    console.log(`[PriceService] ✅ Resolved ${symbol} -> ${resolvedId}`);

                    // Save to Cache
                    try {
                        const cached = localStorage.getItem(RESOLVED_ID_CACHE_KEY);
                        const cacheMap = cached ? JSON.parse(cached) : {};
                        cacheMap[upperSymbol] = resolvedId;
                        localStorage.setItem(RESOLVED_ID_CACHE_KEY, JSON.stringify(cacheMap));
                    } catch (e) { /* ignore */ }

                    return resolvedId;
                }
            }
        }
    } catch (e) {
        console.warn(`[PriceService] ❌ ID resolution failed for ${symbol}`, e);
    }

    // Fallback: assume ID is same as symbol (most alts)
    return lowerSymbol;
};

export const fetchBulkPricesCoinGecko = async (symbols: string[]): Promise<Record<string, PriceData>> => {
    if (symbols.length === 0) return {};

    try {
        const idMap = await resolveCoinGeckoIds(symbols);
        const ids = Object.values(idMap).join(',');

        console.log(`[PriceService] Bulk Fetching ${symbols.length} assets from CoinGecko...`);
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);

        if (response.ok) {
            const data = await response.json();
            const results: Record<string, PriceData> = {};

            // Map IDs back to symbols
            Object.entries(idMap).forEach(([symbol, id]) => {
                if (data[id]) {
                    results[symbol] = {
                        price: data[id].usd,
                        change24h: data[id].usd_24h_change || null,
                        volume24h: data[id].usd_24h_vol || null
                    };
                }
            });
            return results;
        }
    } catch (e) {
        console.warn("[PriceService] Bulk CoinGecko fetch failed", e);
    }
    return {};
};

// Helper to get price from a record with case-insensitivity and stablecoin fallbacks
export const getPrice = (symbol: string | undefined | null, prices: Record<string, number>): number => {
    if (!symbol) return 0;
    const trimmed = symbol.trim();
    const upper = trimmed.toUpperCase();

    // 1. Hardcoded Stablecoin Fallbacks (Safety First)
    const STABLES = ['USDC', 'USDT', 'DAI', 'FDUSD', 'USDS', 'PYUSD'];
    if (STABLES.includes(upper)) {
        return 1.0;
    }

    // 2. Try exact match
    if (prices[trimmed] !== undefined) return prices[trimmed];

    // 3. Try uppercase match
    if (prices[upper] !== undefined) return prices[upper];

    // 4. Try lowercase match
    const lower = trimmed.toLowerCase();
    if (prices[lower] !== undefined) return prices[lower];

    // 5. Try case-insensitive search
    const foundKey = Object.keys(prices).find(k => k.toUpperCase() === upper);
    if (foundKey) return prices[foundKey];

    return 0;
};

// Helper interface
export interface PriceData {
    price: number;
    change24h?: number | null;
    volume24h?: number | null;
}

export const formatPrice = (num: number | null | undefined, locale?: string, isIndicator: boolean = false, precision?: number): string => {
    if (num === null || num === undefined) return '---';
    if (isIndicator) {
        if (num === 0) return '---';
        return `${num.toFixed(2)}%`;
    }
    // Rule: if precision is provided, use it. Else: Under $1 = 4 decimals, Over $1 = 2 decimals
    const decimals = precision !== undefined ? precision : (num < 1 ? 4 : 2);
    return `$${num.toLocaleString(locale || 'en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const fetchCryptoPricesCC = async (symbols: string[]): Promise<Record<string, PriceData>> => {
    const results: Record<string, PriceData> = {};
    await Promise.all(symbols.map(async (symbol) => {
        try {
            const response = await fetch(`https://cryptoprices.cc/${symbol.toUpperCase()}/`);
            if (response.ok) {
                const text = await response.text();
                const price = parseFloat(text.trim());
                if (!isNaN(price) && price > 0) {
                    results[symbol.toUpperCase()] = { price, change24h: null, volume24h: null };
                }
            }
        } catch (e) { /* silent — fallback */ }
    }));
    return results;
};

export const fetchHyperliquidPrices = async (): Promise<Record<string, PriceData>> => {
    try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'metaAndAssetCtxs' })
        });
        if (response.ok) {
            const data = await response.json();
            // data[0] is universe metadata (names)
            // data[1] is asset contexts (prices)
            const universe = data[0]?.universe;
            const assetCtxs = data[1];

            const prices: Record<string, PriceData> = {};

            if (Array.isArray(universe) && Array.isArray(assetCtxs)) {
                universe.forEach((asset: any, index: number) => {
                    const ctx = assetCtxs[index];
                    if (asset.name && ctx) {
                        const price = parseFloat(ctx.midPx || ctx.markPx || ctx.oraclePx);
                        const prevDayPx = parseFloat(ctx.prevDayPx);
                        const dayNtlVlm = parseFloat(ctx.dayNtlVlm);

                        let change24h: number | null = null;
                        if (!isNaN(prevDayPx) && prevDayPx > 0 && !isNaN(price)) {
                            change24h = ((price - prevDayPx) / prevDayPx) * 100;
                        }

                        if (!isNaN(price)) {
                            prices[asset.name] = {
                                price,
                                change24h,
                                volume24h: !isNaN(dayNtlVlm) ? dayNtlVlm : null
                            };
                        }
                    }
                });
            }
            return prices;
        }
    } catch (e) {
        console.warn("[PriceService] Bulk Hyperliquid fetch failed", e);
    }
    return {};
};

const fetchGlobalGlobalMetrics = async () => {
    try {
        const metrics = await globalMarketService.getMetrics();
        return { market_cap_percentage: metrics.dominance };
    } catch (e) {
        console.warn("[PriceService] Global metrics fetch failed via GlobalMarketService", e);
        return { market_cap_percentage: {} };
    }
};

export const fetchPrice = async (inputSymbol: string, options?: { skipHyperliquid?: boolean }): Promise<PriceData | null> => {
    const symbol = inputSymbol.trim().toUpperCase();

    // 0. [PHASE 22] Reject LP tokens and invalid symbols entirely
    if (
        symbol.startsWith('LP') ||
        symbol.includes(' ') ||
        symbol.includes('PRJX') ||
        symbol.includes('SWAP') ||
        symbol.includes('MMT') ||
        /-\d+$/.test(symbol) // Ends with dash + number (e.g., "SUI-USDC-2")
    ) {
        // Silently skip LP positions - they don't have tradeable prices
        return null;
    }

    // 1. Hyperliquid (Info API) - PRIORITIZED
    if (!options?.skipHyperliquid) {
        try {
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'allMids' })
            });
            if (response.ok) {
                const data = await response.json();
                const price = data[symbol.toUpperCase()];
                if (price) {
                    return { price: parseFloat(price), change24h: null };
                }
            }
        } catch (e) {
            console.warn(`[PriceService] Hyperliquid failed for ${symbol}`, e);
        }
    }

    // 2. CoinGecko (Free, Rate Limited) - PRIORITIZED to avoid Dex scams
    try {
        const mappedId = await resolveCoinGeckoId(symbol);
        // Include 24h change and volume
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${mappedId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);
        if (response.ok) {
            const data = await response.json();
            const keys = Object.keys(data); // keys will be [mappedId]
            if (keys.length > 0 && data[keys[0]].usd) {
                const item = data[keys[0]];
                console.log(`[PriceService] Fetched ${symbol} from CoinGecko (ID: ${mappedId})`);
                return {
                    price: item.usd,
                    change24h: item.usd_24h_change || null,
                    volume24h: item.usd_24h_vol || null
                };
            }
        }
    } catch (e) {
        console.warn(`[PriceService] CoinGecko failed for ${symbol}`, e);
    }

    // 2.5 Special Case for XT (Prioritize CryptoCompare over DexScreener due to scams)
    if (['XT', 'XTDOTCOM'].includes(symbol.toUpperCase())) {
        try {
            console.log(`[PriceService] Priority CryptoCompare fetch for ${symbol}`);
            const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=XT&tsyms=USD`);
            if (response.ok) {
                const data = await response.json();
                if (data.RAW?.XT?.USD) {
                    return {
                        price: data.RAW.XT.USD.PRICE,
                        change24h: data.RAW.XT.USD.CHANGEPCT24HOUR
                    };
                }
            }
        } catch (e) { console.warn(`[PriceService] Priority CC failed for ${symbol}`, e); }
    }

    // 3. CryptoCompare (Free Tier)
    try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol.toUpperCase()}&tsyms=USD`);
        if (response.ok) {
            const data = await response.json();
            if (data.RAW?.[symbol.toUpperCase()]?.USD) {
                const raw = data.RAW[symbol.toUpperCase()].USD;
                return {
                    price: raw.PRICE,
                    change24h: raw.CHANGEPCT24HOUR
                };
            }
        }
    } catch (e) {
        console.warn(`[PriceService] CryptoCompare failed for ${symbol}`, e);
    }

    // 4. Binance (Public API)
    try {
        const pair = `${symbol.toUpperCase()}USDT`;
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);
        if (response.ok) {
            const data = await response.json();
            if (data.lastPrice) {
                console.log(`[PriceService] Fetched ${symbol} from Binance`);
                return {
                    price: parseFloat(data.lastPrice),
                    change24h: parseFloat(data.priceChangePercent)
                };
            }
        }
    } catch (e) { /* ignore */ }

    // 4. CoinMarketCap (Requires API Key)
    // We strictly cannot use this without a proxy server usually due to CORS/Key exposure.
    // We will log a warning or "Not Configured" message as requested by fallback logic, 
    // but in a client-side app, this is unsafe or blocked by CORS.
    // We'll skip implementation to prevent key leakage unless user provides a proxy.
    console.warn(`[PriceService] CoinMarketCap fallback: API Key required / CORS limitations. Skipped for ${symbol}.`);

    return null;
};

/**
 * Derives an approximate Open price if actual historical data is missing.
 * Open = Current / (1 + (Change% / 100))
 */
export const deriveOpenPrice = (currentPrice: number, change24h: number | null | undefined): number | null => {
    if (typeof currentPrice !== 'number' || currentPrice <= 0) return null;
    if (typeof change24h !== 'number') return null;

    // Reverse the percentage change calculation
    // current = open * (1 + change/100) => open = current / (1 + change/100)
    const factor = 1 + (change24h / 100);
    if (factor <= 0) return null; // Avoid division by zero or negative open

    return currentPrice / factor;
};

export const getHistoricalPrice = async (symbol: string, date: string, strategy: 'OPEN' | 'CLOSE' = 'OPEN'): Promise<number | null> => {
    // strategy 'CLOSE' fetches the next day's 00:00 UTC price, effectively the close of the requested day
    let targetDate = new Date(date);
    if (strategy === 'CLOSE') {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    // Format to dd-mm-yyyy
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    const mappedId = await resolveCoinGeckoId(symbol);

    try {
        // Note: This endpoint requires Coin ID (e.g. 'bitcoin'), not symbol ('btc').
        // If users use symbols, this might 404.
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${mappedId}/history?date=${formattedDate}`);
        if (response.ok) {
            const data = await response.json();
            if (data.market_data?.current_price?.usd) {
                return data.market_data.current_price.usd;
            }
        }
    } catch (e) {
        console.warn(`[PriceService] Historical price failed for ${symbol} via CoinGecko`, e);
    }

    // 2. Fallback: CryptoCompare (Historical Day Close)
    try {
        const timestamp = Math.floor(targetDate.getTime() / 1000);
        console.log(`[PriceService] Trying CryptoCompare fallback for ${symbol} at ${timestamp}...`);

        const response = await fetch(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${symbol.toUpperCase()}&tsyms=USD&ts=${timestamp}`);
        if (response.ok) {
            const data = await response.json();
            // detailed response: { "BTC": { "USD": 50000.0 } }
            const upperSym = symbol.toUpperCase();
            if (data[upperSym] && data[upperSym].USD) {
                console.log(`[PriceService] Fetched ${symbol} historical from CryptoCompare`);
                return data[upperSym].USD;
            }
        }
    } catch (e) {
        console.warn(`[PriceService] Historical price failed for ${symbol} via CryptoCompare`, e);
    }

    return null;
};

export interface ChartPoint {
    time: number;
    price: number;
}

const CHART_CACHE_KEY_PREFIX = 'investment_tracker_chart_cache_';
const CHART_CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 Hours

export const fetchMarketChart = async (symbol: string, days: number = 365): Promise<ChartPoint[]> => {
    const cacheKey = `${CHART_CACHE_KEY_PREFIX}${symbol.toUpperCase()}_${days}`;

    // 0. Try Cache
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CHART_CACHE_DURATION) {
                return data;
            }
        }
    } catch (e) { /* ignore cache errors */ }

    const mappedId = await resolveCoinGeckoId(symbol);

    const saveToCache = (points: ChartPoint[]) => {
        try {
            localStorage.setItem(cacheKey, JSON.stringify({ data: points, timestamp: Date.now() }));
        } catch (e) { /* ignore cache errors */ }
    };

    // 1. Try CoinGecko
    try {
        console.log(`[PriceService] Fetching market chart for ${symbol} (${mappedId}) for ${days} days (CoinGecko)...`);
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${mappedId}/market_chart?vs_currency=usd&days=${days}&interval=daily`);
        if (response.ok) {
            const data = await response.json();
            if (data.prices && Array.isArray(data.prices)) {
                const points = data.prices.map((p: [number, number]) => ({
                    time: p[0],
                    price: p[1]
                }));
                saveToCache(points);
                return points;
            }
        } else if (response.status === 401 || response.status === 429) {
            console.warn(`[PriceService] CoinGecko rate limited or unauthorized (${response.status}). Trying fallback...`);
        }
    } catch (e) {
        console.warn(`[PriceService] Market chart fetch failed for ${symbol} (CoinGecko)`, e);
    }

    // 2. Fallback: CryptoCompare (v2/histoday)
    try {
        console.log(`[PriceService] Fetching market chart for ${symbol} for ${days} days (CryptoCompare)...`);
        const response = await fetch(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol.toUpperCase()}&tsym=USD&limit=${days}`);
        if (response.ok) {
            const data = await response.json();
            if (data.Data?.Data && Array.isArray(data.Data.Data)) {
                const points = data.Data.Data.map((p: any) => ({
                    time: p.time * 1000, // CryptoCompare returns seconds
                    price: p.close
                }));
                saveToCache(points);
                return points;
            }
        }
    } catch (e) {
        console.warn(`[PriceService] Market chart fetch failed for ${symbol} (CryptoCompare)`, e);
    }

    return [];
};
