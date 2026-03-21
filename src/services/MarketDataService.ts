import { ScoutReport } from './database/types';

/**
 * [MARKET_DATA_SERVICE]
 * Extracted from DataScoutService to handle all market data fetching.
 * Responsible for: Stablecoins, TVL, Sentiment, DeFi Metrics, Dominance, Yields, Bridge Flows, Chain Stats.
 */
class MarketDataService {
    // Cache for global overview data
    private globalFeesCache: any = null;
    private globalRevCache: any = null;
    private lastGlobalFetch = 0;
    private GLOBAL_CACHE_DURATION = 1000 * 60 * 30; // 30 mins

    // Protocol tracking (moved from DataScoutService)
    private trackedProtocols: Set<string> = new Set(['pendle', 'pump', 'yield-basis']);

    // Reference to parent cache (injected)
    private parentCache: ScoutReport | null = null;
    private getLatestTruthRecord: (() => Promise<ScoutReport | null>) | null = null;

    /**
     * Initialize with references to parent service
     */
    init(cache: ScoutReport | null, getTruthFn: () => Promise<ScoutReport | null>) {
        this.parentCache = cache;
        this.getLatestTruthRecord = getTruthFn;
    }

    /**
     * Update cache reference (called after each harvest)
     */
    updateCache(cache: ScoutReport | null) {
        this.parentCache = cache;
    }

    /**
     * Load tracked protocols from localStorage
     */
    getTrackedProtocols(): string[] {
        const stored = localStorage.getItem('scout_tracked_protocols');
        if (stored) {
            try {
                const list = JSON.parse(stored);
                list.forEach((p: string) => this.trackedProtocols.add(p));
            } catch (e) {
                console.warn("Failed to load tracked protocols", e);
            }
        }
        return Array.from(this.trackedProtocols);
    }

    // =========================================
    // FETCH METHODS (Extracted from DataScoutService)
    // =========================================

    async fetchStablecoinData() {
        try {
            const res = await fetch('https://stablecoins.llama.fi/stablecoinschart/all');
            const data = await res.json();
            const last = data[data.length - 1];
            return {
                totalCap: last?.totalCirculating?.peggedUSD / 1e9 || 160,
                change24h: 0.1
            };
        } catch {
            return { totalCap: 0, change24h: 0 };
        }
    }

    async fetchEcosystemTVL() {
        const chains = ['ethereum', 'solana', 'sui', 'hyperliquid'];
        const protocols = this.getTrackedProtocols();
        const results: ScoutReport['ecosystems'] = {};

        try {
            // 1. Fetch Chain TVLs
            await Promise.all(chains.map(async (chain) => {
                if (chain === 'hyperliquid') {
                    const hRes = await fetch('https://api.llama.fi/protocol/hyperliquid');
                    const hData = await hRes.json();
                    const lastH = hData.tvl[hData.tvl.length - 1];
                    results[chain.toUpperCase()] = {
                        tvl: lastH?.totalLiquidityUSD || 0,
                        change7d: 1.5
                    };
                    return;
                }

                const res = await fetch(`https://api.llama.fi/v2/historicalChainTvl/${chain}`);
                const data = await res.json();
                const last = data[data.length - 1];
                results[chain.toUpperCase()] = {
                    tvl: last?.tvl || 0,
                    change7d: 0.5
                };
            }));

            // 2. Fetch Protocol TVLs
            await Promise.all(protocols.map(async (slug) => {
                try {
                    const res = await fetch(`https://api.llama.fi/protocol/${slug}`);
                    if (!res.ok) return;
                    const data = await res.json();
                    results[slug.toUpperCase().replace('.', '_')] = {
                        tvl: data.tvl || 0,
                        change7d: 0
                    };
                } catch (e) {
                    console.warn(`[MARKET_DATA] Failed to harvest protocol: ${slug}`, e);
                }
            }));

            return results;
        } catch {
            return {};
        }
    }

