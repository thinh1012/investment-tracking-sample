import { openDB, IDBPDatabase } from 'idb';
import { CryptoDB, DB_NAME, DB_VERSION } from './types';

let dbPromise: Promise<IDBPDatabase<CryptoDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<CryptoDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                if (oldVersion < 1) {
                    if (!db.objectStoreNames.contains('transactions')) {
                        const store = db.createObjectStore('transactions', { keyPath: 'id' });
                        store.createIndex('by-date', 'date');
                        store.createIndex('by-symbol', 'assetSymbol');
                    }
                }
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('logs')) {
                        const logStore = db.createObjectStore('logs', { keyPath: 'id' });
                        logStore.createIndex('by-date', 'date');
                        logStore.createIndex('by-status', 'status');
                    }
                }
                if (oldVersion < 3) {
                    if (!db.objectStoreNames.contains('watchlist')) db.createObjectStore('watchlist', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
                    if (!db.objectStoreNames.contains('manual_prices')) db.createObjectStore('manual_prices', { keyPath: 'symbol' });
                }
                if (oldVersion < 4) {
                    if (!db.objectStoreNames.contains('asset_overrides')) db.createObjectStore('asset_overrides', { keyPath: 'symbol' });
                }
                if (oldVersion < 5) {
                    if (!db.objectStoreNames.contains('market_picks')) db.createObjectStore('market_picks', { keyPath: 'symbol' });
                }
                if (oldVersion < 6) {
                    if (!db.objectStoreNames.contains('historical_prices')) {
                        const historicalStore = db.createObjectStore('historical_prices', { keyPath: 'id' });
                        historicalStore.createIndex('by-symbol', 'symbol');
                        historicalStore.createIndex('by-date', 'date');
                    }
                }
                if (oldVersion < 8) {
                    if (!db.objectStoreNames.contains('strategist_intel')) db.createObjectStore('strategist_intel', { keyPath: 'symbol' });
                }
                if (oldVersion < 9) {
                    if (!db.objectStoreNames.contains('manual_historical_prices')) {
                        const manualHistStore = db.createObjectStore('manual_historical_prices', { keyPath: 'id' });
                        manualHistStore.createIndex('by-symbol', 'symbol');
                    }
                }
                if (oldVersion < 10) {
                    if (!db.objectStoreNames.contains('scout_reports')) {
                        db.createObjectStore('scout_reports', { keyPath: 'latest' });
                    }
                }
                if (oldVersion < 13) {
                    if (db.objectStoreNames.contains('scout_reports')) {
                        db.deleteObjectStore('scout_reports');
                    }
                    db.createObjectStore('scout_reports', { keyPath: 'timestamp' });
                }
                if (oldVersion < 15) {
                    if (!db.objectStoreNames.contains('scout_sources')) {
                        const sourceStore = db.createObjectStore('scout_sources', { keyPath: 'id' });
                        sourceStore.createIndex('by-category', 'category');
                    }
                }
            },
        });
    }
    return dbPromise;
}

// [BUILDER]: Expose for the user to query via console (browser only)
if (typeof window !== 'undefined') {
    (window as any)._db = {
        getAll: async (storeName: string) => {
            const db = await initDB();
            return db.getAll(storeName as any);
        },
        get: async (storeName: string, key: any) => {
            const db = await initDB();
            return db.get(storeName as any, key);
        },
        stores: [
            'transactions', 'logs', 'watchlist', 'settings',
            'manual_prices', 'asset_overrides', 'market_picks',
            'historical_prices', 'strategist_intel', 'scout_reports'
        ]
    };
}
