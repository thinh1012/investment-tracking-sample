import { IntelRecord } from '../types/intelligence';

const DB_NAME = 'AlphaVault_Intelligence';
const STORE_NAME = 'intel_records';

export class BrowserStorageService {
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'symbol' });
                }
            };

            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                resolve(this.db!);
            };

            request.onerror = (event: any) => {
                reject(event.target.error);
            };
        });
    }

    async saveIntel(intel: IntelRecord): Promise<boolean> {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put({
                    ...intel,
                    symbol: intel.symbol.toUpperCase()
                });

                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (e) {
            console.error('[STORAGE] Save Error:', e);
            return false;
        }
    }

    async getIntel(symbol: string): Promise<IntelRecord | null> {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(symbol.toUpperCase());

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => resolve(null);
            });
        } catch (e) {
            return null;
        }
    }

    async getAllIntel(): Promise<IntelRecord[]> {
        try {
            const db = await this.getDB();
            return new Promise((resolve) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            return [];
        }
    }
}

export const browserStorage = new BrowserStorageService();
