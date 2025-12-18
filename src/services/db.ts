import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, NotificationLog, NotificationSettings } from '../types';

interface WatchlistItem {
    id: string;
    symbol: string;
    targetBuyPrice?: number;
    targetSellPrice?: number;
    expectedQty?: number;
    boughtQty?: number;
    note?: string;
    createdAt: number;
}

export interface MarketPick {
    symbol: string;
    addedAt: number;
    note?: string;
}

interface CryptoDB extends DBSchema {
    transactions: {
        key: string;
        value: Transaction;
        indexes: { 'by-date': string; 'by-symbol': string };
    };
    logs: {
        key: string;
        value: NotificationLog;
        indexes: { 'by-date': number; 'by-status': string };
    };
    watchlist: {
        key: string;
        value: WatchlistItem;
    };
    market_picks: {
        key: string;
        value: MarketPick;
    };
    settings: {
        key: string;
        value: NotificationSettings;
    };
    manual_prices: {
        key: string;
        value: { symbol: string; price: number };
    };
    asset_overrides: {
        key: string;
        value: { symbol: string; avgBuyPrice?: number; rewardTokens?: string[] };
    };
}

const DB_NAME = 'crypto-investment-db';
const DB_VERSION = 5;

let dbPromise: Promise<IDBPDatabase<CryptoDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<CryptoDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (oldVersion < 1) {
                    const store = db.createObjectStore('transactions', { keyPath: 'id' });
                    store.createIndex('by-date', 'date');
                    store.createIndex('by-symbol', 'assetSymbol');
                }
                if (oldVersion < 2) {
                    const logStore = db.createObjectStore('logs', { keyPath: 'id' });
                    logStore.createIndex('by-date', 'date');
                    logStore.createIndex('by-status', 'status');
                }
                if (oldVersion < 3) {
                    db.createObjectStore('watchlist', { keyPath: 'id' });
                    db.createObjectStore('settings'); // Key-value store (singleton settings)
                    db.createObjectStore('manual_prices', { keyPath: 'symbol' });
                }
                if (oldVersion < 4) {
                    db.createObjectStore('asset_overrides', { keyPath: 'symbol' });
                }
                if (oldVersion < 5) {
                    db.createObjectStore('market_picks', { keyPath: 'symbol' });
                }
            },
        });
    }
    return dbPromise;
};

export const TransactionService = {
    async getAll(): Promise<Transaction[]> {
        const db = await initDB();
        return db.getAll('transactions');
    },

    async add(transaction: Transaction) {
        const db = await initDB();
        return db.put('transactions', transaction);
    },

    async update(transaction: Transaction) {
        const db = await initDB();
        return db.put('transactions', transaction);
    },

    async delete(id: string) {
        const db = await initDB();
        return db.delete('transactions', id);
    },

    async migrateFromLocalStorage(transactions: Transaction[]) {
        const db = await initDB();
        const tx = db.transaction('transactions', 'readwrite');
        await Promise.all(transactions.map(t => tx.store.put(t)));
        await tx.done;
    },

    async clearAll() {
        const db = await initDB();
        await db.clear('transactions');
    },

    async bulkImport(transactions: Transaction[]) {
        const db = await initDB();
        const tx = db.transaction('transactions', 'readwrite');
        await tx.store.clear();
        await Promise.all(transactions.map(t => tx.store.put(t)));
        await tx.done;
    }
};

export const LogService = {
    async add(log: NotificationLog) {
        const db = await initDB();
        // Limit logs to last 100 to prevent bloat? 
        // For now, just add. We can implement cleanup later or on load.
        const result = await db.put('logs', log);
        window.dispatchEvent(new Event('notification-log-update'));
        return result;
    },

    async getAll(limit?: number): Promise<NotificationLog[]> {
        const db = await initDB();
        const logs = await db.getAllFromIndex('logs', 'by-date');
        // logs are sorted by date (asc) by default in IDB index usually? 
        // Actually indexes sort by key. Date is number (timestamp).
        // Return reverse (newest first)
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

        // Migration Check
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

        // Sync to localStorage (Legacy support & Fix for empty-list resurrection bug)
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

        // Migration
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

        // Migration
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

export const BackupService = {
    async createFullBackup() {
        const db = await initDB();
        const transactions = await db.getAll('transactions');
        const watchlist = await db.getAll('watchlist');
        const marketPicks = await db.getAll('market_picks');
        const settings = await db.get('settings', 'global');
        const manualPrices = await db.getAll('manual_prices');
        const assetOverrides = await db.getAll('asset_overrides');

        return {
            version: DB_VERSION,
            date: new Date().toISOString(),
            transactions,
            watchlist,
            marketPicks,
            settings: settings || {},
            manualPrices: manualPrices || [],
            assetOverrides: assetOverrides || []
        };
    },

    async restoreFullBackup(backup: any) {
        const db = await initDB();
        const tx = db.transaction(['transactions', 'watchlist', 'market_picks', 'settings', 'manual_prices', 'asset_overrides'], 'readwrite');

        // Clear all stores first
        await Promise.all([
            tx.objectStore('transactions').clear(),
            tx.objectStore('watchlist').clear(),
            tx.objectStore('market_picks').clear(),
            tx.objectStore('settings').clear(),
            tx.objectStore('manual_prices').clear(),
            tx.objectStore('asset_overrides').clear(),
        ]);

        // Restore Data
        const promises = [];

        if (Array.isArray(backup.transactions)) {
            promises.push(...backup.transactions.map((t: any) => tx.objectStore('transactions').put(t)));
        }
        if (Array.isArray(backup.watchlist)) {
            promises.push(...backup.watchlist.map((w: any) => tx.objectStore('watchlist').put(w)));
        }
        if (Array.isArray(backup.marketPicks)) {
            promises.push(...backup.marketPicks.map((p: any) => tx.objectStore('market_picks').put(p)));
        }
        if (backup.settings) {
            promises.push(tx.objectStore('settings').put(backup.settings, 'global'));
        }
        if (Array.isArray(backup.manualPrices)) {
            promises.push(...backup.manualPrices.map((p: any) => tx.objectStore('manual_prices').put(p)));
        }
        if (Array.isArray(backup.assetOverrides)) {
            promises.push(...backup.assetOverrides.map((o: any) => tx.objectStore('asset_overrides').put(o)));
        }

        await Promise.all(promises);
        await tx.done;

        // Force reload / or just let the user reload manually
        return true;
    }
};
