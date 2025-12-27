import { openDB, IDBPDatabase } from 'idb';
import { CryptoDB, DB_NAME, DB_VERSION } from './types';

let dbPromise: Promise<IDBPDatabase<CryptoDB>>;

export const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<CryptoDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
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
                    db.createObjectStore('settings');
                    db.createObjectStore('manual_prices', { keyPath: 'symbol' });
                }
                if (oldVersion < 4) {
                    db.createObjectStore('asset_overrides', { keyPath: 'symbol' });
                }
                if (oldVersion < 5) {
                    db.createObjectStore('market_picks', { keyPath: 'symbol' });
                }
                if (oldVersion < 6) {
                    const historicalStore = db.createObjectStore('historical_prices', { keyPath: 'id' });
                    historicalStore.createIndex('by-symbol', 'symbol');
                    historicalStore.createIndex('by-date', 'date');
                }
                if (oldVersion < 8) {
                    db.createObjectStore('strategist_intel', { keyPath: 'symbol' });
                }
            },
        });
    }
    return dbPromise;
}
