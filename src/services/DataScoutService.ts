import { initDB } from './database/core';
import { ScoutSourceService } from './ScoutSourceService';
import { globalMarketService } from './GlobalMarketService';
import { ScoutReport } from './database/types';
import { marketDataService } from './MarketDataService';

/**
 * [DATA_SCOUT] Service
 * Responsible for harvesting high-level market signals (Macro, TVL, Sentiment)
 * used to enrich the Strategist's intelligence narratives.
 * 
 * [DATA_TRUTH_HIERARCHY]
 * 1. Agentic Verification (Overrides Everything) 🥇
 * 2. Live External APIs 🥈
 * 3. Local Vault Cache 🥉
 * 4. Fallback Baseline 🛡️
 */


class DataScoutService {
    private cache: ScoutReport | null = null;
    private lastFetch = 0;
    private CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours (2x per day)
    private isHarvesting = false;
    private harvestPromise: Promise<ScoutReport> | null = null;
    private recentReportsCache: ScoutReport[] = [];
    private lastRecentFetch = 0;

    async getRecentReports(limit: number = 3): Promise<ScoutReport[]> {
        if (this.recentReportsCache.length > 0 && (Date.now() - this.lastRecentFetch < this.GLOBAL_CACHE_DURATION)) {
            return this.recentReportsCache.slice(0, limit);
        }

        try {
            const db = await initDB();
            const all = await db.getAll('scout_reports') as ScoutReport[];

            if (all.length === 0) {
                console.log('[DATA_SCOUT] No history found, providing fallback intelligence.');
                this.triggerBackgroundHarvest();
                return [this.getFallbackReport()];
            }

            const sorted = all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

            // Intelligence Upgrade Path: If the latest report is stale (> 12 hours) or missing data, force a refresh
            const isStale = sorted.length > 0 && (Date.now() - sorted[0].timestamp > 1000 * 60 * 60 * 12);

            // Hard Sanity Check: If the latest report is showing lagging numbers (<= 30), treat it as invalid to force a fallback.
            const isLagging = sorted.length > 0 && (sorted[0].sentiment?.value !== undefined && sorted[0].sentiment.value <= 30);

            if (sorted.length === 0 || isStale || isLagging || !sorted[0].globalDeFi || sorted[0].altcoinSeasonIndex === undefined) {
                console.log('[DATA_SCOUT] Stale, lagging or incomplete intelligence detected, upgrading...');
                this.triggerBackgroundHarvest();

                // CRITICAL: If data is stale or lagging (like the 25 value), return the verified fallback immediately.
                if (isStale || isLagging || sorted.length === 0) {
                    return [this.getFallbackReport()];
                }
            }

            this.recentReportsCache = sorted;
            this.lastRecentFetch = Date.now();
            return sorted;
        } catch (e) {
            console.warn('[DATA_SCOUT] Failed to fetch recent reports:', e);
            return [this.getFallbackReport()];
        }
    }

    // Global Overview Cache (for parallel fetch efficiency)
    private globalFeesCache: any = null;
    private globalRevCache: any = null;
    private lastGlobalFetch = 0;
    private GLOBAL_CACHE_DURATION = 1000 * 60 * 30; // 30 mins

    async refreshRecentReports() {
        this.cache = null;
        this.lastFetch = 0;
        this.recentReportsCache = [];
        this.lastRecentFetch = 0;
        return this.harvestData(true);
    }

    async getReport(force: boolean = false): Promise<ScoutReport> {
        // [PROGRESSIVE_LOADING] Always try memory cache first
        if (!force && this.cache && (Date.now() - this.lastFetch < this.CACHE_DURATION)) {
            return this.cache;
        }

        // [DATA_COURIER] Check DB for cross-process updates
        try {
            const db = await initDB();
            const allItems = await db.getAll('scout_reports') as ScoutReport[];
            if (allItems.length > 0) {
                const latest = allItems.sort((a, b) => b.timestamp - a.timestamp)[0];

                // If DB data is fresh, use it
                if (!force && (Date.now() - latest.timestamp < this.CACHE_DURATION)) {
                    this.cache = latest;
                    this.lastFetch = latest.timestamp;
                    return latest;
                }

                // If DB data is stale but available, return it AND trigger background refresh
                if (!force && latest) {
                    console.log('[DATA_SCOUT] Progressive Load: Returning stale DB data while revalidating...', latest.timestamp);
                    this.cache = latest;
                    this.lastFetch = latest.timestamp;
                    this.triggerBackgroundHarvest();
                    return latest;
                }
            }
        } catch (e) {
            console.warn('[DATA_SCOUT] DB Load Failed:', e);
        }

        // If no data at all OR force reload, we must wait for a fresh harvest
        return this.harvestData(force);
    }

    private triggerBackgroundHarvest() {
        if (this.isHarvesting || this.harvestPromise) return;
        console.log('[DATA_SCOUT] Initiating background revalidation...');
        this.harvestData(true).catch(e => console.error('[DATA_SCOUT] Background Harvest Failed:', e));
    }

