import { initDB } from './core';
import { WatchlistItem, MarketPick } from './types';
import { NotificationLog, NotificationSettings } from '../../types';

export const LogService = {
    async add(log: NotificationLog) {
        const db = await initDB();
        await db.put('logs', log);

        // [LIMIT_LOGS] Keep only the 10 most recent logs as per user request
        const allLogs = await db.getAllFromIndex('logs', 'by-date');
        if (allLogs.length > 10) {
            const sorted = [...allLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const toDelete = sorted.slice(0, sorted.length - 10);
            const tx = db.transaction('logs', 'readwrite');
            await Promise.all(toDelete.map(oldLog => tx.store.delete(oldLog.id)));
            await tx.done;
        }

        window.dispatchEvent(new Event('notification-log-update'));
    },

    async getAll(limit?: number): Promise<NotificationLog[]> {
        const db = await initDB();
        const logs = await db.getAllFromIndex('logs', 'by-date');
        const reversed = logs.reverse();
        if (limit) {
            return reversed.slice(0, limit);
        }
        return reversed;
    },

    async clearAll() {
        const db = await initDB();
        await db.clear('logs');
    }
};

export const WatchlistService = {
    async getAll(): Promise<WatchlistItem[]> {
        const db = await initDB();
        const items = await db.getAll('watchlist');

        // SMART MERGE: Always reconcile with LocalStorage to prevent data loss
        const local = localStorage.getItem('investment_tracker_watchlist');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const dbIds = new Set(items.map(i => i.id));
                    const missingFromDb = parsed.filter((localItem: any) => !dbIds.has(localItem.id));

                    if (missingFromDb.length > 0) {
                        console.log(`[WatchlistService] Smart Merge: Hydrating ${missingFromDb.length} missing items from LocalStorage`);
                        const tx = db.transaction('watchlist', 'readwrite');
                        await Promise.all(missingFromDb.map(item => tx.store.put({
                            ...item,
                            targetBuyPrice: item.targetBuyPrice ?? item.targetPrice,
                            createdAt: item.createdAt || Date.now()
                        })));
                        await tx.done;

                        // Return the combined set
                        return [...items, ...missingFromDb];
                    }
                }
            } catch (e) {
                console.error("Watchlist reconciliation failed", e);
            }
        }
        return items;
    },

    async save(item: WatchlistItem) {
        const db = await initDB();
        const result = await db.put('watchlist', item);

        // Sync back to LocalStorage immediately
        const all = await db.getAll('watchlist');
        localStorage.setItem('investment_tracker_watchlist', JSON.stringify(all));

        return result;
    },

    async delete(id: string) {
        const db = await initDB();
        await db.delete('watchlist', id);

        // Sync back to LocalStorage
        const all = await db.getAll('watchlist');
        localStorage.setItem('investment_tracker_watchlist', JSON.stringify(all));
    },

    async bulkSave(items: WatchlistItem[]) {
        const db = await initDB();
        const tx = db.transaction('watchlist', 'readwrite');
        await tx.store.clear();
        await Promise.all(items.map(item => tx.store.put(item)));
        await tx.done;
        localStorage.setItem('investment_tracker_watchlist', JSON.stringify(items));
    }
};

export const MarketPicksService = {
    async getAll(): Promise<MarketPick[]> {
        const db = await initDB();
        return db.getAll('market_picks');
    },

    async add(pick: MarketPick) {
        const db = await initDB();
        const result = await db.put('market_picks', pick);

        return result;
    },

    async delete(symbol: string) {
        const db = await initDB();
        return db.delete('market_picks', symbol);
    }
};