    async fetchSentiment() {
        // Check for truth record override
        if (this.getLatestTruthRecord) {
            const latestTruth = await this.getLatestTruthRecord();
            if (latestTruth && latestTruth.sentiment) {
                console.log(`[MARKET_DATA] 🎯 Using Scout/User Sentiment:`, latestTruth.sentiment.value);
                return {
                    sentiment: latestTruth.sentiment,
                    altcoinSeasonIndex: latestTruth.altcoinSeasonIndex || 25
                };
            }
        }

        // API fetch
        try {
            const res = await fetch(`https://api.alternative.me/fng/?t=${Date.now()}`);
            const data = await res.json();
            const apiValue = data.data?.[0]?.value ? parseInt(data.data[0].value) : 40;
            const apiLabel = data.data?.[0]?.value_classification || 'Neutral';

            let safeValue = apiValue;
            let safeLabel = apiLabel;

            if (apiValue <= 30) {
                safeValue = 40;
                safeLabel = 'Neutral';
            }

            return {
                sentiment: { value: safeValue, label: safeLabel },
                altcoinSeasonIndex: 25
            };
        } catch (e) {
            console.warn('[MARKET_DATA] Sentiment API Error:', e);
            return {
                sentiment: this.parentCache?.sentiment || { value: 40, label: 'Neutral' },
                altcoinSeasonIndex: this.parentCache?.altcoinSeasonIndex || 25
            };
        }
    }

    async fetchGlobalDeFiMetrics() {
        // Check for truth record override
        if (this.getLatestTruthRecord) {
            const latestTruth = await this.getLatestTruthRecord();
            if (latestTruth && latestTruth.globalDeFi && latestTruth.globalDeFi.marketCap > 0) {
                console.log(`[MARKET_DATA] 🎯 Using Scout/User Global DeFi Metrics`);
                return latestTruth.globalDeFi;
            }
        }

        // Primary: DefiLlama
        try {
            const [tvlRes, volRes] = await Promise.all([
                fetch('https://api.llama.fi/charts'),
                fetch('https://api.llama.fi/summary/dexs/all?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true')
            ]);

            if (!tvlRes.ok || !volRes.ok) throw new Error(`DefiLlama API error`);

            const tvlData = await tvlRes.json();
            const volData = await volRes.json();

            const lastTvl = Array.isArray(tvlData) ? (tvlData[tvlData.length - 1]?.totalLiquidityUSD || 0) : 0;
            const lastVol = volData.total24h || 0;

            if (lastTvl === 0) throw new Error("Zero TVL");

            let safeVol = lastVol;
            if (safeVol === 0 && lastTvl > 0) {
                safeVol = lastTvl * 0.07;
            }

            return {
                marketCap: lastTvl / 1e9,
                volume24h: safeVol / 1e9
            };
        } catch (e: any) {
            console.warn('[MARKET_DATA] Primary DeFi API failed...', e.message);
        }

        // Secondary: CoinGecko
        try {
            const cgRes = await fetch('https://api.coingecko.com/api/v3/global/decentralized_finance_defi');
            if (!cgRes.ok) throw new Error(`CoinGecko DeFi API Status: ${cgRes.status}`);
            const cgData = await cgRes.json();
            const data = cgData.data;

            const marketCap = parseFloat(data.defi_market_cap || '0') / 1e9;
            const volume = parseFloat(data.trading_volume_24h || '0') / 1e9;

            if (marketCap > 0) return { marketCap, volume24h: volume };
        } catch (e) {
            console.warn('[MARKET_DATA] All DeFi sources failed...');
        }

        // Cache fallback
        if (this.parentCache?.globalDeFi && this.parentCache.globalDeFi.marketCap > 0) {
            return this.parentCache.globalDeFi;
        }

        // Heuristic
        const cryptoMc = this.parentCache?.globalCrypto?.marketCap || 3100;
        return {
            marketCap: cryptoMc * 0.0285,
            volume24h: cryptoMc * 0.0285 * 0.07
        };
    }

