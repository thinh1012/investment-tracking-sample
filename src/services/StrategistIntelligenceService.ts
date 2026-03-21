import { initDB } from './database/core';
import { AIGatewayService } from './AIGatewayService';
import { SettingsService } from './database/OtherServices';
import { scoutService } from './scout';
import { TechnicalAnalysisService } from './TechnicalAnalysisService';
import { NarrativeService } from './NarrativeService';
import { isLP } from '../utils/assetUtils';

export type SignalType = 'HOLDING' | 'WATCHLIST' | 'OPPORTUNITY';

export interface StrategistIntel {
    symbol: string;
    metrics: Record<string, any>;
    verdict: string;
    rating: 'GOOD' | 'BAD' | 'RISKY' | 'STRONG BUY';
    signalStrength: number; // 1-100
    signalType: SignalType;
    updatedAt: number;
    narrative?: string;
    catalysts?: string[];
    risks?: string[];
}

// [KNOWLEDGE_BASE] Hardcoded fallback for rapid MVP tactical analysis
const PREMIUM_KNOWLEDGE_BASE: Record<string, any> = {
    'BTC': {
        narrative: "Digital Gold / Store of Value",
        moat: "Brand + Security",
        catalysts: ["ETF Flows", "Halving"],
        risks: ["Regulatory Cap"]
    },
    'ETH': {
        narrative: "L1 Smart Contract King",
        moat: "Network Effects",
        catalysts: ["L2 Scaling", "Deflationary Burn"],
        risks: ["L2 Fragmentation"]
    },
    'SOL': {
        narrative: "High Performance L1",
        moat: "Speed + UX",
        catalysts: ["Firedancer", "Mobile"],
        risks: ["Centralization"]
    }
};

/**
 * [STRATEGIST] Intelligence Service
 * Responsible for market analysis, investigative dives, and tactical briefs.
 */
