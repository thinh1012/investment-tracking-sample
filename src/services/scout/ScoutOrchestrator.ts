// [SCOUT_ORCHESTRATOR] - Lean Facade for Scout Intelligence
// This replaces the monolithic DataScoutService with a cleaner, modular approach
// All heavy logic has been extracted to focused modules in this directory.

import { ScoutSourceService } from '../ScoutSourceService';
import { globalMarketService } from '../GlobalMarketService';
import type { ScoutReport } from '../database/types';
import { isLP, decomposeLP } from '../../utils/assetUtils';

// Import focused modules
import * as Fetcher from './ScoutFetcher';
import * as Cache from './ScoutCache';
import * as Transformer from './ScoutTransformer';
import * as Watchtower from './ScoutWatchtower';

/**
 * [DATA_SCOUT] Orchestrator
 * Coordinates market intelligence harvesting using focused sub-modules.
 * 
 * [DATA_TRUTH_HIERARCHY]
 * 1. Agentic Verification (Overrides Everything) 🥇
 * 2. Live External APIs 🥈
 * 3. Local Vault Cache 🥉
 * 4. Fallback Baseline 🛡️
 */
class DataScoutServiceClass {
    private isHarvesting = false;
    private harvestPromise: Promise<ScoutReport> | null = null;

    // === PUBLIC API (Backward Compatible) ===

    async getRecentReports(limit: number = 3): Promise<ScoutReport[]> {
        return Cache.getRecentReports(
            limit,
            () => Transformer.getFallbackReport(),
            () => this.triggerBackgroundHarvest()
        );
    }

    async refreshRecentReports(): Promise<ScoutReport> {
        Cache.clearCache();
        return this.harvestData(true);
    }

    async getReport(force: boolean = false): Promise<ScoutReport> {
        // Progressive Loading: Memory cache first
        if (!force && Cache.isCacheValid()) {
            return Cache.getCache()!;
        }

        // Check DB for cross-process updates
        const dbReport = await Cache.loadLatestFromDB();
        if (dbReport) {
            const dbAge = Date.now() - dbReport.timestamp;
            if (!force && dbAge < Cache.CACHE_DURATION) {
                Cache.setCache(dbReport);
                return dbReport;
            }

            // Stale but available: return immediately, refresh in background
            if (!force) {
                Cache.setCache(dbReport);
                this.triggerBackgroundHarvest();
                return dbReport;
            }
        }

        // No data or force: wait for fresh harvest
        return this.harvestData(force);
    }

    async injectAgenticReport(report: Partial<ScoutReport>): Promise<void> {
        const current = Cache.getCache() || Transformer.getFallbackReport();
        const updated = Transformer.mergeReports(current, {
            ...report,
            scoutNote: report.scoutNote || `🤖 [AGENT_SYNC]: Verified metrics updated by Antigravity.`
        });

        // Normalize injected data
        if (updated.globalCrypto) {
            updated.globalCrypto.marketCap = Transformer.normalizeMarketCap(updated.globalCrypto.marketCap);
        }

        // Update GlobalMarketService
        if (updated.dominance) {
            globalMarketService.injectMetrics({
                dominance: updated.dominance as any,
                globalCrypto: updated.globalCrypto,
                globalDeFi: updated.globalDeFi
            });
        }

        // Persist
        await Cache.persistReport(updated);
        Cache.setCache(updated);

        console.log("[SCOUT_ORCHESTRATOR] 💉 Agentic report injected and synced.");
        window.dispatchEvent(new CustomEvent('strategist_intel_updated'));
    }

    // === PROTOCOL TRACKING ===

    getTrackedProtocols(): string[] {
        return Watchtower.getTrackedProtocols();
    }

    /**
     * [PHASE 69] LP guard to prevent tracking LP assets directly
     * [PHASE 70] Decomposes LPs and tracks their underlying tokens
     */
    async trackProtocol(slug: string, sourceUrl?: string): Promise<boolean> {
        if (isLP(slug)) {
            console.log(`[SCOUT_ORCHESTRATOR] 🛡️ LP detected: ${slug}. Decomposing...`);
            const components = decomposeLP(slug);
            let success = true;
            for (const token of components) {
                console.log(`[SCOUT_ORCHESTRATOR] 🔗 Tracking LP component: ${token}`);
                const result = await Watchtower.trackProtocol(token.toLowerCase(), sourceUrl);
                if (!result) success = false;
            }
            return success;
        }
        return Watchtower.trackProtocol(slug, sourceUrl);
    }