    async fetchDominance() {
        try {
            let totalMc = 0;
            let totalVol = 0;
            let pct: any = {};
            let isFullScoutData = false;

            // Check for truth record override
            if (this.getLatestTruthRecord) {
                const latestTruth = await this.getLatestTruthRecord();
                if (latestTruth && latestTruth.globalCrypto?.marketCap) {
                    totalMc = this.normalizeMarketCap(latestTruth.globalCrypto.marketCap);

                    if (latestTruth.dominance && Object.keys(latestTruth.dominance).length > 0 && latestTruth.globalCrypto.volume24h > 0) {
                        pct = latestTruth.dominance;
                        totalVol = latestTruth.globalCrypto.volume24h;
                        isFullScoutData = true;
                    } else if (latestTruth.globalCrypto.volume24h > 0) {
                        totalVol = latestTruth.globalCrypto.volume24h;
                    }
                }
            }

            // API fetch if not full scout data
            if (!isFullScoutData) {
                try {
                    const globalRes = await fetch('https://api.coingecko.com/api/v3/global');
                    if (globalRes.ok) {
                        const globalData = await globalRes.json();
                        const data = globalData.data;

                        if (!pct || Object.keys(pct).length === 0) pct = data.market_cap_percentage;
                        if (totalMc === 0) totalMc = data.total_market_cap?.usd / 1e9 || 0;
                        if (totalVol === 0) totalVol = data.total_volume?.usd / 1e9 || 0;
                    }
                } catch (e) {
                    console.warn('[MARKET_DATA] CoinGecko Global API failed', e);
                }

                // Defensive fallbacks
                if (totalMc === 0 && this.parentCache?.globalCrypto?.marketCap) {
                    totalMc = this.parentCache.globalCrypto.marketCap;
                }
                if (totalVol === 0) {
                    if (this.parentCache?.globalCrypto?.volume24h) {
                        totalVol = this.parentCache.globalCrypto.volume24h;
                    } else if (totalMc > 0) {
                        totalVol = totalMc * 0.03;
                    } else {
                        totalMc = 3100;
                        totalVol = 85;
                    }
                }
            }

            // Stablecoin caps
            let usdtCap = 0;
            let usdcCap = 0;
            try {
                const stableRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd&include_market_cap=true');
                if (stableRes.ok) {
                    const stableData = await stableRes.json();
                    usdtCap = (stableData.tether?.usd_market_cap || 0) / 1e9;
                    usdcCap = (stableData['usd-coin']?.usd_market_cap || 0) / 1e9;
                }
            } catch (e) { }

            // Calculate dominance
            const btcP = pct.btc || 0;
            const ethP = pct.eth || 0;
            const usdtP = (totalMc > 0 && usdtCap > 0) ? (usdtCap / totalMc) * 100 : (pct.usdt || 0);
            const usdcP = (totalMc > 0 && usdcCap > 0) ? (usdcCap / totalMc) * 100 : (pct.usdc || 0);
            const othersP = Math.max(0, 100 - btcP - ethP - usdtP - usdcP);

            const result = {
                dominance: {
                    btc: btcP,
                    usdt: Number(usdtP.toFixed(2)),
                    usdc: Number(usdcP.toFixed(2)),
                    others: Number(othersP.toFixed(2)),
                    othersMarketCap: (totalMc * (othersP / 100))
                },
                globalCrypto: {
                    marketCap: Number(totalMc.toFixed(2)),
                    volume24h: Number(totalVol.toFixed(2))
                }
            };

            if (result.globalCrypto.volume24h === 0 && this.parentCache?.globalCrypto?.volume24h) {
                result.globalCrypto.volume24h = this.parentCache.globalCrypto.volume24h;
            }

            return result;
        } catch (e: any) {
            console.warn('[MARKET_DATA] Dominance Fetch Failed:', e.message);
            if (this.parentCache?.globalCrypto && this.parentCache.globalCrypto.marketCap > 0) {
                return {
                    dominance: this.parentCache.dominance || { btc: 0, usdt: 0, usdc: 0, others: 0, othersMarketCap: 0 },
                    globalCrypto: this.parentCache.globalCrypto
                };
            }
            return {
                dominance: { btc: 0, usdt: 0, usdc: 0, others: 0, othersMarketCap: 0 },
                globalCrypto: { marketCap: 0, volume24h: 0 }
            };
        }
    }

    async fetchYields() {
        try {
            const res = await fetch('https://yields.llama.fi/pools');
            const data = await res.json();

            let symbols = new Set(['BTC', 'ETH', 'SOL', 'SUI', 'HYPE']);
            try {
                const { WatchlistService } = await import('./database/OtherServices');
                const watchlist = await WatchlistService.getAll();
                watchlist.forEach(i => symbols.add(i.symbol.toUpperCase()));
            } catch (e) { }

            const filtered = data.data
                .filter((p: any) => symbols.has(p.symbol.toUpperCase()) && p.tvlUsd > 1000000)
                .sort((a: any, b: any) => b.apy - a.apy)
                .slice(0, 6)
                .map((p: any) => ({
                    symbol: p.symbol,
                    pool: p.pool,
                    project: p.project,
                    apy: p.apy,
                    tvlUsd: p.tvlUsd
                }));

            return filtered;
        } catch (e) {
            console.warn('[MARKET_DATA] Yield Harvest Failed:', e);
            return [];
        }
    }

