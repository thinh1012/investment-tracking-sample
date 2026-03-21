import { isLP, decomposeLP } from '../utils/assetUtils';
import { SCOUT_URL } from '../config/scoutConfig';

/**
 * [EXTERNAL_SCOUT_SERVICE]
 * Bridge to the decoupled high-fidelity scraper (scout-crypto-data).
 */
export class ExternalScoutService {
    private static get API_URL() { return SCOUT_URL; }
    private static syncedSet = new Set<string>(); // [DEDUP] Local cache to prevent redundant bursts

    /**
     * [PULSE_CHECK]
     * Verifies if the satellite scout is online.
     */
    static async checkStatus(): Promise<boolean> {
        try {
            const res = await fetch(`${this.API_URL}/health`);
            return res.ok;
        } catch {
            return false;
        }
    }

    /**
     * [HARVEST_COMMAND]
     * Dispatches a tactical scrape request to the external engine.
     */
    static async triggerScrape(url: string, selector: string, label: string): Promise<any> {
        try {
            console.log(`[EXTERNAL_SCOUT] 📡 Dispatching mission to satellite: ${label}`);
            const res = await fetch(`${this.API_URL}/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, selector, label })
            });

            if (!res.ok) throw new Error('Satellite Scout returned error');
            const { data } = await res.json();
            return data;
        } catch (error: any) {
            console.error('[EXTERNAL_SCOUT] ❌ Mission Failed:', error.message);
            throw error;
        }
    }
    /**
     * [INTELLIGENCE_SYNC]
     * Notifies the satellite to prepare a scouting mission for a new token.
     * [PHASE 69] Skips Liquidity Pools as they aren't suitable for macro scouting.
     * [PHASE 70] Decomposes LPs and syncs their underlying tokens instead.
     * [PHASE 72] Implements deduplication to avoid redundant hits.
     */
    static async notifyNewToken(symbol: string): Promise<void> {
        const cleanSymbol = symbol.toUpperCase().trim();
        if (this.syncedSet.has(cleanSymbol)) return;

        if (isLP(cleanSymbol)) {
            console.log(`[EXTERNAL_SCOUT] 🛡️ LP detected: ${cleanSymbol}. Decomposing...`);
            this.syncedSet.add(cleanSymbol); // Prevent re-decomposition in same session

            const components = decomposeLP(cleanSymbol);
            for (const token of components) {
                console.log(`[EXTERNAL_SCOUT] 🔗 Syncing LP component: ${token}`);
                await this.notifyNewToken(token); // Recursive call for each component
            }
            return;
        }

        try {
            console.log(`[EXTERNAL_SCOUT] 📣 Synchronizing new intelligence target: ${cleanSymbol}`);
            await fetch(`${this.API_URL}/missions/auto-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: cleanSymbol })
            });
            this.syncedSet.add(cleanSymbol); // Mark as synced
        } catch (error: any) {
            console.warn('[EXTERNAL_SCOUT] ⚠️ Sync Notification Failed:', error.message);
        }
    }

    /**
     * [NOTIFICATION_SYNC]
     * Pushes notification channel configurations (Telegram, WhatsApp) to the satellite.
     */
    static async syncNotificationConfig(config: any): Promise<void> {
        try {
            console.log(`[EXTERNAL_SCOUT] 🔄 Pushing notification bridge config to satellite...`);
            await fetch(`${this.API_URL}/config/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
        } catch (error: any) {
            console.warn('[EXTERNAL_SCOUT] ⚠️ Config Sync Failed:', error.message);
        }
    }
}
