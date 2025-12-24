import { initDB } from './core';
import { DB_VERSION } from './types';

export const BackupService = {
    async createFullBackup() {
        const db = await initDB();
        const transactions = await db.getAll('transactions');
        const watchlist = await db.getAll('watchlist');
        const marketPicks = await db.getAll('market_picks');
        const settings = await db.get('settings', 'global');
        const manualPrices = await db.getAll('manual_prices');
        const assetOverrides = await db.getAll('asset_overrides');
        const historicalPrices = await db.getAll('historical_prices');
        const manualHistoricalPrices = await db.getAll('manual_historical_prices');
        const notificationLogs = await db.getAll('logs');

        const localStorageKeys = [
            'dashboard_notes',
            'investment_tracker_price_alerts',
            'investment_tracker_notification_settings',
            'investment_tracker_lp_status',
            'investment_tracker_alerts_muted',
            'investment_tracker_manual_principal',
            'investment_tracker_funding_offset',
            'investment_tracker_base_fix_13580_applied',
            'investment_tracker_locale',
            'theme'
        ];

        const storageSnapshot: Record<string, string | null> = {};
        localStorageKeys.forEach(key => {
            storageSnapshot[key] = localStorage.getItem(key);
        });

        return {
            version: DB_VERSION,
            date: new Date().toISOString(),
            transactions,
            watchlist,
            marketPicks,
            settings: settings || {},
            manualPrices: manualPrices || [],
            assetOverrides: assetOverrides || [],
            historicalPrices: historicalPrices || [],
            manualHistoricalPrices: manualHistoricalPrices || [],
            notificationLogs: notificationLogs || [],
            storageSnapshot
        };
    },

    async isLocalDataEmpty() {
        const db = await initDB();
        const transactions = await db.count('transactions');
        const watchlist = await db.count('watchlist');
        const marketPicks = await db.count('market_picks');
        return transactions === 0 && watchlist === 0 && marketPicks === 0;
    },

    async restoreFullBackup(backup: any) {
        console.group("🚀 Vault Restoration Audit");
        console.log("Restoration Path: Cloud -> Local DB");
        console.log("Timestamp:", backup.date);

        const db = await initDB();
        const tx = db.transaction(['transactions', 'watchlist', 'market_picks', 'settings', 'manual_prices', 'asset_overrides', 'historical_prices', 'manual_historical_prices', 'logs'], 'readwrite');

        await Promise.all([
            tx.objectStore('transactions').clear(),
            tx.objectStore('watchlist').clear(),
            tx.objectStore('market_picks').clear(),
            tx.objectStore('settings').clear(),
            tx.objectStore('manual_prices').clear(),
            tx.objectStore('asset_overrides').clear(),
            tx.objectStore('historical_prices').clear(),
            tx.objectStore('manual_historical_prices').clear(),
            tx.objectStore('logs').clear(),
        ]);

        const promises = [];

        if (Array.isArray(backup.transactions)) {
            console.log(`Writing ${backup.transactions.length} Transactions...`);
            promises.push(...backup.transactions.map((t: any) => tx.objectStore('transactions').put(t)));
        }
        if (Array.isArray(backup.watchlist)) {
            console.log(`Writing ${backup.watchlist.length} Watchlist items...`);
            promises.push(...backup.watchlist.map((w: any) => tx.objectStore('watchlist').put(w)));
        }
        if (Array.isArray(backup.marketPicks)) {
            console.log(`Writing ${backup.marketPicks.length} Market Picks...`);
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
        if (Array.isArray(backup.historicalPrices)) {
            promises.push(...backup.historicalPrices.map((h: any) => tx.objectStore('historical_prices').put(h)));
        }
        if (Array.isArray(backup.manualHistoricalPrices)) {
            promises.push(...backup.manualHistoricalPrices.map((mh: any) => tx.objectStore('manual_historical_prices').put(mh)));
        }
        if (Array.isArray(backup.notificationLogs)) {
            promises.push(...backup.notificationLogs.map((l: any) => tx.objectStore('logs').put(l)));
        }

        await Promise.all(promises);
        await tx.done;

        if (backup.storageSnapshot) {
            console.log(`Applying system preferences snapshot...`);
            Object.entries(backup.storageSnapshot).forEach(([key, value]) => {
                if (value !== null) {
                    localStorage.setItem(key, value as string);
                }
            });
            window.dispatchEvent(new Event('local-storage-update'));
            window.dispatchEvent(new Event('storage'));
        }

        console.log("✅ Restoration Complete. Reloading environment.");
        console.groupEnd();
        return true;
    }
};
