/**
 * PortfolioSyncService.ts
 * 
 * Syncs portfolio data (assets, watchlist, market picks) to Scout for Daily Brief enrichment.
 * Automatically runs on app startup and can be triggered manually.
 */

import { SCOUT_URL } from '../config/scoutConfig';

const SCOUT_API = SCOUT_URL;

interface LPRange {
    min: number;
    max: number;
}

interface Asset {
    symbol: string;
    lpRange?: LPRange;
    monitorSymbol?: string;
    monitorPrice?: number;
    inRange?: boolean;
    quantity: number;
}

interface WatchlistItem {
    id: string;
    symbol: string;
    targetBuyPrice?: number;
    targetSellPrice?: number;
}

interface MarketPick {
    symbol: string;
    addedAt: number;
    note?: string;
}

interface PortfolioData {
    assets: Asset[];
    watchlist: WatchlistItem[];
    marketPicks: MarketPick[];
}

class PortfolioSyncServiceClass {
    private lastSyncTime: number | null = null;
    private syncInterval: number | null = null;
    private isSyncing: boolean = false;

    /**
     * Sync portfolio data to Scout
     */
    async syncToScout(portfolioData: PortfolioData): Promise<boolean> {
        if (this.isSyncing) {
            console.log('[PortfolioSync] Already syncing, skipping...');
            return false;
        }

        this.isSyncing = true;
        console.log('[PortfolioSync] 🔄 Starting sync to Scout...');
        console.log('[PortfolioSync] Data:', {
            assets: portfolioData.assets?.length || 0,
            watchlist: portfolioData.watchlist?.length || 0,
            marketPicks: portfolioData.marketPicks?.length || 0
        });

        try {
            console.log(`[PortfolioSync] 📡 Sending POST to ${SCOUT_API}/portfolio/sync`);
            const response = await fetch(`${SCOUT_API}/portfolio/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assets: portfolioData.assets || [],
                    watchlist: portfolioData.watchlist || [],
                    marketPicks: portfolioData.marketPicks || [],
                    timestamp: Date.now()
                })
            });

            console.log(`[PortfolioSync] Response status: ${response.status}`);

            if (response.ok) {
                const result = await response.json();
                this.lastSyncTime = Date.now();
                console.log(`[PortfolioSync] ✅ Synced: ${result.synced?.assets || 0} assets, ${result.synced?.watchlist || 0} watchlist, ${result.synced?.lpPositions || 0} LP positions`);
                return true;
            } else {
                const errorText = await response.text();
                console.error('[PortfolioSync] ❌ Scout returned error:', response.status, errorText);
                return false;
            }
        } catch (error: any) {
            console.error('[PortfolioSync] ⚠️ Request failed:', error.message);
            console.error('[PortfolioSync] Full error:', error);
            return false;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Start periodic sync (every 30 minutes)
     */
    startPeriodicSync(getPortfolioData: () => PortfolioData) {
        // Clear existing interval if any
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        // Initial sync after 5 seconds (let app load first)
        setTimeout(() => {
            this.syncToScout(getPortfolioData());
        }, 5000);

        // Then sync every 30 minutes
        this.syncInterval = window.setInterval(() => {
            this.syncToScout(getPortfolioData());
        }, 30 * 60 * 1000);

        console.log('[PortfolioSync] 📅 Periodic sync started (every 30 mins)');
    }

    /**
     * Stop periodic sync
     */
    stopPeriodicSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('[PortfolioSync] 🛑 Periodic sync stopped');
        }
    }

    /**
     * Get last sync time
     */
    getLastSyncTime(): number | null {
        return this.lastSyncTime;
    }
}

export const PortfolioSyncService = new PortfolioSyncServiceClass();