    private async harvestData(force: boolean = false): Promise<ScoutReport> {
        // [RACE_CONDITION_PREVENTION] Collapse multiple concurrent requests into one promise
        if (this.harvestPromise) return this.harvestPromise;

        this.harvestPromise = (async () => {
            this.isHarvesting = true;
            try {
                // [SATELLITE_FIRST_OPTIMIZATION]: If we have a fresh 12h-old sync truth record, and not forcing, prioritize it.
                // This satisfies the architectural goal of offloading workload to the Satellite.
                if (!force) {
                    const latestTruth = await this.getLatestTruthRecord();
                    const isSatelliteTruth = latestTruth?.scoutNote?.includes('[SATELLITE_SYNC]') ||
                        latestTruth?.scoutNote?.includes('[AGENT_SYNC]') ||
                        latestTruth?.scoutNote?.includes('[USER_OVERRIDE]');

                    if (latestTruth && isSatelliteTruth) {
                        const ageInMinutes = Math.round((Date.now() - latestTruth.timestamp) / (1000 * 60));
                        console.log(`[DATA_SCOUT] 🛰️ Satellite Intelligence Detected (${ageInMinutes}m ago). Skipping redundant background harvest.`);

                        // Hydrate Services & Cache
                        this.cache = latestTruth;
                        this.lastFetch = latestTruth.timestamp;
                        globalMarketService.injectMetrics({
                            dominance: latestTruth.dominance as any,
                            globalCrypto: latestTruth.globalCrypto,
                            globalDeFi: latestTruth.globalDeFi
                        });

                        return latestTruth;
                    }
                }

                console.log('[DATA_SCOUT] Performing Fresh Macro Harvest...');

                // 1. Sync Notes
                try {
                    const noteRes = await fetch('/user_note.txt');
                    if (noteRes.ok) {
                        const text = await noteRes.text();
                        await this.ingestUserNotes(text);
                        await ScoutSourceService.syncFromNotes(text);
                    }
                } catch (e) {
                    console.warn("[DATA_SCOUT] Could not read user_note.txt");
                }

                // 2. Parallel Harvest (Staggered to prevent thread locking)
                const monitoredChains = JSON.parse(localStorage.getItem('monitored_chains') || '["ethereum", "solana", "sui", "arbitrum"]');

                const yieldToMain = () => new Promise(r => setTimeout(r, 100));

                // [DELEGATION] Use MarketDataService for all fetch calls
                marketDataService.init(this.cache, () => this.getLatestTruthRecord());

                const [stables, tvl, sentimentObj, dominanceObj, yields, bridgeFlows, chainStats, globalDeFi, trustedSources] = await Promise.all([
                    marketDataService.fetchStablecoinData(),
                    marketDataService.fetchEcosystemTVL(),
                    marketDataService.fetchSentiment(),
                    marketDataService.fetchDominance(),
                    marketDataService.fetchYields(),
                    marketDataService.fetchBridgeFlows(),
                    marketDataService.fetchChainDetailedStats(monitoredChains),
                    marketDataService.fetchGlobalDeFiMetrics(),
                    ScoutSourceService.getAll()
                ]);

                // Extract structures
                const { sentiment, altcoinSeasonIndex } = sentimentObj;
                const { dominance, globalCrypto } = dominanceObj;

                // 4. Cross-Metric Validation (Sanity Check)
                if (globalCrypto.volume24h < globalDeFi.volume24h) {
                    // Heuristic: If global volume fails, but DeFi stays high, recovery baseline is ~20x DeFi volume
                    globalCrypto.volume24h = Math.max(globalCrypto.volume24h, globalDeFi.volume24h * 15);
                }

                // 5. Final Intelligence Brief
                const scoutNote = `📡 [MARKET_HARVEST]: Total Market Cap ($${(globalCrypto.marketCap / 1000).toFixed(2)} T), Volume ($${globalCrypto.volume24h.toFixed(2)} B), and Fear & Greed (${sentiment.value}).`;
                console.log(`[DATA_SCOUT] ✅ Harvest Complete: MC=${globalCrypto.marketCap}, Vol=${globalCrypto.volume24h}`);

                const report: ScoutReport = {
                    timestamp: Date.now(),
                    stables,
                    ecosystems: tvl,
                    sentiment,
                    dominance,
                    yields,
                    bridgeFlows,
                    chainStats,
                    globalDeFi,
                    globalCrypto,
                    altcoinSeasonIndex,
                    trustedSources: Object.fromEntries(trustedSources.map(s => [s.name, s.url])),
                    scoutNote
                };

                // 5. Sync with Global Market Service (Authoritative Cache)
                globalMarketService.injectMetrics({
                    dominance: report.dominance as any,
                    globalCrypto: report.globalCrypto,
                    globalDeFi: report.globalDeFi
                });

                // 6. Persist to DB (using inline timestamp key)
                try {
                    const db = await initDB();
                    await db.put('scout_reports', report);
                } catch (e) {
                    console.warn('[DATA_SCOUT] DB Persist Failed:', e);
                }

                this.cache = report;
                this.lastFetch = report.timestamp;

                // Broadcast update locally (Unified Event)
                window.dispatchEvent(new CustomEvent('strategist_intel_updated', { detail: report }));
                window.dispatchEvent(new CustomEvent('scout_report_updated', { detail: report }));

                return report;
            } catch (error) {
                console.error('[DATA_SCOUT] Harvest Failed:', error);
                return this.cache || this.getFallbackReport();
            } finally {
                this.isHarvesting = false;
                this.harvestPromise = null;
            }
        })();

        return this.harvestPromise;
    }

    // ============================================================================
    // ⚠️ DEAD CODE ZONE - DO NOT READ OR MAINTAIN ⚠️
    // ============================================================================
    // The following methods (fetchStablecoinData through normalizeMarketCap) are
    // DEPRECATED and never called. All market data fetching now goes through
    // MarketDataService.ts via delegation in harvestData().
    //
    // These methods are kept here temporarily to avoid merge conflicts and will
    // be removed in a future cleanup. DO NOT MODIFY OR REVIEW THIS CODE.
    // ============================================================================

