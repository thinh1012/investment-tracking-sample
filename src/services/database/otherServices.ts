import { initDB } from './core';
import { WatchlistItem, MarketPick } from './types';
import { NotificationLog, NotificationSettings } from '../../types';

export const LogService = {
    async add(log: NotificationLog) {
        const db = await initDB();
        const result = await db.put('logs', log);
        window.dispatchEvent(new Event('notification-log-update'));
        return result;
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

        if (items.length === 0) {
            const local = localStorage.getItem('investment_tracker_watchlist');
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const migrated = parsed.map((item: any) => ({
                            ...item,
                            targetBuyPrice: item.targetBuyPrice ?? item.targetPrice,
                        }));
                        await this.bulkSave(migrated);
                        return migrated;
                    }
                } catch (e) {
                    console.error("Watchlist migration failed", e);
                }
            }
        }
        return items;
    },

    async save(item: WatchlistItem) {
        const db = await initDB();
        return db.put('watchlist', item);
    },

    async delete(id: string) {
        const db = await initDB();
        return db.delete('watchlist', id);
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
        return db.put('market_picks', pick);
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
        return db.put('settings', settings, 'global');
    }
};

export const PriceDataService = {
    async getManualPrices(): Promise<Record<string, number>> {
        const db = await initDB();
        const all = await db.getAll('manual_prices');
        const map: Record<string, number> = {};
        all.forEach(p => map[p.symbol] = p.price);

        if (all.length === 0) {
            const local = localStorage.getItem('investment_tracker_manual_prices');
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    const tx = db.transaction('manual_prices', 'readwrite');
                    Object.entries(parsed).forEach(([sym, price]) => {
                        if (typeof price === 'number') {
                            map[sym] = price;
                            tx.store.put({ symbol: sym, price });
                        }
                    });
                    await tx.done;
                } catch (e) { console.error("Manual prices migration failed", e); }
            }
        }

        return map;
    },

    async saveManualPrice(symbol: string, price: number) {
        const db = await initDB();
        return db.put('manual_prices', { symbol, price });
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
