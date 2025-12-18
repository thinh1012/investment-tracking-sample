const RESOLVED_ID_CACHE_KEY = 'investment_tracker_coingecko_ids';

const resolveCoinGeckoId = async (symbol: string): Promise<string> => {
    const upperSymbol = symbol.toUpperCase();
    const lowerSymbol = symbol.toLowerCase();

    // 1. Hardcoded Map (Fastest)
    const COINGECKO_ID_MAP: Record<string, string> = {
        'HYPE': 'hyperliquid',
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'USDT': 'tether',
        'USDC': 'usd-coin',
        'CVX': 'convex-finance',
        'XT': 'xtcom-token',
        'XTDOTCOM': 'xtcom-token'
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

    // 3. Search API (Slow, Network)
    try {
        console.log(`[PriceService] Searching CoinGecko for ID of ${symbol}...`);
        const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
        if (response.ok) {
            const data = await response.json();
            // content: { coins: [ { id: 'bitcoin', symbol: 'BTC', ... }, ... ] }
            if (data.coins && data.coins.length > 0) {
                // Find exact symbol match preferred
                const exactMatch = data.coins.find((c: any) => c.symbol.toUpperCase() === upperSymbol);
                const bestMatch = exactMatch || data.coins[0];

                if (bestMatch) {
                    const resolvedId = bestMatch.id;
                    console.log(`[PriceService] Resolved ${symbol} -> ${resolvedId}`);

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
        console.warn(`[PriceService] ID resolution failed for ${symbol}`, e);
    }

    // Fallback: assume ID is same as symbol (most alts)
    return lowerSymbol;
};

// Helper Interface
export interface PriceData {
    price: number;
    change24h?: number | null;
    volume24h?: number | null;
}

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

// Global Market Data Cache
let globalDataCache: { data: any; timestamp: number } | null = null;
const GLOBAL_CACHE_DURATION = 10 * 60 * 1000; // 10 Minutes

const fetchGlobalGlobalMetrics = async () => {
    const now = Date.now();
    if (globalDataCache && (now - globalDataCache.timestamp < GLOBAL_CACHE_DURATION)) {
        return globalDataCache.data;
    }

    try {
        console.log("[PriceService] Fetching Global Market Data...");
        const response = await fetch('https://api.coingecko.com/api/v3/global');
        if (response.ok) {
            const json = await response.json();
            if (json.data) {
                globalDataCache = { data: json.data, timestamp: now };
                return json.data;
            }
        }
    } catch (e) {
        console.warn("[PriceService] Global market data fetch failed (CoinGecko)", e);
    }

    // 2. Fallback: CoinPaprika (Comprehensive: BTC, ETH, USDT, USDC)
    try {
        console.log("[PriceService] Fetching Global Data Fallback (CoinPaprika)...");
        // We need Global (for Total Cap) + Individual Tickers (for Calc)
        // Global gives BTC dominance directly.
        // Others we calculate: (CoinCap / GlobalCap) * 100
        const [globalRes, ethRes, usdtRes, usdcRes] = await Promise.all([
            fetch('https://api.coinpaprika.com/v1/global'),
            fetch('https://api.coinpaprika.com/v1/tickers/eth-ethereum'),
            fetch('https://api.coinpaprika.com/v1/tickers/usdt-tether'),
            fetch('https://api.coinpaprika.com/v1/tickers/usdc-usd-coin')
        ]);

        if (globalRes.ok) {
            const globalData = await globalRes.json();
            const totalCap = globalData.market_cap_usd;

            const marketCaps: any = {
                btc: globalData.bitcoin_dominance_percentage
            };

            // Helper to process ticker response
            const processTicker = async (res: Response, key: string) => {
                if (res.ok) {
                    const t = await res.json();
                    if (t.quotes?.USD?.market_cap && totalCap) {
                        marketCaps[key] = (t.quotes.USD.market_cap / totalCap) * 100;
                    }
                }
            };

            await Promise.all([
                processTicker(ethRes, 'eth'),
                processTicker(usdtRes, 'usdt'),
                processTicker(usdcRes, 'usdc')
            ]);

            const mappedData = { market_cap_percentage: marketCaps };
            globalDataCache = { data: mappedData, timestamp: now };
            return mappedData;
        }
    } catch (e) {
        console.warn("[PriceService] Global fallback failed (CoinPaprika)", e);
    }

    // 3. Fallback: CoinLore (BTC, ETH only)
    try {
        console.log("[PriceService] Fetching Global Data Fallback (CoinLore)...");
        const response = await fetch('https://api.coinlore.net/api/global/');
        if (response.ok) {
            const json = await response.json();
            if (Array.isArray(json) && json.length > 0) {
                const data = json[0];
                const mappedData = {
                    market_cap_percentage: {
                        btc: parseFloat(data.btc_d),
                        eth: parseFloat(data.eth_d)
                    }
                };
                // Don't cache deeply if it's partial? Or just accept it.
                // We'll return it but maybe keep cache short? Standard is fine.
                globalDataCache = { data: mappedData, timestamp: now };
                return mappedData;
            }
        }
    } catch (e) {
        console.warn("[PriceService] Global fallback failed (CoinLore)", e);
    }

    return null;
};

export const fetchPrice = async (inputSymbol: string, options?: { skipHyperliquid?: boolean }): Promise<PriceData | null> => {
    const symbol = inputSymbol.trim().toUpperCase();

    // 0. Global Metrics (BTC.D, USDT.D, etc.)
    if (symbol.endsWith('.D')) {
        const base = symbol.replace('.D', '').toLowerCase(); // btc, usdt, eth
        const data = await fetchGlobalGlobalMetrics();
        if (data && data.market_cap_percentage) {
            const dominance = data.market_cap_percentage[base];
            if (typeof dominance === 'number') {
                return { price: dominance, change24h: null }; // TODO: Calculate change if history available
            }
        }
        return null; // Don't fall through to price search for metrics
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

    // 3. DexScreener (Excellent for DeFi/Alts, No Rate Limit)
    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${symbol}`);
        if (response.ok) {
            const data = await response.json();
            if (data.pairs && data.pairs.length > 0) {
                // Find the best USD pair using API relevance (safer than sorting by scam liquidity)
                const validPair = data.pairs.find((p: any) =>
                    ['USDC', 'USDT', 'USD', 'DAI'].includes(p.quoteToken.symbol.toUpperCase())
                );

                if (validPair && validPair.priceUsd) {
                    console.log(`[PriceService] Fetched ${symbol} from DexScreener`);
                    return {
                        price: parseFloat(validPair.priceUsd),
                        change24h: validPair.priceChange?.h24 || null
                    };
                }
            }
        }
    } catch (e) {
        console.warn(`[PriceService] DexScreener failed for ${symbol}`, e);
    }

    // 4. CryptoCompare (Free Tier)
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

    // 5. Binance (Public API)
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

    // 6. Kraken (Public API)
    try {
        const pair = `${symbol.toUpperCase()}USD`;
        const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`);
        if (response.ok) {
            const data = await response.json();
            // result: { XXBTZUSD: { c: ["50000.00"], p: ["50000.00"] } } - Kraken change is tricky without calc
            if (data.result && !data.error?.length) {
                const keys = Object.keys(data.result);
                if (keys.length > 0) {
                    const kData = data.result[keys[0]];
                    const price = kData.c?.[0]; // Last trade closed price
                    // Kraken doesn't give % change directly in Ticker, need to calc or ignore for now
                    if (price) {
                        console.log(`[PriceService] Fetched ${symbol} from Kraken`);
                        return { price: parseFloat(price), change24h: null };
                    }
                }
            }
        }
    } catch (e) {
        console.warn(`[PriceService] Kraken failed for ${symbol}`, e);
    }

    // 4. CoinMarketCap (Requires API Key)
    // We strictly cannot use this without a proxy server usually due to CORS/Key exposure.
    // We will log a warning or "Not Configured" message as requested by fallback logic, 
    // but in a client-side app, this is unsafe or blocked by CORS.
    // We'll skip implementation to prevent key leakage unless user provides a proxy.
    console.warn(`[PriceService] CoinMarketCap fallback: API Key required / CORS limitations. Skipped for ${symbol}.`);

    return null;
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

export const fetchMarketChart = async (symbol: string, days: number = 365): Promise<ChartPoint[]> => {
    const mappedId = await resolveCoinGeckoId(symbol);

    // 1. Try CoinGecko
    try {
        console.log(`[PriceService] Fetching market chart for ${symbol} (${mappedId}) for ${days} days (CoinGecko)...`);
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${mappedId}/market_chart?vs_currency=usd&days=${days}&interval=daily`);
        if (response.ok) {
            const data = await response.json();
            if (data.prices && Array.isArray(data.prices)) {
                return data.prices.map((p: [number, number]) => ({
                    time: p[0],
                    price: p[1]
                }));
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
                return data.Data.Data.map((p: any) => ({
                    time: p.time * 1000, // CryptoCompare returns seconds
                    price: p.close
                }));
            }
        }
    } catch (e) {
        console.warn(`[PriceService] Market chart fetch failed for ${symbol} (CryptoCompare)`, e);
    }

    return [];
};
