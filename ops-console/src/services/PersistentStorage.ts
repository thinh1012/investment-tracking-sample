import { IntelRecord } from '../types/intelligence';
import { browserStorage } from './BrowserStorage';

export class PersistentStorageBridge {
    private isElectron(): boolean {
        // @ts-ignore
        return typeof window.electronAPI !== 'undefined';
    }

    async saveIntel(intel: IntelRecord): Promise<boolean> {
        if (this.isElectron()) {
            // @ts-ignore
            return await window.electronAPI.sqlIntel.save(intel);
        } else {
            return await browserStorage.saveIntel(intel);
        }
    }

    async getIntel(symbol: string): Promise<IntelRecord | null> {
        if (this.isElectron()) {
            // @ts-ignore
            return await window.electronAPI.sqlIntel.get(symbol);
        } else {
            return await browserStorage.getIntel(symbol);
        }
    }

    async getAllIntel(): Promise<IntelRecord[]> {
        if (this.isElectron()) {
            // @ts-ignore
            return await window.electronAPI.sqlIntel.getAll();
        } else {
            return await browserStorage.getAllIntel();
        }
    }
}

export const persistentStorage = new PersistentStorageBridge();