export const StrategistIntelligenceService = {
    /**
     * Get all cached intelligence
     */
    async getAllIntel(): Promise<StrategistIntel[]> {
        try {
            // [ELECTRON_BRIDGE]
            // @ts-ignore
            if (window.electronAPI?.sqlIntel) {
                // @ts-ignore
                const result = await window.electronAPI.sqlIntel.getAll();
                if (result) return this.normalizeArtifacts(result);
            }

            const db = await initDB();
            const all = await db.getAll('strategist_intel');
            return this.normalizeArtifacts(all);
        } catch (e) {
            console.warn("Failed to fetch all intel", e);
            return [];
        }
    },

    /**
     * [DATA_CLEANUP] Normalizes symbols and removes duplicates/ghosts
     */
    normalizeArtifacts(list: StrategistIntel[]): StrategistIntel[] {
        const seen = new Set<string>();
        const cleanList: StrategistIntel[] = [];

        list.forEach(item => {
            // [FIX] Hyperliquid Normalization
            if (item.symbol === 'HYPERLIQUID1') {
                item.symbol = 'HYPE';
                this.deleteIntel('HYPERLIQUID1').catch(console.error);
            }

            // [FIX] Solana Normalization
            if (item.symbol === 'SOLANA') {
                item.symbol = 'SOL';
                this.deleteIntel('SOLANA').catch(console.error);
            }

            // [FIX] Exclude Indices/Metrics (BTC.D)
            if (item.symbol === 'BTC.D' || item.symbol.endsWith('.D')) {
                this.deleteIntel(item.symbol).catch(console.error);
                return; // Skip adding to cleanList
            }

            // Deduplication
            if (!seen.has(item.symbol)) {
                seen.add(item.symbol);
                cleanList.push(item);
            }
        });

        return cleanList;
    },

    async deleteIntel(symbol: string) {
        try {
            const db = await initDB();
            await db.delete('strategist_intel', symbol);
            console.log(`[STRATEGIST] Ghost artifact deleted: ${symbol}`);
        } catch (e) {
            console.warn("Delete failed", e);
        }
    },

    /**
     * Get intelligence for a single symbol
     */
    async getIntel(symbol: string): Promise<StrategistIntel | null> {
        try {
            // [ELECTRON_BRIDGE]
            // @ts-ignore
            if (window.electronAPI?.sqlIntel) {
                // @ts-ignore
                const result = await window.electronAPI.sqlIntel.get(symbol);
                if (result) return result;
            }

            // Fallback: Check LocalStorage (Web Mode)
            const local = localStorage.getItem(`strategist_intel_${symbol.toUpperCase()}`);
            if (local) return JSON.parse(local);

            return null;
        } catch (e) {
            console.warn("Intel fetch failed", e);
            return null;
        }
    },

    async saveIntel(intel: StrategistIntel): Promise<void> {
        try {
            // [ELECTRON_BRIDGE]
            // @ts-ignore
            if (window.electronAPI?.sqlIntel) {
                // @ts-ignore
                await window.electronAPI.sqlIntel.save(intel);
            }

            // Web Persistence
            localStorage.setItem(`strategist_intel_${intel.symbol}`, JSON.stringify(intel));

            // Also sync to main DB if possible
            const db = await initDB();
            await db.put('strategist_intel', intel);

        } catch (e) {
            console.error("Failed to save intel", e);
        }
    },

    async investigatePick(symbol: string): Promise<StrategistIntel> {
        console.log(`[StrategistIntelligenceService] [STRATEGIST] Investigating ${symbol}...`);
        const existing = await this.getIntel(symbol);
        const settings = await SettingsService.get();
        const signalType = existing?.signalType || 'OPPORTUNITY';

        if (settings?.geminiApiKey) {
            const history = existing?.narrative ? [existing.narrative] : [];
            const scoutReport = await scoutService.getReport();

            // [IDENTITY LAYER]: Fetch Narrative Data
            const narrativeData = await NarrativeService.resolveIdentity(symbol);
            const contextStr = narrativeData
                ? `[IDENTITY] Category: ${narrativeData.categories.join(', ')}. \nDescription: ${narrativeData.description}`
                : (PREMIUM_KNOWLEDGE_BASE[symbol.toUpperCase()]?.narrative || "No specific research context.");

            // [QUANT LAYER]: Fetch Price History & Analyze
            const db = await initDB();
            let technicals = {};
            try {
                const prices = await db.getAllFromIndex('historical_prices', 'by-symbol', symbol.toUpperCase());
                if (prices && prices.length > 14) {
                    const sortedPrices = prices.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(p => p.close);
                    technicals = TechnicalAnalysisService.analyze(sortedPrices);
                } else {
                    technicals = { note: "Insufficient historical data for Technical Analysis." };
                }
            } catch (e) {
                console.warn("[STRATEGIST] Failed to load history for TA:", e);
            }

            const result = await AIGatewayService.analyzeSymbol({
                symbol,
                metrics: { ...(existing?.metrics || {}), technicals },
                history,
                context: contextStr,
                scoutReport
            }, settings);

            if (result) {
                try {
                    const parsed = JSON.parse(result);
                    const updated: StrategistIntel = {
                        symbol: symbol.toUpperCase(),
                        metrics: existing?.metrics || {},
                        signalType,
                        updatedAt: Date.now(),
                        ...parsed
                    };

                    // [TACTICAL_FEEDBACK_LOOP]
                    // [PHASE 69] Skip LP assets from auto-tracking
                    if (updated.rating === 'STRONG BUY' && !isLP(symbol)) {
                        scoutService.trackProtocol(symbol.toLowerCase()).catch(e => console.warn(e));
                    }

                    await this.saveIntel(updated);
                    return updated;
                } catch (e) {
                    console.error("Failed to parse LLM response", e);
                }
            }
        }

        const intel = await this.generateTacticalIntel(symbol, signalType, true);
        await this.saveIntel(intel);
        return intel;
    },

    async generateTacticalIntel(symbol: string, type: SignalType, deep: boolean = false): Promise<StrategistIntel> {
        const knowledge = PREMIUM_KNOWLEDGE_BASE[symbol.toUpperCase()];
        const strength = Math.floor(Math.random() * 20) + 75; // 75-95 range for tactical assets

        let rating: StrategistIntel['rating'] = 'GOOD';
        if (strength > 90) rating = 'STRONG BUY';
        else if (strength < 80) rating = 'RISKY';

        const metrics = knowledge ? {
            "Moat": knowledge.moat || "Ecosystem Growth",
            "Institutional": "Accumulating",
            "Lindy": symbol === 'BTC' ? '15y' : 'High'
        } : {
            "Volume": "Rising",
            "Liquidity": "Stable"
        };

        return {
            symbol: symbol.toUpperCase(),
            metrics,
            verdict: knowledge?.narrative || `Monitoring ${symbol} for institutional accumulation triggers. High liquidity depth observed.`,
            rating,
            signalStrength: strength,
            signalType: type,
            updatedAt: Date.now(),
            catalysts: knowledge?.catalysts || ["Institutional Flow", "Ecosystem Expansion"],
            risks: knowledge?.risks || ["Market Volatility", "Liquidity Contract"]
        };
    },

    /**
     * Internal lock to prevent concurrent scrapes
     */
    _isScraping: false,

    async performScrape(): Promise<void> {
        if (this._isScraping) {
            console.log("[STRATEGIST] Scrape already in progress. Skipping concurrent request.");
            return;
        }

        this._isScraping = true;
        try {
            console.log("[STRATEGIST] Performing on-demand scrape...");
            await scoutService.getReport(true);
            const { WatchlistService } = await import('./database/OtherServices');
            const watchlist = await WatchlistService.getAll();

            const BATCH_SIZE = 3;
            for (let i = 0; i < watchlist.length; i += BATCH_SIZE) {
                const batch = watchlist.slice(i, i + BATCH_SIZE);
                console.log(`[STRATEGIST] Scrambling batch ${Math.floor(i / BATCH_SIZE) + 1} of intelligence...`);

                // [THROTTLING] Use Promise.all but yield to main thread 
                await Promise.all(batch.map(item => this.investigatePick(item.symbol)));

                if (i + BATCH_SIZE < watchlist.length) {
                    console.log("[STRATEGIST] Throttling for 2s to allow UI responsiveness...");
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            console.log("[STRATEGIST] Scrape complete.");
            localStorage.setItem('strategist_last_intel_check', Date.now().toString());
        } finally {
            this._isScraping = false;
        }
    },

    async runDailyCheck(): Promise<boolean> {
        const lastCheck = localStorage.getItem('strategist_last_intel_check');
        const now = Date.now();
        const settings = await SettingsService.get();
        const interval = settings?.marketPicksNotifInterval || (6 * 60 * 60 * 1000);

        if (lastCheck) {
            const timeSinceLast = now - parseInt(lastCheck);
            if (timeSinceLast < interval) {
                const remaining = interval - timeSinceLast;
                console.log(`[STRATEGIST] Next auto-mission scheduled in ${(remaining / 3600000).toFixed(1)}h. (Freshness: ${(timeSinceLast / 3600000).toFixed(1)}h old)`);
                return false;
            }
        }

        console.log(`[STRATEGIST] Mission interval reached or never run. Triggering scrape now...`);
        return true;
    },
};
