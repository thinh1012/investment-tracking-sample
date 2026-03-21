import { isLP } from '../utils/assetUtils';
import { PriceDataService } from './database/OtherServices';
import { ExternalScoutService } from './ExternalScoutService';
import { scoutService } from './scout';
import { ScoutReport } from './database/types';
import { fearGreedService } from './FearGreedService';
import { SCOUT_URL } from '../config/scoutConfig';

/**
 * [INTELLIGENCE_SYNC_SERVICE]
 * Bridge that pulls harvested data from the Satellite Scout into the HQ Vault.
 * Acting as a 'Price Oracle' for local tracking.
 */
export class IntelligenceSyncService {
    private static POLL_INTERVAL = 1000 * 60 * 5; // 5 minutes
    private static intervalId: any = null;
    private static get API_URL() { return SCOUT_URL; }
    private static lastSyncTime: number = 0;
    private static DEBOUNCE_MS = 30000; // 30 second debounce for focus sync
    private static focusHandler: (() => void) | null = null;
    private static isSyncing: boolean = false;

    static start() {
        if (this.intervalId) return;

        console.log('[INTEL_SYNC] 📡 Autonomous Oracle Sync Started.');
        this.performSync();
        this.intervalId = setInterval(() => this.performSync(), this.POLL_INTERVAL);

        // [FOCUS-SYNC] Trigger immediate sync when window regains focus
        this.focusHandler = () => {
            const now = Date.now();
            if (now - this.lastSyncTime > this.DEBOUNCE_MS) {
                console.log('[INTEL_SYNC] 🎯 Focus-Sync triggered.');
                this.performSync();
            }
        };
        window.addEventListener('focus', this.focusHandler);
    }

    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.focusHandler) {
            window.removeEventListener('focus', this.focusHandler);
            this.focusHandler = null;
        }
    }

    /** Public method for on-demand sync triggers */
    static async triggerSync() {
        await this.performSync();
    }


    private static async performSync() {
        if (this.isSyncing) return;
        this.isSyncing = true;
        this.lastSyncTime = Date.now(); // Update for debounce tracking
        try {
            const isOnline = await ExternalScoutService.checkStatus();
            if (!isOnline) {
                console.log('[INTEL_SYNC] 💤 Satellite offline, triggering API fallbacks...');
                // [PHASE 93] Trigger API fallback for Fear & Greed when Scout is down
                await fearGreedService.refresh();
                return;
            }

            console.log('[INTEL_SYNC] 🔄 Synchronizing intelligence vault...');
            const res = await fetch(`${this.API_URL}/intel/vault`);
            if (!res.ok) throw new Error('Failed to fetch from Satellite vault');

            const records = await res.json();

            if (records && Array.isArray(records)) {
                let updatedCount = 0;
                let marketUpdate: Partial<ScoutReport> = {};

                for (const record of records) {
                    const label = record.label;
                    const rawVal = record.value.toString().replace(/[$,]/g, '');
                    const numVal = parseFloat(rawVal);

                    if (isNaN(numVal) || numVal === 404 || numVal <= 0) {
                        if (numVal === 404) {
                            const symbol = label.replace('_PRICE', '').toUpperCase();
                            console.warn(`[INTEL_SYNC] 🚨 Faulty 404 Price detected for ${symbol}. Purging from local database to force escalation to alternative sources.`);
                            await PriceDataService.deleteManualPrice(symbol);
                        }
                        continue;
                    }

                    // 1. High-Fidelity Market Signals (Priority)
                    if (label === 'FEAR_GREED') {
                        marketUpdate.sentiment = { value: numVal, label: this.getSentimentLabel(numVal) };
                        // [PHASE 93] Inject Scout data into FearGreedService cache
                        fearGreedService.injectScoutData(numVal);
                        updatedCount++;
                    }
                    else if (label === 'ALT_SEASON') {
                        marketUpdate.altcoinSeasonIndex = numVal;
                        updatedCount++;
                    }
                    else if (label === 'GLOBAL_CAP') {
                        marketUpdate.globalCrypto = { ...marketUpdate.globalCrypto, marketCap: numVal / 1e9 } as any;
                        updatedCount++;
                    }
                    else if (label === 'CRYPTO_VOL' || label === 'GLOBAL_VOL') {
                        marketUpdate.globalCrypto = { ...marketUpdate.globalCrypto, volume24h: numVal / 1e9 } as any;
                        updatedCount++;
                    }
                    else if (label === 'STABLE_CAP') {
                        marketUpdate.stables = { ...marketUpdate.stables, totalCap: numVal / 1e9 } as any;
                        updatedCount++;
                    }
                    else if (label === 'DEFI_CAP') {
                        // FIX: Explicitly ensure DeFi Market Cap is mapped from Satellite signal
                        marketUpdate.globalDeFi = { ...marketUpdate.globalDeFi, marketCap: numVal / 1e9 } as any;
                        updatedCount++;
                    }
                    else if (label === 'DEFI_VOL') {
                        // FIX: Explicitly ensure DeFi Volume is mapped from Satellite signal
                        marketUpdate.globalDeFi = { ...marketUpdate.globalDeFi, volume24h: numVal / 1e9 } as any;
                        updatedCount++;
                    }
                    // 2. Asset Prices (Secondary)
                    else if (label.endsWith('_PRICE')) {
                        const symbol = label.replace('_PRICE', '').toUpperCase();
                        await PriceDataService.saveManualPrice(symbol, numVal);
                        updatedCount++;
                    }
                    else if (label === 'BTC_DOM') {
                        marketUpdate.dominance = { ...marketUpdate.dominance, btc: numVal } as any;
                        // [PHASE 91] Persist to price bank for Watchlist/MarketPicks
                        await PriceDataService.saveManualPrice('BTC.D', numVal);
                        updatedCount++;
                    }
                    else if (label === 'ETH_DOM') {
                        marketUpdate.dominance = { ...marketUpdate.dominance, eth: numVal } as any;
                        updatedCount++;
                    }
                    else if (label === 'USDT_DOM' || label === 'USDT.D') {
                        marketUpdate.dominance = { ...marketUpdate.dominance, usdt: numVal } as any;
                        // [PHASE 91] Persist to price bank for Watchlist/MarketPicks
                        await PriceDataService.saveManualPrice('USDT.D', numVal);
                        updatedCount++;
                    }
                    else if (label === 'USDC_DOM' || label === 'USDC.D') {
                        marketUpdate.dominance = { ...marketUpdate.dominance, usdc: numVal } as any;
                        // [PHASE 91] Persist to price bank for Watchlist/MarketPicks
                        await PriceDataService.saveManualPrice('USDC.D', numVal);
                        updatedCount++;
                    }

                    else if (label === 'BRIDGE_VOL') {
                        marketUpdate.bridgeFlows = { ...marketUpdate.bridgeFlows, total24h: numVal / 1e6 } as any;
                        updatedCount++;
                    }
                    else if (label.endsWith('_TVL')) {
                        const chain = label.replace('_TVL', '').toUpperCase();
                        if (!marketUpdate.ecosystems) marketUpdate.ecosystems = {};
                        marketUpdate.ecosystems[chain] = { ...marketUpdate.ecosystems[chain], tvl: numVal };

                        // Also populate chainStats for deeper analytics
                        if (!marketUpdate.chainStats) marketUpdate.chainStats = {};
                        marketUpdate.chainStats[chain.toLowerCase()] = { ...marketUpdate.chainStats[chain.toLowerCase()], tvl: numVal } as any;
                        updatedCount++;
                    }
                    else if (label.endsWith('_TVL_CHANGE')) {
                        const chain = label.replace('_TVL_CHANGE', '').toUpperCase();
                        if (!marketUpdate.ecosystems) marketUpdate.ecosystems = {};
                        marketUpdate.ecosystems[chain] = { ...marketUpdate.ecosystems[chain], change7d: numVal };

                        if (!marketUpdate.chainStats) marketUpdate.chainStats = {};
                        marketUpdate.chainStats[chain.toLowerCase()] = { ...marketUpdate.chainStats[chain.toLowerCase()], change24h: numVal } as any;
                        updatedCount++;
                    }
                    else if (label.endsWith('_REV') || label.endsWith('_REVENUE')) {
                        const chain = label.replace('_REV', '').replace('_REVENUE', '').toLowerCase();
                        if (!marketUpdate.chainStats) marketUpdate.chainStats = {};
                        marketUpdate.chainStats[chain] = { ...marketUpdate.chainStats[chain], revenue24h: numVal } as any;
                        updatedCount++;
                    }
                    else if (label.endsWith('_FEES') || label.endsWith('_FEE')) {
                        const chain = label.replace('_FEES', '').replace('_FEE', '').toLowerCase();
                        if (!marketUpdate.chainStats) marketUpdate.chainStats = {};
                        marketUpdate.chainStats[chain] = { ...marketUpdate.chainStats[chain], fees24h: numVal } as any;
                        updatedCount++;
                    }
                    else if (label.endsWith('_APY') || label.endsWith('_YIELD')) {
                        const symbol = label.replace('_APY', '').replace('_YIELD', '').toUpperCase();
                        if (!marketUpdate.yields) marketUpdate.yields = [];
                        // Check if already exists to update
                        const existingIdx = marketUpdate.yields.findIndex(y => y.symbol === symbol);
                        const yieldRecord = { symbol, pool: 'Satellite Pool', project: 'Oracle', apy: numVal, tvlUsd: 0 };
                        if (existingIdx >= 0) marketUpdate.yields[existingIdx] = yieldRecord;
                        else marketUpdate.yields.push(yieldRecord);
                        updatedCount++;
                    }
                }

                if (Object.keys(marketUpdate).length > 0) {
                    console.log('[INTEL_SYNC] 💉 Injecting high-fidelity market telemetry...');
                    marketUpdate.scoutNote = `📡 [SATELLITE_SYNC]: Real-time signals bridged from Scout.`;
                    await scoutService.injectAgenticReport(marketUpdate);
                }

                if (updatedCount > 0) {
                    console.log(`[INTEL_SYNC] ✅ Successfully ingested ${updatedCount} oracle signals.`);
                    window.dispatchEvent(new CustomEvent('oracle_prices_updated'));
                    window.dispatchEvent(new CustomEvent('strategist_intel_updated'));
                }
            }

            // [BI-DIRECTIONAL SYNC]: Push Vault's market picks to Satellite as missions
            await this.pushMarketPicksToSatellite();

        } catch (error: any) {
            console.warn('[INTEL_SYNC] ⚠️ Pulse synchronization failed:', error.message);
            // Quick retry if it fails (10 seconds)
            setTimeout(() => this.performSync(), 10000);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * [BI-DIRECTIONAL SYNC]: Pushes market picks from Vault to Satellite Scout
     * This ensures that any new symbols added to Market Picks get auto-generated as scout missions.
     */
    private static async pushMarketPicksToSatellite() {
        try {
            const { MarketPicksService, WatchlistService } = await import('./database/OtherServices');
            const { initDB } = await import('./database/core');

            // Get all market picks, watchlist items, and holdings
            const picks = await MarketPicksService.getAll();
            const watchlist = await WatchlistService.getAll();

            // Get unique asset symbols from transactions (holdings)
            const db = await initDB();
            const transactions = await db.getAll('transactions');

            // Combine unique symbols from all sources
            const symbols = new Set<string>();

            // Market Picks
            picks.forEach(p => symbols.add(p.symbol.toUpperCase()));

            // Watchlist
            watchlist.forEach(w => symbols.add(w.symbol.toUpperCase()));

            // Holdings (from transactions) - exclude stablecoins and LP tokens
            const stablecoins = ['USDT', 'USDC', 'DAI', 'USDS', 'PYUSD', 'USD'];
            transactions.forEach(tx => {
                const sym = tx.assetSymbol.toUpperCase();
                // [PHASE 97] Use hardened isLP check to prevent mission leaks
                if (!stablecoins.includes(sym) && !isLP(sym)) {
                    symbols.add(sym);
                }
            });

            if (symbols.size === 0) return;


            // Get existing presets from Satellite
            const presetsRes = await fetch(`${this.API_URL}/presets`);
            if (!presetsRes.ok) return;

            const existingPresets = await presetsRes.json();
            const existingLabels = new Set(existingPresets.map((p: any) => p.label.replace('_PRICE', '').toUpperCase()));

            // Find symbols that don't have missions yet
            const newSymbols = Array.from(symbols).filter(s => !existingLabels.has(s));

            if (newSymbols.length === 0) {
                console.log('[INTEL_SYNC] 📡 All market picks already have scout missions.');
                return;
            }

            console.log(`[INTEL_SYNC] 🆕 Pushing ${newSymbols.length} potential targets to guarded sync: ${newSymbols.join(', ')}`);

            for (const symbol of newSymbols) {
                // [PHASE 72] Use unified service to ensure LP decomposition & deduplication
                await ExternalScoutService.notifyNewToken(symbol);

                // Small delay between tokens to avoid hammering local API
                await new Promise(r => setTimeout(r, 200));
            }

        } catch (error) {
            console.warn('[INTEL_SYNC] ⚠️ Market picks push failed:', error);
        }
    }

    private static getSentimentLabel(value: number): string {
        if (value <= 25) return 'Extreme Fear';
        if (value <= 45) return 'Fear';
        if (value <= 55) return 'Neutral';
        if (value <= 75) return 'Greed';
        return 'Extreme Greed';
    }
}