export const SettingsService = {
    async get(): Promise<NotificationSettings | undefined> {
        const db = await initDB();
        let settings = await db.get('settings', 'global');

        if (!settings) {
            const local = localStorage.getItem('investment_tracker_notification_settings');
            if (local) {
                try {
                    settings = JSON.parse(local);
                    if (settings) {
                        await db.put('settings', settings, 'global');
                    }
                } catch (e) { console.error("Settings migration failed", e); }
            }
        }
        return settings;
    },

    async save(settings: NotificationSettings) {
        const db = await initDB();
        localStorage.setItem('investment_tracker_notification_settings', JSON.stringify(settings));
        return db.put('settings', settings, 'global');
    }
};

export const PriceDataService = {
    async getManualPrices(): Promise<{ prices: Record<string, number>, sources: Record<string, string> }> {
        const db = await initDB();
        const all = await db.getAll('manual_prices');
        const prices: Record<string, number> = {};
        const sources: Record<string, string> = {};

        all.forEach(p => {
            prices[p.symbol] = p.price;
            if (p.source) sources[p.symbol] = p.source;
        });

        if (all.length === 0) {
            const local = localStorage.getItem('investment_tracker_manual_prices');
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    const tx = db.transaction('manual_prices', 'readwrite');
                    Object.entries(parsed).forEach(([sym, price]) => {
                        if (typeof price === 'number') {
                            prices[sym] = price;
                            tx.store.put({ symbol: sym, price });
                        }
                    });
                    await tx.done;
                } catch (e) { console.error("Manual prices migration failed", e); }
            }
        }

        return { prices, sources };
    },

    async saveManualPrice(symbol: string, price: number, source?: string) {
        const db = await initDB();
        return db.put('manual_prices', { symbol, price, source });
    },

    async deleteManualPrice(symbol: string) {
        const db = await initDB();
        return db.delete('manual_prices', symbol);
    }
};

export const AssetOverrideService = {
    async getAll(): Promise<Record<string, { symbol: string; avgBuyPrice?: number; rewardTokens?: string[] }>> {
        const db = await initDB();
        const all = await db.getAll('asset_overrides');
        const map: Record<string, { symbol: string; avgBuyPrice?: number; rewardTokens?: string[] }> = {};
        all.forEach(item => map[item.symbol] = item);
        return map;
    },

    async save(symbol: string, overrides: { avgBuyPrice?: number; rewardTokens?: string[] }) {
        const db = await initDB();
        const existing = await db.get('asset_overrides', symbol);
        return db.put('asset_overrides', { symbol, ...(existing || {}), ...overrides });
    }
};

export const HistoricalPriceService = {
    async getAll(): Promise<{ symbol: string; date: string; open: number; close: number; id: string }[]> {
        const db = await initDB();
        return db.getAll('historical_prices');
    },

    async getBySymbol(symbol: string): Promise<{ symbol: string; date: string; open: number; close: number; id: string }[]> {
        const db = await initDB();
        return db.getAllFromIndex('historical_prices', 'by-symbol', symbol);
    },

    async saveBulk(items: { symbol: string; date: string; open: number; close: number; id: string }[]) {
        const db = await initDB();
        const tx = db.transaction('historical_prices', 'readwrite');
        await Promise.all(items.map(item => tx.store.put(item)));
        await tx.done;
    },

    async clearAll() {
        const db = await initDB();
        return db.clear('historical_prices');
    }
};

export const ManualHistoricalPriceService = {
    async getAll(): Promise<{ symbol: string; date: string; open: number; id: string }[]> {
        const db = await initDB();
        return db.getAll('manual_historical_prices');
    },

    async getBySymbol(symbol: string): Promise<{ symbol: string; date: string; open: number; id: string }[]> {
        const db = await initDB();
        return db.getAllFromIndex('manual_historical_prices', 'by-symbol', symbol.toUpperCase());
    },

    async save(item: { symbol: string; open: number; date: string }) {
        const db = await initDB();
        const id = `${item.symbol.toUpperCase()}_${item.date}`;
        return db.put('manual_historical_prices', { ...item, symbol: item.symbol.toUpperCase(), id });
    },

    async delete(id: string) {
        const db = await initDB();
        return db.delete('manual_historical_prices', id);
    }
};
