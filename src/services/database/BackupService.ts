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
        const manualHistoricalPrices = await db.getAll('manual_historical_prices');
        const assetOverrides = await db.getAll('asset_overrides');

        // PERFORMANCE PRUNING: Only sync critical intel. Skip local logs and strategist reasoning
        // to keep payload small for Supabase and the encryption engine.
        const scoutReports = await db.getAll('scout_reports');
        const scoutSources = await db.getAll('scout_sources');
        const trimmedReports = scoutReports.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 20);

        const localStorageKeys = [
            'dashboard_notes',
            'investment_tracker_price_alerts',
            'investment_tracker_notification_settings',
            'investment_tracker_lp_status',
            'investment_tracker_alerts_muted',
            'investment_tracker_manual_principal',
            'investment_tracker_funding_offset',
            'investment_tracker_base_fix_applied',
            'investment_tracker_last_sync',
            'vault_last_sync_time',
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
            historicalPrices: [], // Optimization: Don't cloud-sync heavy historical cache
            manualHistoricalPrices: manualHistoricalPrices || [],
            notificationLogs: [], // Optimization: Logs stay local
            strategistIntel: [],   // Optimization: Heavy AI logs stay local
            scoutReports: trimmedReports,
            scoutSources: scoutSources || [],
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
        try {
            console.log("Restoration Path: Cloud -> Local DB");
            console.log("Timestamp:", backup.date);
            console.log("Record Snapshot:", {
                tx: backup.transactions?.length,
                watchlist: backup.watchlist?.length,
                picks: backup.marketPicks?.length
            });

            const db = await initDB();

            // Atomic Transaction
            const storeNames = [
                'transactions', 'watchlist', 'market_picks', 'settings',
                'manual_prices', 'asset_overrides', 'historical_prices',
                'manual_historical_prices', 'logs', 'strategist_intel',
                'scout_reports', 'scout_sources'
            ];
            const tx = db.transaction(storeNames as any, 'readwrite');

            console.log("Wiping local stores...");
            await Promise.all(storeNames.map(name => tx.objectStore(name as any).clear()));

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
            if (Array.isArray(backup.strategistIntel)) {
                promises.push(...backup.strategistIntel.map((s: any) => tx.objectStore('strategist_intel').put(s)));
            }
            if (Array.isArray(backup.scoutReports)) {
                promises.push(...backup.scoutReports.map((r: any) => tx.objectStore('scout_reports').put(r)));
            }
            if (Array.isArray(backup.scoutSources)) {
                promises.push(...backup.scoutSources.map((s: any) => tx.objectStore('scout_sources').put(s)));
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
            }

            console.log("✅ Restoration Complete. Local DB is now hydrated.");
            console.groupEnd();
            return true;
        } catch (error) {
            console.error("❌ BACKUP_SERVICE_RESTORE_ERROR:", error);
            console.groupEnd();
            throw error;
        }
    }
};
