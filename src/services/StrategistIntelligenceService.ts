import { initDB } from './database/core';

export interface StrategistIntel {
    symbol: string;
    metrics: Record<string, any>;
    verdict: string;
    rating: 'GOOD' | 'BAD' | 'RISKY' | 'STRONG BUY';
    updatedAt: number;
}

const initialSeeds: StrategistIntel[] = [
    {
        symbol: "HYPE",
        metrics: { "Volume": "$2.56B", "TVL": "$1.46B", "Holders": "215K" },
        verdict: "Hyperliquid is the clear leader in decentralized derivatives. Strong growth & dominance.",
        rating: "STRONG BUY",
        updatedAt: 1735198800000 // Dec 26, 2025
    },
    {
        symbol: "SUI",
        metrics: { "TVL": "$915M", "Projects": "117", "Volume": "$474M" },
        verdict: "High capital efficiency and network utility. Primary Solana competitor.",
        rating: "GOOD",
        updatedAt: 1735198800000 // Dec 26, 2025
    }
];

// Utility to check if we are in Electron
const getElectronAPI = () => (window as any).electronAPI?.sqlIntel;

export const StrategistIntelligenceService = {
    async getIntel(symbol: string): Promise<StrategistIntel | undefined> {
        const sql = getElectronAPI();
        if (sql) {
            console.log("[StrategistIntelligenceService] Fetching from SQL:", symbol);
            return sql.get(symbol.toUpperCase());
        }

        const db = await initDB();
        return db.get('strategist_intel', symbol.toUpperCase());
    },

    async getAllIntel(): Promise<StrategistIntel[]> {
        const sql = getElectronAPI();
        if (sql) {
            console.log("[StrategistIntelligenceService] Fetching all from SQL...");
            let items = await sql.getAll();
            if (items.length === 0) {
                console.log("[StrategistIntelligenceService] Seeding initial SQL data...");
                for (const seed of initialSeeds) {
                    await sql.save(seed);
                }
                items = await sql.getAll();
            }
            return items;
        }

        const db = await initDB();
        let items = await db.getAll('strategist_intel');

        if (items.length === 0) {
            console.log("[StrategistIntelligenceService] Seeding initial IndexedDB data...");
            for (const seed of initialSeeds) {
                await db.put('strategist_intel', seed);
            }
            items = await db.getAll('strategist_intel');
        }

        return items;
    },

    async saveIntel(intel: StrategistIntel) {
        const sql = getElectronAPI();
        if (sql) {
            console.log("[StrategistIntelligenceService] Saving to SQL:", intel.symbol);
            return sql.save({
                ...intel,
                symbol: intel.symbol.toUpperCase(),
                updatedAt: Date.now()
            });
        }

        const db = await initDB();
        return db.put('strategist_intel', {
            ...intel,
            symbol: intel.symbol.toUpperCase(),
            updatedAt: Date.now()
        });
    },

    /**
     * Orchestrator to check if we need a refresh (once every 24h)
     */
    async runDailyCheck(): Promise<boolean> {
        const lastCheck = localStorage.getItem('strategist_last_intel_check');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (lastCheck && (now - parseInt(lastCheck)) < oneDay) {
            console.log("[StrategistIntelligenceService] Intelligence is fresh (last 24h). Skipping auto-scrape.");
            return false;
        }

        console.log("[StrategistIntelligenceService] Triggering Daily Intelligence Scrape...");
        // This will be called via the App component or a specific hook
        // We set the timestamp immediately to prevent double-firing
        localStorage.setItem('strategist_last_intel_check', now.toString());
        return true;
    }
};