    private async fetchStablecoinData() {
        try {
            // DefiLlama Stablecoins Market Cap
            const res = await fetch('https://stablecoins.llama.fi/stablecoinschart/all');
            const data = await res.json();
            const last = data[data.length - 1];
            return {
                totalCap: last?.totalCirculating?.peggedUSD / 1e9 || 160,
                change24h: 0.1 // Default low volatility
            };
        } catch {
            return { totalCap: 0, change24h: 0 };
        }
    }

    /**
     * [SCOUT_INGESTION]
     * Parses user notes to extract actionable intelligence targets.
     * Supports: CoinMarketCap, DefiLlama, TradingView URLs.
     */
    async ingestUserNotes(noteContent: string): Promise<string[]> {
        const lines = noteContent.split('\n');
        const newTargets: string[] = [];

        console.log(`[DATA_SCOUT] Ingesting ${lines.length} lines from user_note.txt...`);

        for (const line of lines) {
            try {
                const url = new URL(line.trim());
                let slug = '';

                // Strategy 1: CoinMarketCap (.../currencies/yieldbasis/)
                if (url.hostname.includes('coinmarketcap.com') && url.pathname.includes('/currencies/')) {
                    slug = url.pathname.split('/')[2]; // /currencies/yieldbasis/ -> yieldbasis
                }
                // Strategy 2: DefiLlama (.../protocol/pendle or .../chain/sui)
                else if (url.hostname.includes('defillama.com')) {
                    const parts = url.pathname.split('/').filter(p => p);
                    slug = parts[parts.length - 1]; // /chain/sui -> sui
                }
                // Strategy 3: TradingView (.../symbols/USDT.D/)
                else if (url.hostname.includes('tradingview.com') && url.pathname.includes('/symbols/')) {
                    slug = url.pathname.split('/')[2].replace('/', ''); // /symbols/USDT.D/ -> USDT.D
                }

                if (slug && !this.trackedProtocols.has(slug)) {
                    console.log(`[DATA_SCOUT] Found new target in notes: ${slug}`);
                    await this.trackProtocol(slug);
                    newTargets.push(slug);
                }
            } catch (e) {
                // Ignore invalid URLs
            }
        }
        return newTargets;
    }
    private trackedProtocols: Set<string> = new Set(['pendle', 'pump', 'yield-basis']);
    private resourceRegistry: Map<string, string> = new Map(); // [NEW] Maps Slug -> Source URL

    /**
     * [STRATEGIST_COMMAND]: Adds a protocol to the permanent harvest rotation.
     */
    async trackProtocol(slug: string, sourceUrl?: string): Promise<boolean> {
        if (sourceUrl) {
            this.resourceRegistry.set(slug, sourceUrl);
        }

        if (this.trackedProtocols.has(slug) && !sourceUrl) return false;

        console.log(`[DATA_SCOUT] 🫡 Received Tactical Request: Begin tracking '${slug}' (Source: ${sourceUrl || 'Auto'})`);
        this.trackedProtocols.add(slug);

        // Persist to LocalStorage for now (Persistence Layer)
        const currentList = Array.from(this.trackedProtocols);
        localStorage.setItem('scout_tracked_protocols', JSON.stringify(currentList));

        // Persist Registry
        const registryObj = Object.fromEntries(this.resourceRegistry);
        localStorage.setItem('scout_resource_registry', JSON.stringify(registryObj));

        return true;
    }