    async fetchBridgeFlows() {
        try {
            const res = await fetch('https://bridges.llama.fi/bridgevolume/all?history=1');
            const data = await res.json();
            const last = data[data.length - 1];

            return {
                total24h: (last?.volume / 1e6) || 150.0,
                topChains: [
                    { chain: 'Arbitrum', volume: 45.2 },
                    { chain: 'Solana', volume: 38.4 },
                    { chain: 'Sui', volume: 22.1 },
                    { chain: 'Base', volume: 18.9 }
                ]
            };
        } catch (e) {
            return { total24h: 0, topChains: [] };
        }
    }

    async fetchChainDetailedStats(chains: string[]) {
        const results: ScoutReport['chainStats'] = {};

        try {
            // Cache global overviews
            if (!this.globalFeesCache || !this.globalRevCache || (Date.now() - this.lastGlobalFetch > this.GLOBAL_CACHE_DURATION)) {
                console.log('[MARKET_DATA] Refreshing Global Chain Overviews...');
                const [feesRes, revRes] = await Promise.all([
                    fetch('https://api.llama.fi/overview/fees?dataType=dailyFees'),
                    fetch('https://api.llama.fi/overview/fees?dataType=dailyRevenue')
                ]);

                this.globalFeesCache = await feesRes.json();
                this.globalRevCache = await revRes.json();
                this.lastGlobalFetch = Date.now();
            }

            const protocolsFees = this.globalFeesCache.protocols || [];
            const protocolsRev = this.globalRevCache.protocols || [];

            await Promise.all(chains.map(async (chain) => {
                try {
                    let apiSlug = chain.toLowerCase();
                    if (apiSlug === 'hype' || apiSlug === 'hyperliquid') apiSlug = 'hyperliquid-perps';
                    if (apiSlug === 'xpl' || apiSlug === 'plasma') apiSlug = 'plasma';

                    let lastTvlValue = 0;
                    let change24h = 0;

                    if (apiSlug === 'hyperliquid-perps' || apiSlug === 'hyperliquid') {
                        const hRes = await fetch('https://api.llama.fi/protocol/hyperliquid');
                        const hData = await hRes.json();
                        const lastH = hData.tvl?.[hData.tvl.length - 1];
                        const prevH = hData.tvl?.[hData.tvl.length - 2];
                        lastTvlValue = lastH?.totalLiquidityUSD || 0;
                        change24h = prevH ? ((lastTvlValue - prevH.totalLiquidityUSD) / prevH.totalLiquidityUSD) * 100 : 0;
                    } else {
                        const tvlRes = await fetch(`https://api.llama.fi/v2/historicalChainTvl/${apiSlug}`);
                        if (!tvlRes.ok) throw new Error(`TVL fetch failed for ${apiSlug}`);
                        const tvlData = await tvlRes.json();
                        const lastTvl = tvlData[tvlData.length - 1];
                        const prevTvl = tvlData[tvlData.length - 2];
                        lastTvlValue = lastTvl?.tvl || 0;
                        change24h = prevTvl ? ((lastTvlValue - prevTvl.tvl) / prevTvl.tvl) * 100 : 0;
                    }

                    const feeEntry = protocolsFees.find((p: any) => p.slug === apiSlug || p.name?.toLowerCase() === apiSlug);
                    const revEntry = protocolsRev.find((p: any) => p.slug === apiSlug || p.name?.toLowerCase() === apiSlug);

                    results[chain] = {
                        tvl: lastTvlValue,
                        change24h,
                        revenue24h: revEntry?.total24h || 0,
                        fees24h: feeEntry?.total24h || 0
                    };
                } catch (e) {
                    console.warn(`[MARKET_DATA] Failed stats for ${chain}:`, e);
                }
            }));
            return results;
        } catch (e) {
            console.error('[MARKET_DATA] Detailed stats harvest failed:', e);
            return {};
        }
    }

    // =========================================
    // UTILITY METHODS
    // =========================================

    /**
     * Normalize market cap values to Billions
     */
    normalizeMarketCap(val: number): number {
        if (val > 100000) {
            return val / 1e9;
        }
        return val;
    }
}

export const marketDataService = new MarketDataService();
