// [SCOUT_CACHE] - Persistence & Cache Management
// Extracted from DataScoutService for Single Responsibility

import { initDB } from '../database/core';
import type { ScoutReport } from '../database/types';

// Cache State
let cache: ScoutReport | null = null;
let lastFetch = 0;
let recentReportsCache: ScoutReport[] = [];
let lastRecentFetch = 0;

const CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours
const GLOBAL_CACHE_DURATION = 1000 * 60 * 30; // 30 mins

/**
 * Gets the current in-memory cache
 */
export function getCache(): ScoutReport | null {
    return cache;
}

/**
 * Gets the last fetch timestamp
 */
export function getLastFetch(): number {
    return lastFetch;
}

/**
 * Updates the in-memory cache
 */
export function setCache(report: ScoutReport): void {
    cache = report;
    lastFetch = report.timestamp;
}

/**
 * Checks if cache is still valid
 */
export function isCacheValid(): boolean {
    return cache !== null && (Date.now() - lastFetch < CACHE_DURATION);
}

/**
 * Clears all caches for forced refresh
 */
export function clearCache(): void {
    cache = null;
    lastFetch = 0;
    recentReportsCache = [];
    lastRecentFetch = 0;
}

/**
 * Persists a report to IndexedDB
 */
export async function persistReport(report: ScoutReport): Promise<void> {
    try {
        const db = await initDB();
        await db.put('scout_reports', report);
    } catch (e) {
        console.warn('[SCOUT_CACHE] DB Persist Failed:', e);
    }
}

/**
 * Loads the latest report from IndexedDB
 */
export async function loadLatestFromDB(): Promise<ScoutReport | null> {
    try {
        const db = await initDB();
        const allItems = await db.getAll('scout_reports') as ScoutReport[];
        if (allItems.length > 0) {
            const latest = allItems.sort((a, b) => b.timestamp - a.timestamp)[0];
            return latest;
        }
    } catch (e) {
        console.warn('[SCOUT_CACHE] DB Load Failed:', e);
    }
    return null;
}

/**
 * Gets recent reports from IndexedDB with caching
 */
export async function getRecentReports(
    limit: number = 3,
    getFallbackReport: () => ScoutReport,
    triggerBackgroundHarvest: () => void
): Promise<ScoutReport[]> {
    if (recentReportsCache.length > 0 && (Date.now() - lastRecentFetch < GLOBAL_CACHE_DURATION)) {
        return recentReportsCache.slice(0, limit);
    }

    try {
        const db = await initDB();
        const all = await db.getAll('scout_reports') as ScoutReport[];

        if (all.length === 0) {
            console.log('[SCOUT_CACHE] No history found, providing fallback intelligence.');
            triggerBackgroundHarvest();
            return [getFallbackReport()];
        }

        const sorted = all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

        const isStale = sorted.length > 0 && (Date.now() - sorted[0].timestamp > CACHE_DURATION);
        const isLagging = sorted.length > 0 && (sorted[0].sentiment?.value !== undefined && sorted[0].sentiment.value <= 30);

        if (sorted.length === 0 || isStale || isLagging || !sorted[0].globalDeFi || sorted[0].altcoinSeasonIndex === undefined) {
            console.log('[SCOUT_CACHE] Stale, lagging or incomplete intelligence detected, upgrading...');
            triggerBackgroundHarvest();

            if (isStale || isLagging || sorted.length === 0) {
                return [getFallbackReport()];
            }
        }

        recentReportsCache = sorted;
        lastRecentFetch = Date.now();
        return sorted;
    } catch (e) {
        console.warn('[SCOUT_CACHE] Failed to fetch recent reports:', e);
        return [getFallbackReport()];
    }
}

/**
 * Gets the latest "truth record" (User Override or Scout Sync)
 */
export async function getLatestTruthRecord(): Promise<ScoutReport | null> {
    try {
        const db = await initDB();
        const all = await db.getAll('scout_reports') as ScoutReport[];
        if (all.length === 0) return null;

        // Sort by timestamp, newest first
        const sorted = all.sort((a, b) => b.timestamp - a.timestamp);

        // Find the first record that has a "truth" marker
        const truthRecord = sorted.find(r =>
            r.scoutNote?.includes('[SATELLITE_SYNC]') ||
            r.scoutNote?.includes('[AGENT_SYNC]') ||
            r.scoutNote?.includes('[USER_OVERRIDE]')
        );

        // If no truth record, return the latest
        return truthRecord || sorted[0];
    } catch (e) {
        console.warn('[SCOUT_CACHE] Truth record lookup failed:', e);
        return cache;
    }
}

export { CACHE_DURATION, GLOBAL_CACHE_DURATION };
