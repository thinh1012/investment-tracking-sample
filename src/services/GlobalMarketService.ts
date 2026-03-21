import { ScoutReport } from './database/types';

// [ARCHITECT] Global Market Service
// Purpose: Single source of truth for global metrics (MC, Volume, Dominance)
// Implementation: Hybrid Data Truth Hierarchy (Agentic > Live > Cache > Fallback)

export interface GlobalDeFi {
    marketCap: number; // in billions
    volume24h: number; // in billions
}

export interface GlobalCrypto {
    marketCap: number; // in billions
    volume24h: number; // in billions
}

export interface MarketMetrics {
    globalDeFi: GlobalDeFi;
    globalCrypto: GlobalCrypto;
    dominance: {
        btc: number;
        eth?: number;
        usdt: number;
        usdc: number | null;
        others: number | null;
        othersMarketCap?: number | null; // in billions
        [key: string]: number | undefined | null;
    };
}

class GlobalMarketService {
    private CACHE_KEY = 'vault_global_market_cache';
    private CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (aligned with DataScout cycle)

    // [DATA_TRUTH_HIERARCHY] Level 4: Empty Baselines (Prioritize Reality)
    private FALLBACK_METRICS: MarketMetrics = {
        globalDeFi: { marketCap: 0, volume24h: 0 },
        globalCrypto: { marketCap: 0, volume24h: 0 },
        dominance: { btc: 0, eth: 0, usdt: 0, usdc: 0, others: 0 }
    };

    /**
     * [DATA_TRUTH_HIERARCHY] Level 1: Agentic Injection
     * Allows an Agent to manually sync verified market reality into the cache.
     */
    public injectMetrics(metrics: Partial<MarketMetrics>): void {
        console.log("[GlobalMarketService] 💉 Injecting verified metrics...", metrics);
        const current = this.getCache() || this.FALLBACK_METRICS; // Get current cache or fallback
        const updated: MarketMetrics = {
            ...current,
            ...metrics,
            dominance: {
                ...current.dominance,
                ...(metrics.dominance || {})
            }
        };

        localStorage.setItem(this.CACHE_KEY, JSON.stringify({
            metrics: updated, // Use 'metrics' key for consistency with getCache/setCache
            timestamp: Date.now()
        }));

        // Broadcast the update so UI components can refresh
        window.dispatchEvent(new CustomEvent('strategist_intel_updated'));
    }

    /**
     * Internal access to static baselines
     */
    getFallbackMetrics(): MarketMetrics {
        return this.FALLBACK_METRICS;
    }

    /**
     * Retrieves unified global metrics respecting the truth hierarchy.
     * Priority: Agentic Override > Cache > Live API > Empty Fallback
     */
    async getMetrics(customReport?: ScoutReport): Promise<MarketMetrics> {
        // Level 1: Agentic Override (High Fidelity)
        if (customReport?.globalCrypto && customReport.globalDeFi) {
            return {
                globalDeFi: customReport.globalDeFi,
                globalCrypto: customReport.globalCrypto,
                dominance: customReport.dominance || this.FALLBACK_METRICS.dominance
            };
        }

        // Level 2: Local Cache (Scout-injected or API-cached)
        const cached = this.getCache();
        if (cached) return cached;

        // Level 3: Live API Fallback (CoinGecko Global)
        const apiData = await this.fetchFromCoinGecko();
        if (apiData) {
            this.setCache(apiData);
            return apiData;
        }

        // Level 4: Safe Fallback (empty values)
        return this.FALLBACK_METRICS;
    }

    /**
     * [PHASE 93] Fetch global metrics directly from CoinGecko API.
     * Used as a fallback when Scout is offline.
     */
    private async fetchFromCoinGecko(): Promise<MarketMetrics | null> {
        try {
            console.log('[GlobalMarketService] 🌐 Fetching from CoinGecko global API...');
            const response = await fetch('https://api.coingecko.com/api/v3/global');

            if (!response.ok) {
                console.warn('[GlobalMarketService] ⚠️ CoinGecko API returned:', response.status);
                return null;
            }

            const json = await response.json();
            const data = json.data;

            if (data) {
                const metrics: MarketMetrics = {
                    globalCrypto: {
                        marketCap: (data.total_market_cap?.usd || 0) / 1e9,
                        volume24h: (data.total_volume?.usd || 0) / 1e9
                    },
                    globalDeFi: {
                        marketCap: (data.total_market_cap?.usd || 0) * 0.05 / 1e9, // Estimate ~5% of total is DeFi
                        volume24h: (data.total_volume?.usd || 0) * 0.1 / 1e9 // Estimate ~10%
                    },
                    dominance: {
                        btc: data.market_cap_percentage?.btc || 0,
                        eth: data.market_cap_percentage?.eth || 0,
                        usdt: data.market_cap_percentage?.usdt || 0,
                        usdc: data.market_cap_percentage?.usdc || null,
                        others: 100 - (data.market_cap_percentage?.btc || 0) - (data.market_cap_percentage?.eth || 0)
                    }
                };
                console.log('[GlobalMarketService] ✅ CoinGecko data fetched:', metrics.globalCrypto.marketCap.toFixed(2) + 'B');
                return metrics;
            }
        } catch (e) {
            console.warn('[GlobalMarketService] ❌ CoinGecko fetch failed:', e);
        }
        return null;
    }

    private getCache(): MarketMetrics | null {
        try {
            const data = localStorage.getItem(this.CACHE_KEY);
            if (!data) return null;
            const parsed = JSON.parse(data);
            if (Date.now() - parsed.timestamp > this.CACHE_DURATION) return null;
            return parsed.metrics;
        } catch (e) {
            return null;
        }
    }

    setCache(metrics: MarketMetrics) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify({
            metrics,
            timestamp: Date.now()
        }));
    }
}

export const globalMarketService = new GlobalMarketService();