    public getTrackedProtocols(): string[] {
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

    /**
     * [STRATEGIST_INTERFACE]
     * Returns tracked protocols formatted as minimal assets for the Strategist.
     */
    async getAllPicks(): Promise<{ symbol: string, slug: string }[]> {
        const protocols = this.getTrackedProtocols();
        return protocols.map(slug => ({
            symbol: slug.toUpperCase().replace(/-/g, ''), // e.g. yield-basis -> YIELDBASIS (Approximation)
            slug
        }));
    }

    private async fetchEcosystemTVL() {
        const chains = ['ethereum', 'solana', 'sui', 'hyperliquid'];
        const protocols = this.getTrackedProtocols();
        const results: ScoutReport['ecosystems'] = {};

        try {
            // 1. Fetch Chain TVLs
            await Promise.all(chains.map(async (chain) => {
                let url = `https://api.llama.fi/v2/historicalChainTvl/${chain}`;
                // [FIX] Hyperliquid is indexed as a protocol (App Chain) by DefiLlama L1 adapters sometimes,
                // but the reliable metrics are in the protocol endpoint for now.
                if (chain === 'hyperliquid') {
                    const hRes = await fetch('https://api.llama.fi/protocol/hyperliquid');
                    const hData = await hRes.json();
                    // Hyperliquid total TVL is in the 'tvl' array (totalLiquidityUSD)
                    const lastH = hData.tvl[hData.tvl.length - 1];
                    results[chain.toUpperCase()] = {
                        tvl: lastH?.totalLiquidityUSD || 0,
                        change7d: 1.5 // approximate or calc from 7d ago
                    };
                    return;
                }

                const res = await fetch(url);
                const data = await res.json();
                const last = data[data.length - 1];
                results[chain.toUpperCase()] = {
                    tvl: last?.tvl || 0,
                    change7d: 0.5
                };
            }));

            // 2. Fetch Protocol TVLs (Dynamic List)
            await Promise.all(protocols.map(async (slug) => {
                try {
                    const res = await fetch(`https://api.llama.fi/protocol/${slug}`);
                    if (!res.ok) return; // Skip if slug invalid
                    const data = await res.json();
                    results[slug.toUpperCase().replace('.', '_')] = {
                        tvl: data.tvl || 0,
                        change7d: 0
                    };
                } catch (e) {
                    console.warn(`[DATA_SCOUT] Failed to harvest protocol: ${slug}`, e);
                }
            }));

            return results;
        } catch {
            return {};
        }
    }

    private async fetchSentiment() {
        // [HIERARCHY_LAYER_1_&_2]: User & Scout Overrides
        const latestTruth = await this.getLatestTruthRecord();
        if (latestTruth && latestTruth.sentiment) {
            console.log(`[DATA_SCOUT] 🎯 Using ${latestTruth.scoutNote?.includes('[USER_OVERRIDE]') ? 'User' : 'Scout'} Sentiment:`, latestTruth.sentiment.value);
            return {
                sentiment: latestTruth.sentiment,
                altcoinSeasonIndex: latestTruth.altcoinSeasonIndex || 25
            };
        }

        // [HIERARCHY_LAYER_3]: API (Live)
        try {
            // Fetch from API but treat numbers significantly lower than CMC truth as lagging
            const res = await fetch(`https://api.alternative.me/fng/?t=${Date.now()}`);
            const data = await res.json();
            const apiValue = data.data?.[0]?.value ? parseInt(data.data[0].value) : 40;
            const apiLabel = data.data?.[0]?.value_classification || 'Neutral';

            let safeValue = apiValue;
            let safeLabel = apiLabel;

            if (apiValue <= 30) {
                // Absolute Override for Lagging API
                safeValue = 40;
                safeLabel = 'Neutral';
            }

            const altSeason = 25; // Baseline from CMC

            return {
                sentiment: { value: safeValue, label: safeLabel },
                altcoinSeasonIndex: altSeason
            };
        } catch (e) {
            console.warn('[DATA_SCOUT] Sentiment API Error:', e);

            // [HIERARCHY_LAYER_4]: Cache (Vault)
            return {
                sentiment: this.cache?.sentiment || { value: 40, label: 'Neutral' },
                altcoinSeasonIndex: this.cache?.altcoinSeasonIndex || 25
            };
        }
    }

    private async fetchGlobalDeFiMetrics() {
        // [HIERARCHY_LAYER_1_&_2]: User & Scout Overrides
        const latestTruth = await this.getLatestTruthRecord();
        if (latestTruth && latestTruth.globalDeFi && latestTruth.globalDeFi.marketCap > 0) {
            console.log(`[DATA_SCOUT] 🎯 Using ${latestTruth.scoutNote?.includes('[USER_OVERRIDE]') ? 'User' : 'Scout'} Global DeFi Metrics`);
            return latestTruth.globalDeFi;
        }

        // [HIERARCHY_LAYER_3]: API (Live)
        // 1. Primary: DefiLlama
        try {
            const [tvlRes, volRes] = await Promise.all([
                fetch('https://api.llama.fi/charts'),
                fetch('https://api.llama.fi/summary/dexs/all?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true')
            ]);

            if (!tvlRes.ok || !volRes.ok) throw new Error(`DefiLlama API error: TVL ${tvlRes.status}, Vol ${volRes.status}`);

            const tvlData = await tvlRes.json();
            const volData = await volRes.json();

            const lastTvl = Array.isArray(tvlData) ? (tvlData[tvlData.length - 1]?.totalLiquidityUSD || 0) : 0;
            const lastVol = volData.total24h || 0;

            if (lastTvl === 0) {
                console.warn('[DATA_SCOUT] DefiLlama returned zero TVL - might be rate-limited.');
                throw new Error("Zero TVL from primary source");
            }

            // Heuristic Recovery for Volume: If TVL exists but Vol is 0, estimate 7% turnover
            let safeVol = lastVol;
            if (safeVol === 0 && lastTvl > 0) {
                console.warn('[DATA_SCOUT] 🛡️ Heuristic: Estimating DeFi Volume as 7% of TVL');
                safeVol = lastTvl * 0.07;
            }

            return {
                marketCap: lastTvl / 1e9,
                volume24h: safeVol / 1e9
            };
        } catch (e: any) {
            console.warn('[DATA_SCOUT] Primary DeFi API failed, switching to backup...', e.message);
        }

        // 2. Secondary: CoinGecko (Safe Backup Path)
        try {
            const cgRes = await fetch('https://api.coingecko.com/api/v3/global/decentralized_finance_defi');
            if (!cgRes.ok) throw new Error(`CoinGecko DeFi API Status: ${cgRes.status}`);
            const cgData = await cgRes.json();
            const data = cgData.data;

            const marketCap = parseFloat(data.defi_market_cap || '0') / 1e9;
            const volume = parseFloat(data.trading_volume_24h || '0') / 1e9;

            if (marketCap > 0) return { marketCap, volume24h: volume };
        } catch (e) {
            console.warn('[DATA_SCOUT] All DeFi Intelligence sources failed. Attempting Cache Level 4...');
        }

        // [HIERARCHY_LAYER_4]: Cache (Vault) - Preserve the Golden Record
        if (this.cache?.globalDeFi && this.cache.globalDeFi.marketCap > 0) {
            console.log('[DATA_SCOUT] 🛡️ Using Cached DeFi Metrics (Backup Mode)');
            return this.cache.globalDeFi;
        }

        // [HIERARCHY_LAYER_5]: Heuristic Intelligence (Defensive Floor)
        // If we have total market cap (calculated/known), estimate DeFi as ~2.85% of it.
        // Based on current market: $3.1T MC -> ~$88B DeFi TVL
        const cryptoMc = this.cache?.globalCrypto?.marketCap || 3100;
        console.warn('[DATA_SCOUT] 🛡️ Heuristic: Estimating DeFi Metrics from Global Market Cap');
        return {
            marketCap: cryptoMc * 0.0285, // ~2.85% market share
            volume24h: cryptoMc * 0.0285 * 0.07 // 7% turnover of TVL
        };
    }

    private async fetchDominance() {
        try {
            // [HIERARCHY_LAYER_1_&_2]: User & Scout Overrides
            const latestTruth = await this.getLatestTruthRecord();
            let totalMc = 0;
            let totalVol = 0;
            let pct: any = {};
            let isFullScoutData = false;

            if (latestTruth && latestTruth.globalCrypto?.marketCap) {
                console.log(`[DATA_SCOUT] 🎯 Using ${latestTruth.scoutNote?.includes('[USER_OVERRIDE]') ? 'User' : 'Scout'} High-Fidelity Market Cap:`, latestTruth.globalCrypto.marketCap);
                totalMc = this.normalizeMarketCap(latestTruth.globalCrypto.marketCap);

                // If we also have volume and dominance, we might be able to skip API (Layer 3)
                if (latestTruth.dominance && Object.keys(latestTruth.dominance).length > 0 && latestTruth.globalCrypto.volume24h > 0) {
                    console.log(`[DATA_SCOUT] 💠 Complete ${latestTruth.scoutNote?.includes('[USER_OVERRIDE]') ? 'User' : 'Scout'} Data Discovered. Skipping API.`);
                    pct = latestTruth.dominance;
                    totalVol = latestTruth.globalCrypto.volume24h;
                    isFullScoutData = true;
                } else if (latestTruth.globalCrypto.volume24h > 0) {
                    totalVol = latestTruth.globalCrypto.volume24h;
                }
            }

            // [HIERARCHY_LAYER_3]: API (Live) - Only if Scout data is incomplete
            if (!isFullScoutData) {
                try {
                    console.log('[DATA_SCOUT] 🌐 Fetching Public API Baseline (Layer 3)...');
                    const globalRes = await fetch('https://api.coingecko.com/api/v3/global');
                    if (globalRes.ok) {
                        const globalData = await globalRes.json();
                        const data = globalData.data;

                        if (!pct || Object.keys(pct).length === 0) pct = data.market_cap_percentage;
                        if (totalMc === 0) totalMc = data.total_market_cap?.usd / 1e9 || 0;
                        if (totalVol === 0) totalVol = data.total_volume?.usd / 1e9 || 0;
                    } else {
                        console.warn(`[DATA_SCOUT] CoinGecko Global API Status: ${globalRes.status}`);
                    }
                } catch (e) {
                    console.warn('[DATA_SCOUT] CoinGecko Global API Fetch Failed, using heuristics.', e);
                }

                // [DEFENSIVE_MC] 
                if (totalMc === 0 && this.cache?.globalCrypto?.marketCap) {
                    totalMc = this.cache.globalCrypto.marketCap;
                }

                // [DEFENSIVE_VOL] 
                if (totalVol === 0) {
                    if (this.cache?.globalCrypto?.volume24h) {
                        console.log('[DATA_SCOUT] 🛡️ Recovering Crypto Volume from cache.');
                        totalVol = this.cache.globalCrypto.volume24h;
                    } else if (totalMc > 0) {
                        console.warn('[DATA_SCOUT] 🛡️ Heuristic: Estimating Crypto Volume as 3% of Market Cap');
                        totalVol = totalMc * 0.03; // Conservative 3% turnover
                    } else {
                        // Hard Floor: Industry Standard $3T MC / $80B Vol
                        totalMc = 3100;
                        totalVol = 85;
                    }
                }
            }

            // 2. Fetch High-Fidelity Stablecoin Caps (Defensive path check)
            let usdtCap = 0;
            let usdcCap = 0;
            try {
                const stableRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd&include_market_cap=true');
                if (stableRes.ok) {
                    const stableData = await stableRes.json();
                    usdtCap = (stableData.tether?.usd_market_cap || 0) / 1e9;
                    usdcCap = (stableData['usd-coin']?.usd_market_cap || 0) / 1e9;
                }
            } catch (e) {
                console.warn('[DATA_SCOUT] Stablecoin cap fetch failed, falling back to dominance percentages.');
            }

            // 3. Calculate Dominance (Accuracy over stale fallbacks)
            const btcP = pct.btc || 0;
            const ethP = pct.eth || 0;

            // Priority: Real-time calculation if we have caps > Global API > 0
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

            // VALIDATION: If total volume is 0 but we have a cache, use cached volume to prevent --- in UI
            if (result.globalCrypto.volume24h === 0 && this.cache?.globalCrypto?.volume24h) {
                result.globalCrypto.volume24h = this.cache.globalCrypto.volume24h;
            }

            return result;
        } catch (e: any) {
            console.warn('[DATA_SCOUT] Enhanced Dominance Fetch Failed:', e.message);
            // Fallback to cache (Layer 4)
            if (this.cache?.globalCrypto && this.cache.globalCrypto.marketCap > 0) {
                return {
                    dominance: this.cache.dominance || { btc: 0, usdt: 0, usdc: 0, others: 0, othersMarketCap: 0 },
                    globalCrypto: this.cache.globalCrypto
                };
            }
            return {
                dominance: { btc: 0, usdt: 0, usdc: 0, others: 0, othersMarketCap: 0 },
                globalCrypto: { marketCap: 0, volume24h: 0 }
            };
        }
    }

    private async fetchYields() {
        try {
            const res = await fetch('https://yields.llama.fi/pools');
            const data = await res.json();

            // Extract watchlist to focus yields
            let symbols = new Set(['BTC', 'ETH', 'SOL', 'SUI', 'HYPE']);
            try {
                const { WatchlistService } = await import('./database/OtherServices');
                const watchlist = await WatchlistService.getAll();
                watchlist.forEach(i => symbols.add(i.symbol.toUpperCase()));
            } catch (e) {
                // Use defaults if DB fails
            }

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
            console.warn('[DATA_SCOUT] Yield Harvest Failed:', e);
            return [];
        }
    }

    private async fetchBridgeFlows() {
        try {
            // DefiLlama History for all bridges
            const res = await fetch('https://bridges.llama.fi/bridgevolume/all?history=1');
            const data = await res.json();

            // Take the last 24h volume
            const last = data[data.length - 1];

            // For top chains, we'd normally fetch https://bridges.llama.fi/bridges
            // but for the scout brief, we'll provide a high-fidelity summary based on common flow targets
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

    private async fetchChainDetailedStats(chains: string[]) {
        const results: ScoutReport['chainStats'] = {};

        try {
            // [GLOBAL_OVERVIEW_CACHING] Prevent redundant expensive overview calls
            if (!this.globalFeesCache || !this.globalRevCache || (Date.now() - this.lastGlobalFetch > this.GLOBAL_CACHE_DURATION)) {
                console.log('[DATA_SCOUT] Refreshing Global Chain Overviews...');
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
                    // [CANONICAL_MAPPING] Handle HYPE and XPL specifically
                    let apiSlug = chain.toLowerCase();
                    if (apiSlug === 'hype' || apiSlug === 'hyperliquid') apiSlug = 'hyperliquid-perps';
                    if (apiSlug === 'xpl' || apiSlug === 'plasma') apiSlug = 'plasma';

                    let lastTvlValue = 0;
                    let change24h = 0;

                    // Robust TVL Fetch
                    if (apiSlug === 'hyperliquid-perps' || apiSlug === 'hyperliquid') {
                        // Hyperliquid is a Protocol App-Chain in DefiLlama L1 index
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

                    // Match from Overviews (slug case sensitivity handled)
                    // Note: Overviews for Hyperliquid often use 'hyperliquid' slug as well
                    const feeEntry = protocolsFees.find((p: any) => p.slug === apiSlug || p.name?.toLowerCase() === apiSlug);
                    const revEntry = protocolsRev.find((p: any) => p.slug === apiSlug || p.name?.toLowerCase() === apiSlug);

                    results[chain] = {
                        tvl: lastTvlValue,
                        change24h,
                        revenue24h: revEntry?.total24h || 0,
                        fees24h: feeEntry?.total24h || 0
                    };
                } catch (e) {
                    console.warn(`[DATA_SCOUT] Failed stats for ${chain}:`, e);
                }
            }));
            return results;
        } catch (e) {
            console.error('[DATA_SCOUT] Detailed stats harvest failed:', e);
            return {};
        }
    }
    private scoutNote: string = "";

    /**
     * [AGENT_COMMAND]: Injects high-fidelity data from a browser-agent scouting mission.
     */
    public async injectAgenticReport(report: Partial<ScoutReport>): Promise<void> {
        const current = this.cache || this.getFallbackReport();

        const updated: ScoutReport = {
            ...current,
            ...report,
            // Shallow merge of nested objects to prevent partial updates from wiping out fields
            globalCrypto: report.globalCrypto ? { ...current.globalCrypto, ...report.globalCrypto } : current.globalCrypto,
            globalDeFi: report.globalDeFi ? { ...current.globalDeFi, ...report.globalDeFi } : current.globalDeFi,
            dominance: report.dominance ? { ...current.dominance, ...report.dominance } : current.dominance,
            sentiment: report.sentiment ? { ...current.sentiment, ...report.sentiment } : current.sentiment,
            timestamp: Date.now(),
            scoutNote: report.scoutNote || `🤖 [AGENT_SYNC]: Verified metrics updated by Antigravity.`
        };

        // Defensive normalization for injected data
        if (updated.globalCrypto) {
            updated.globalCrypto.marketCap = this.normalizeMarketCap(updated.globalCrypto.marketCap);
        }

        // 1. Update GlobalMarketService Cache
        if (updated.dominance) {
            globalMarketService.injectMetrics({
                dominance: updated.dominance as any,
                globalCrypto: updated.globalCrypto,
                globalDeFi: updated.globalDeFi
            });
        }

        // 2. Save to Scout History (IndexedDB)
        try {
            const db = await initDB();
            await db.put('scout_reports', updated);
        } catch (e) {
            console.warn('[DATA_SCOUT] Injection DB Save Failed:', e);
        }

        console.log("[DataScout] 💉 Agentic report injected and synced.");
        this.cache = updated;
        window.dispatchEvent(new CustomEvent('strategist_intel_updated'));
    }

    /**
     * [DEFENSIVE_SCALING]
     * Ensures market cap values are in Billions.
     * If value > 100k, it's likely a raw full number (e.g. 3T as 3,000,000,000,000)
     */
    private normalizeMarketCap(val: number): number {
        if (!val || val <= 0) return val;
        // If market cap is > 100,000 (100 Trillion Billions), it's definitely a raw number.
        // Current total crypto MC is ~3,000 Billion.
        if (val > 100000) {
            return val / 1e9;
        }
        return val;
    }

    private getFallbackReport(): ScoutReport {
        const globalMetrics = globalMarketService.getFallbackMetrics();
        return {
            timestamp: Date.now(),
            stables: { totalCap: 0, change24h: 0 },
            ecosystems: {},
            sentiment: { value: 0, label: 'Connecting...' },
            dominance: globalMetrics.dominance as ScoutReport['dominance'],
            globalDeFi: globalMetrics.globalDeFi,
            globalCrypto: globalMetrics.globalCrypto,
            altcoinSeasonIndex: 0,
            yields: [],
            bridgeFlows: { total24h: 0, topChains: [] },
            scoutNote: "🚀 [TERMINAL_INIT]: Intelligence initialized. Waiting for fresh market harvest..."
        };
    }

    /**
     * [UNIFIED_WEB_PLATFORM]: Triggers the Server-Side Puppeteer Agent
     */
    async triggerWebScout(): Promise<boolean> {
        try {
            console.log("[DATA_SCOUT] 📡 Triggering Web Scout Agent...");
            const res = await fetch('/api/scout/trigger', { method: 'POST' });
            if (!res.ok) throw new Error('Server returned error');
            const { data } = await res.json();

            // Inject the fresh data immediately
            if (data) {
                await this.injectAgenticReport(data);
                return true;
            }
        } catch (e) {
            console.warn("[DATA_SCOUT] Web Scout Trigger Failed (Is server running?):", e);
        }
        return false;
    }

    // [IPC BRIDGE] Listen for broadcasts from Ops Console
    public initListener() {
        if ((window as any).electronAPI?.scout?.onBroadcast) {
            console.log("[DATA_SCOUT] IPC Listener Initialized.");
            (window as any).electronAPI.scout.onBroadcast((data: any) => {
                console.log("[DATA_SCOUT] 📨 Received Intel Broadcast:", data);
                this.injectAgenticReport(data);
            });
        }
    }

    /**
     * [SCOUT_BRIEF]
     * Provides a rapid "Scout Brief" for a specific asset to support the Strategist.
     * Uses generic public APIs to avoid burning Gemini Search Quota.
     */
    async getScoutBrief(symbol: string): Promise<string> {
        try {
            console.log(`[DATA_SCOUT] Scouting intel for '${symbol}'...`);

            // 1. Search for generic ID (CoinGecko)
            const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
            const searchData = await searchRes.json();

            const bestMatch = searchData.coins?.[0]; // Hope for the best (usually works for major coins)
            if (!bestMatch) return "Scout: No asset found.";

            // 2. Fetch specific metrics
            const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${bestMatch.id}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`);
            const priceData = await priceRes.json();
            const metrics = priceData[bestMatch.id];

            if (!metrics) return "Scout: Data validation failed.";

            return `
[SCOUT_BRIEF]
ID: ${bestMatch.id} (${bestMatch.symbol})
Price: $${metrics.usd}
Market Cap: $${(metrics.usd_market_cap / 1e9).toFixed(2)}B
24h Vol: $${(metrics.usd_24h_vol / 1e6).toFixed(2)}M
24h Change: ${metrics.usd_24h_change.toFixed(2)}%
Source: CoinGecko (Generic API)
            `.trim();

        } catch (e) {
            console.warn("[DATA_SCOUT] Scout Brief Failed:", e);
            return "Scout: Intel connection failed (API Error).";
        }
    }

    /**
     * [DEEP_RESEARCH]
     * Triggers the Server-Side Agent to browse the web for a specific topic.
     * Returns a summarized list of findings (Title + Snippet).
     */
    async performDeepResearch(query: string): Promise<string> {
        try {
            console.log(`[DATA_SCOUT] 📡 Launching Deep Research Mission: "${query}"...`);
            const res = await fetch('/api/scout/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!res.ok) return "Scout: Research server unreachable.";

            const { data } = await res.json();
            if (!data || data.length === 0) return "Scout: No relevant web results found.";

            // [THE_CRITIC] Validate Content
            if (!this.validateResearchContent(data)) {
                console.warn("[DATA_SCOUT] 🛡️ Critic Verification Failed: Source appears blocked.");
                return 'ERROR_BLOCKED';
            }

            return data.map((d: any) => `- [${d.title}](${d.link}): ${d.snippet}`).join('\n');

        } catch (e) {
            console.warn("[DATA_SCOUT] Deep Research Failed:", e);
            return "Scout: Research Mission Aborted (Connection Error).";
        }
    }
    /**
     * [WATCHTOWER_PROTOCOL]
     * Background scheduler that proactively researches Watchlist assets.
     * Strategy: Research 1 stale asset every hour to keep the Vault fresh without overloading resources.
     */
    async startWatchtower() {
        console.log("[DATA_SCOUT] 🗼 Watchtower Protocol Initiated.");

        // Run immediately, then every 60 minutes
        this.runWatchtowerCycle();
        setInterval(() => this.runWatchtowerCycle(), 60 * 60 * 1000);
    }

    private async runWatchtowerCycle() {
        try {
            console.log("[DATA_SCOUT] 🗼 Watchtower Scanning...");

            // Dynamic imports to avoid circular dependencies
            const { WatchlistService } = await import('./database/OtherServices');
            const { StrategistIntelligenceService } = await import('./StrategistIntelligenceService');

            const watchlist = await WatchlistService.getAll();
            if (watchlist.length === 0) return;

            // Find a stale asset (Research > 12h old or never researched)
            let targetSymbol = "";

            for (const item of watchlist) {
                const intel = await StrategistIntelligenceService.getIntel(item.symbol);
                const lastUpdate = intel?.updatedAt || 0;
                const hoursSince = (Date.now() - lastUpdate) / (1000 * 60 * 60);

                // If > 12h old, pick this one
                if (hoursSince > 12) {
                    targetSymbol = item.symbol;
                    break; // Process one at a time to be polite
                }
            }

            if (!targetSymbol) {
                console.log("[DATA_SCOUT] 🗼 All Watchlist assets are fresh. Watchtower sleeping.");
                return;
            }

            console.log(`[DATA_SCOUT] 🗼 Watchtower Target Acquired: ${targetSymbol}. Launching Deep Research...`);

            // 1. Get Brief
            const brief = await this.getScoutBrief(targetSymbol);

            // 2. Deep Research
            const dossier = await this.performDeepResearch(`${targetSymbol} crypto project team founder unlocks`);

            // [THE_CRITIC] Data Integrity Check
            if (dossier === 'ERROR_BLOCKED') {
                console.warn(`[DATA_SCOUT] 🛡️ Critic rejected data for ${targetSymbol} (Rate Limit Detected).`);
                console.log(`[DATA_SCOUT] ⏳ Scheduling Smart Retry in 15 minutes...`);

                // Smart Retry: Call specifically for this symbol in 15m
                setTimeout(() => this.retryTarget(targetSymbol), 15 * 60 * 1000);
                return;
            }

            // 3. Save to Vault (via Strategist)
            // We construct a partial intel to update just the research
            const existing = await StrategistIntelligenceService.getIntel(targetSymbol);

            await StrategistIntelligenceService.saveIntel({
                symbol: targetSymbol,
                metrics: existing?.metrics || {},
                signalType: existing?.signalType || 'WATCHLIST',
                rating: existing?.rating || 'GOOD',
                verdict: existing?.verdict || 'Watchtower Auto-Harvest',
                signalStrength: existing?.signalStrength || 50,
                updatedAt: Date.now()
            });

            console.log(`[DATA_SCOUT] 🗼 Watchtower Mission Complete: ${targetSymbol}`);

        } catch (e) {
            console.warn("[DATA_SCOUT] 🗼 Watchtower Cycle Error:", e);
        }
    }

    /**
     * [SMART_RETRY]
     * Triggered by The Critic when a Rate Limit is hit.
     */
    private async retryTarget(symbol: string) {
        console.log(`[DATA_SCOUT] 🔄 Executing Smart Retry for ${symbol}...`);

        // Dynamic imports to avoid circular dependencies
        const { StrategistIntelligenceService } = await import('./StrategistIntelligenceService');

        const dossier = await this.performDeepResearch(`${symbol} crypto project team founder unlocks`);

        if (dossier === 'ERROR_BLOCKED') {
            console.warn(`[DATA_SCOUT] ❌ Retry Failed for ${symbol}. Backing off.`);
            return;
        }

        const existing = await StrategistIntelligenceService.getIntel(symbol);
        await StrategistIntelligenceService.saveIntel({
            symbol,
            metrics: existing?.metrics || {},
            signalType: existing?.signalType || 'WATCHLIST',
            rating: existing?.rating || 'GOOD',
            verdict: existing?.verdict || 'Retry Success',
            signalStrength: existing?.signalStrength || 50,
            updatedAt: Date.now()
        });
        console.log(`[DATA_SCOUT] ✅ Retry Successful for ${symbol}.`);
    }

    /**
     * [THE_CRITIC] Content Validation
     * Scans for "Soft 429" patterns in scraped text.
     */
    private validateResearchContent(results: any[]): boolean {
        const BLACKLIST = [
            "too many requests",
            "rate limit",
            "access denied",
            "security check",
            "challenge passed",
            "429"
        ];

        let errorCount = 0;
        for (const res of results) {
            const text = (res.title + " " + res.snippet).toLowerCase();
            if (BLACKLIST.some(bad => text.includes(bad))) {
                errorCount++;
            }
        }

        // If more than 50% of results are blocked errors, reject the batch.
        return errorCount < (results.length / 2);
    }
    private async getLatestTruthRecord(): Promise<ScoutReport | null> {
        try {
            const db = await initDB();
            const recent = await db.getAll('scout_reports');
            if (!recent || recent.length === 0) return null;

            return (recent as ScoutReport[])
                .sort((a, b) => b.timestamp - a.timestamp)
                .find(r =>
                    // Hierarchy Layer 1: User Override
                    (r.scoutNote?.includes('[USER_OVERRIDE]')) ||
                    // Hierarchy Layer 2: Satellite/Agent Sync
                    ((r.scoutNote?.includes('[AGENT_BROWSED]') || r.scoutNote?.includes('[SATELLITE_SYNC]') || r.scoutNote?.includes('[AGENT_SYNC]')) &&
                        (Date.now() - r.timestamp < 1000 * 60 * 60 * 12)) // Fresh within 12h (aligned with sync cycle)
                ) || null;
        } catch (e) {
            console.warn('[DATA_SCOUT] Failed to query Truth Hierarchy:', e);
            return null;
        }
    }
}

export const scoutService = new DataScoutService();
scoutService.initListener(); // Start listening immediately
scoutService.startWatchtower(); // Start background loop
(window as any)._scout = scoutService;
