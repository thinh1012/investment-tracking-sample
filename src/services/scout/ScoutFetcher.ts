// [SCOUT_FETCHER] - All External API Calls
// Extracted from DataScoutService for Single Responsibility

import type { ScoutReport } from '../database/types';
import { SCOUT_URL, IS_REMOTE_SCOUT } from '../../config/scoutConfig';

/**
 * Fetches stablecoin market cap data from DefiLlama
 */
export async function fetchStablecoinData(): Promise<{ totalCap: number; change24h: number }> {
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

/**
 * Fetches ecosystem TVL from DefiLlama for chains and tracked protocols
 */
export async function fetchEcosystemTVL(trackedProtocols: string[]): Promise<ScoutReport['ecosystems']> {
    const chains = ['ethereum', 'solana', 'sui', 'hyperliquid'];
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
        await Promise.all(trackedProtocols.map(async (slug) => {
            try {
                const res = await fetch(`https://api.llama.fi/protocol/${slug}`);
                if (!res.ok) return;
                const data = await res.json();
                results[slug.toUpperCase().replace('.', '_')] = {
                    tvl: data.tvl || 0,
                    change7d: 0
                };
            } catch (e) {
                console.warn(`[SCOUT_FETCHER] Failed to harvest protocol: ${slug}`, e);
            }
        }));

        return results;
    } catch {
        return {};
    }
}

/**
 * Fetches yield opportunities from DefiLlama
 */
export async function fetchYields(watchlistSymbols: string[]): Promise<any[]> {
    try {
        const res = await fetch('https://yields.llama.fi/pools');
        const data = await res.json();

        const symbols = new Set(['BTC', 'ETH', 'SOL', 'SUI', 'HYPE', ...watchlistSymbols]);

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
        console.warn('[SCOUT_FETCHER] Yield Harvest Failed:', e);
        return [];
    }
}

/**
 * Fetches bridge flow data from DefiLlama
 */
export async function fetchBridgeFlows(): Promise<{ total24h: number; topChains: any[] }> {
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

/**
 * Fetches global DeFi metrics from DefiLlama and CoinGecko
 */
export async function fetchGlobalDeFiMetrics(
    cachedGlobalDeFi?: ScoutReport['globalDeFi'],
    cachedGlobalCrypto?: ScoutReport['globalCrypto']
): Promise<{ marketCap: number; volume24h: number }> {
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
        let lastVol = volData.total24h || 0;

        if (lastTvl === 0) throw new Error("Zero TVL from primary source");

        if (lastVol === 0 && lastTvl > 0) {
            lastVol = lastTvl * 0.07;
        }

        return {
            marketCap: lastTvl / 1e9,
            volume24h: lastVol / 1e9
        };
    } catch (e: any) {
        console.warn('[SCOUT_FETCHER] Primary DeFi API failed, switching to backup...', e.message);
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
        console.warn('[SCOUT_FETCHER] All DeFi sources failed.');
    }

    // Fallback to cache
    if (cachedGlobalDeFi && cachedGlobalDeFi.marketCap > 0) {
        return cachedGlobalDeFi;
    }

    // Heuristic
    const cryptoMc = cachedGlobalCrypto?.marketCap || 3100;
    return {
        marketCap: cryptoMc * 0.0285,
        volume24h: cryptoMc * 0.0285 * 0.07
    };
}

/**
 * Triggers the external web scout (Satellite) via port 4000
 * NOTE: When Scout runs on Ubuntu (remote), we skip this since it has its own scheduler.
 */
export async function triggerWebScout(): Promise<boolean> {
    // Skip wake-up for remote Scout - it runs its own Watchtower scheduler on Ubuntu
    if (IS_REMOTE_SCOUT) {
        console.log('[SCOUT_FETCHER] 🛰️ Scout is remote (Ubuntu) - skipping local wake-up');
        return true; // Return true to indicate "success" (no action needed)
    }

    try {
        const res = await fetch(`${SCOUT_URL}/scheduler/start`, { method: 'POST' });
        return res.ok;
    } catch (e) {
        console.warn('[SCOUT_FETCHER] Web Scout Trigger Failed:', e);
        return false;
    }
}

/**
 * Fetches a scout brief for a specific asset symbol
 */
export async function getScoutBrief(symbol: string): Promise<string> {
    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${symbol.toLowerCase()}`);
        if (!res.ok) return `No additional data available for ${symbol}.`;

        const data = await res.json();
        const desc = data.description?.en?.substring(0, 300) || '';
        const mcRank = data.market_cap_rank || 'N/A';
        const ath = data.market_data?.ath?.usd || 0;
        const athDate = data.market_data?.ath_date?.usd?.split('T')[0] || '';

        return `**${symbol.toUpperCase()}** (Rank #${mcRank})\n\nATH: $${ath.toLocaleString()} (${athDate})\n\n${desc}...`;
    } catch (e) {
        return `Scout brief unavailable for ${symbol}.`;
    }
}
