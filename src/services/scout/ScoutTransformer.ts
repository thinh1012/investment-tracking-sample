// [SCOUT_TRANSFORMER] - Data Normalization & Validation
// Extracted from DataScoutService for Single Responsibility

import type { ScoutReport } from '../database/types';

/**
 * Normalizes market cap values to Billions.
 * If value > 100k, it's likely a raw full number (e.g. 3T as 3,000,000,000,000)
 */
export function normalizeMarketCap(val: number): number {
    if (val === 0) return 0;

    // If value is extremely large (likely raw billions/trillions), normalize
    if (val > 100000) {
        // Likely a raw number, convert to billions
        return val / 1e9;
    }
    // If between 100 and 100000, it's probably already in billions (reasonable MC range)
    if (val > 100 && val < 100000) {
        return val;
    }
    // Very small value - might be in trillions already expressed as small number
    return val;
}

/**
 * Validates research content for "Soft 429" patterns (rate limiting indicators)
 */
export function validateResearchContent(results: any[]): boolean {
    const blockedPatterns = [
        'enable javascript',
        'please verify',
        'too many requests',
        'access denied',
        'cloudflare',
        'captcha'
    ];

    for (const result of results) {
        const text = JSON.stringify(result).toLowerCase();
        if (blockedPatterns.some(p => text.includes(p))) {
            console.warn('[SCOUT_TRANSFORMER] Detected blocked/rate-limited content in results.');
            return false;
        }
    }
    return true;
}

/**
 * Creates a safe fallback report with baseline values
 */
export function getFallbackReport(): ScoutReport {
    return {
        timestamp: Date.now(),
        stables: { totalCap: 160, change24h: 0.1 },
        ecosystems: {
            'ETHEREUM': { tvl: 45000000000, change7d: 0.5 },
            'SOLANA': { tvl: 8500000000, change7d: 1.2 },
            'SUI': { tvl: 1600000000, change7d: 2.5 }
        },
        sentiment: { value: 40, label: 'Neutral' },
        dominance: {
            btc: 58.5,
            usdt: 4.5,
            usdc: 1.2,
            others: 35.8,
            othersMarketCap: 1100
        },
        yields: [],
        bridgeFlows: { total24h: 150, topChains: [] },
        chainStats: {},
        globalDeFi: { marketCap: 88, volume24h: 6.2 },
        globalCrypto: { marketCap: 3100, volume24h: 85 },
        altcoinSeasonIndex: 25,
        trustedSources: {},
        scoutNote: '🛡️ [FALLBACK] Baseline intelligence loaded.'
    };
}

/**
 * Merges a partial report into an existing report (shallow merge for nested objects)
 */
export function mergeReports(current: ScoutReport, update: Partial<ScoutReport>): ScoutReport {
    return {
        ...current,
        ...update,
        // Shallow merge for nested objects
        sentiment: update.sentiment || current.sentiment,
        dominance: update.dominance ? { ...current.dominance, ...update.dominance } : current.dominance,
        globalCrypto: update.globalCrypto ? { ...current.globalCrypto, ...update.globalCrypto } : current.globalCrypto,
        globalDeFi: update.globalDeFi ? { ...current.globalDeFi, ...update.globalDeFi } : current.globalDeFi,
        chainStats: update.chainStats ? { ...current.chainStats, ...update.chainStats } : current.chainStats,
        ecosystems: update.ecosystems ? { ...current.ecosystems, ...update.ecosystems } : current.ecosystems,
        timestamp: Date.now(),
    };
}

/**
 * Formats a scout note with timestamp prefix
 */
export function formatScoutNote(message: string, type: 'HARVEST' | 'SYNC' | 'OVERRIDE' | 'FALLBACK' = 'HARVEST'): string {
    const emoji = {
        'HARVEST': '📡',
        'SYNC': '🛰️',
        'OVERRIDE': '👤',
        'FALLBACK': '🛡️'
    }[type];

    return `${emoji} [${type}]: ${message}`;
}