    async getAllPicks(): Promise<{ symbol: string; slug: string }[]> {
        return Watchtower.getAllPicks();
    }

    async ingestUserNotes(noteContent: string): Promise<string[]> {
        return Watchtower.ingestUserNotes(noteContent, (slug, url) => Watchtower.trackProtocol(slug, url));
    }

    // === EXTERNAL TRIGGERS ===

    async triggerWebScout(): Promise<boolean> {
        return Fetcher.triggerWebScout();
    }

    async getScoutBrief(symbol: string): Promise<string> {
        return Fetcher.getScoutBrief(symbol);
    }

    async performDeepResearch(query: string): Promise<string> {
        try {
            console.log(`[SCOUT_ORCHESTRATOR] 📡 Launching Deep Research Mission: "${query}"...`);
            const res = await fetch('/api/scout/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!res.ok) return "Scout: Research server unreachable.";

            const { data } = await res.json();
            if (!data || data.length === 0) return "Scout: No relevant web results found.";

            if (!Transformer.validateResearchContent(data)) {
                console.warn("[SCOUT_ORCHESTRATOR] 🛡️ Critic Verification Failed.");
                return 'ERROR_BLOCKED';
            }

            return data.map((d: any) => `- [${d.title}](${d.link}): ${d.snippet}`).join('\n');
        } catch (e) {
            console.warn("[SCOUT_ORCHESTRATOR] Deep Research Failed:", e);
            return "Scout: Research Mission Aborted (Connection Error).";
        }
    }

    // === INITIALIZATION ===

    initListener(): void {
        if ((window as any).electronAPI?.scout?.onBroadcast) {
            console.log("[SCOUT_ORCHESTRATOR] IPC Listener Initialized.");
            (window as any).electronAPI.scout.onBroadcast((data: any) => {
                console.log("[SCOUT_ORCHESTRATOR] 📨 Received Intel Broadcast:", data);
                this.injectAgenticReport(data);
            });
        }
    }

    startWatchtower(): void {
        Watchtower.startWatchtower(() => this.runWatchtowerCycle());
    }

    // === PRIVATE METHODS ===

    private triggerBackgroundHarvest(): void {
        if (this.isHarvesting || this.harvestPromise) return;
        console.log('[SCOUT_ORCHESTRATOR] Initiating background revalidation...');
        this.harvestData(true).catch(e => console.error('[SCOUT_ORCHESTRATOR] Background Harvest Failed:', e));
    }

    private async harvestData(force: boolean = false): Promise<ScoutReport> {
        if (this.harvestPromise) return this.harvestPromise;

        this.harvestPromise = (async () => {
            this.isHarvesting = true;
            try {
                // Check for Satellite truth first
                if (!force) {
                    const latestTruth = await Cache.getLatestTruthRecord();
                    const isSatelliteTruth = latestTruth?.scoutNote?.includes('[SATELLITE_SYNC]') ||
                        latestTruth?.scoutNote?.includes('[AGENT_SYNC]') ||
                        latestTruth?.scoutNote?.includes('[USER_OVERRIDE]');

                    if (latestTruth && isSatelliteTruth) {
                        const ageInMinutes = Math.round((Date.now() - latestTruth.timestamp) / (1000 * 60));
                        console.log(`[SCOUT_ORCHESTRATOR] 🛰️ Satellite Intelligence Detected (${ageInMinutes}m ago). Skipping redundant harvest.`);
                        Cache.setCache(latestTruth);
                        globalMarketService.injectMetrics({
                            dominance: latestTruth.dominance as any,
                            globalCrypto: latestTruth.globalCrypto,
                            globalDeFi: latestTruth.globalDeFi
                        });
                        return latestTruth;
                    }
                }

                console.log('[SCOUT_ORCHESTRATOR] Performing Fresh Macro Harvest...');

                // Sync Notes
                try {
                    const noteRes = await fetch('/user_note.txt');
                    if (noteRes.ok) {
                        const text = await noteRes.text();
                        await this.ingestUserNotes(text);
                        await ScoutSourceService.syncFromNotes(text);
                    }
                } catch (e) {
                    console.warn("[SCOUT_ORCHESTRATOR] Could not read user_note.txt");
                }

                // Parallel Harvest
                const trackedProtocols = Watchtower.getTrackedProtocols();
                const monitoredChains = JSON.parse(localStorage.getItem('monitored_chains') || '["ethereum", "solana", "sui", "arbitrum"]');

                const [stables, ecosystems, yields, bridgeFlows, globalDeFi, trustedSources] = await Promise.all([
                    Fetcher.fetchStablecoinData(),
                    Fetcher.fetchEcosystemTVL(trackedProtocols),
                    Fetcher.fetchYields([]),
                    Fetcher.fetchBridgeFlows(),
                    Fetcher.fetchGlobalDeFiMetrics(Cache.getCache()?.globalDeFi, Cache.getCache()?.globalCrypto),
                    ScoutSourceService.getAll()
                ]);

                // Build report
                const scoutNote = Transformer.formatScoutNote(
                    `Fresh harvest complete. DeFi MC: $${globalDeFi.marketCap.toFixed(2)}B`,
                    'HARVEST'
                );

                const report: ScoutReport = {
                    timestamp: Date.now(),
                    stables,
                    ecosystems,
                    sentiment: { value: 40, label: 'Neutral' },
                    dominance: { btc: 58, usdt: 4.5, usdc: 1.2, others: 36.3, othersMarketCap: 1100 },
                    yields,
                    bridgeFlows,
                    chainStats: {},
                    globalDeFi,
                    globalCrypto: { marketCap: 3100, volume24h: 85 },
                    altcoinSeasonIndex: 25,
                    trustedSources: Object.fromEntries(trustedSources.map(s => [s.name, s.url])),
                    scoutNote
                };

                // Sync with GlobalMarketService
                globalMarketService.injectMetrics({
                    dominance: report.dominance as any,
                    globalCrypto: report.globalCrypto,
                    globalDeFi: report.globalDeFi
                });

                // Persist
                await Cache.persistReport(report);
                Cache.setCache(report);

                // Broadcast
                window.dispatchEvent(new CustomEvent('strategist_intel_updated', { detail: report }));
                window.dispatchEvent(new CustomEvent('scout_report_updated', { detail: report }));

                return report;
            } catch (error) {
                console.error('[SCOUT_ORCHESTRATOR] Harvest Failed:', error);
                return Cache.getCache() || Transformer.getFallbackReport();
            } finally {
                this.isHarvesting = false;
                this.harvestPromise = null;
            }
        })();

        return this.harvestPromise;
    }

    private async runWatchtowerCycle(): Promise<void> {
        try {
            console.log("[SCOUT_ORCHESTRATOR] 🗼 Watchtower Scanning...");

            const { WatchlistService } = await import('../database/OtherServices');
            const { StrategistIntelligenceService } = await import('../StrategistIntelligenceService');

            const watchlist = await WatchlistService.getAll();
            if (watchlist.length === 0) return;

            let targetSymbol = "";
            for (const item of watchlist) {
                const intel = await StrategistIntelligenceService.getIntel(item.symbol);
                const lastUpdate = intel?.updatedAt || 0;
                const hoursSince = (Date.now() - lastUpdate) / (1000 * 60 * 60);

                if (hoursSince > 12) {
                    targetSymbol = item.symbol;
                    break;
                }
            }

            if (!targetSymbol) {
                console.log("[SCOUT_ORCHESTRATOR] 🗼 All Watchlist assets are fresh.");
                return;
            }

            console.log(`[SCOUT_ORCHESTRATOR] 🗼 Target: ${targetSymbol}. Launching research...`);

            const brief = await this.getScoutBrief(targetSymbol);
            const dossier = await this.performDeepResearch(`${targetSymbol} crypto project team founder unlocks`);

            if (dossier === 'ERROR_BLOCKED') {
                console.warn(`[SCOUT_ORCHESTRATOR] 🛡️ Rate limit for ${targetSymbol}. Retrying in 15m...`);
                setTimeout(() => this.runWatchtowerCycle(), 15 * 60 * 1000);
                return;
            }

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

            console.log(`[SCOUT_ORCHESTRATOR] 🗼 Watchtower Complete: ${targetSymbol}`);
        } catch (e) {
            console.warn("[SCOUT_ORCHESTRATOR] Watchtower Error:", e);
        }
    }
}

// Export singleton instance (backward compatible)
export const DataScoutService = new DataScoutServiceClass();
DataScoutService.initListener();
DataScoutService.startWatchtower();
(window as any)._scout = DataScoutService;

// Legacy alias
export const scoutService = DataScoutService;
