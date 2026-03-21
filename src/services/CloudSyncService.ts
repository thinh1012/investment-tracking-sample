/**
 * CloudSyncService - 15-Minute Interval Sync to Supabase
 * 
 * This service implements a periodic snapshot approach to cloud backup,
 * syncing local data to Supabase every 15 minutes instead of real-time.
 */

import { supabase } from './supabase';

// 15 minutes by default
let currentInterval = 15 * 60 * 1000;

interface SyncStatus {
    lastSyncTime: number | null;
    isPending: boolean;
    lastError: string | null;
}

class CloudSyncService {
    private static intervalId: ReturnType<typeof setInterval> | null = null;
    private static status: SyncStatus = {
        lastSyncTime: null,
        isPending: false,
        lastError: null
    };

    /**
     * Start the sync loop
     */
    static start(intervalMinutes: number = 15) {
        if (this.intervalId) {
            console.log('[CLOUD_SYNC] Already running.');
            return;
        }

        currentInterval = intervalMinutes * 60 * 1000;
        console.log(`[CLOUD_SYNC] 🚀 Starting ${intervalMinutes}-minute interval sync...`);

        // Perform initial sync immediately
        this.performSync();

        // Schedule recurring syncs
        this.intervalId = setInterval(() => {
            this.performSync();
        }, currentInterval);
    }

    /**
     * Reboot the sync loop with a new interval
     */
    static restart(intervalMinutes: number) {
        console.log(`[CLOUD_SYNC] 🔄 Restarting with ${intervalMinutes}-minute interval...`);
        this.stop();
        this.start(intervalMinutes);
    }

    /**
     * Stop the sync loop
     */
    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('[CLOUD_SYNC] ⏹️ Sync loop stopped.');
        }
    }

    /**
     * Get current sync status
     */
    static getStatus(): SyncStatus {
        return { ...this.status };
    }

    /**
     * Force an immediate sync (e.g., before app close)
     */
    static async triggerManualSync(): Promise<boolean> {
        return this.performSync();
    }

    /**
     * The core sync logic: aggregate local changes and push to Supabase
     */
    private static async performSync(): Promise<boolean> {
        if (this.status.isPending) {
            console.log('[CLOUD_SYNC] Sync already in progress, skipping...');
            return false;
        }

        this.status.isPending = true;
        this.status.lastError = null;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                console.log('[CLOUD_SYNC] ⏹️ No active user session. Skipping sync.');
                this.status.isPending = false;
                return false;
            }

            const syncKey = sessionStorage.getItem('vault_sync_key');
            if (!syncKey) {
                console.log('[CLOUD_SYNC] ⏹️ No sync key found. Background sync requires a password in the session. Skipping.');
                this.status.isPending = false;
                return false;
            }

            console.log('[CLOUD_SYNC] 📡 Preparing background snapshot...');

            // Get fresh data from IndexedDB
            const { BackupService } = await import('./database/BackupService');
            const localData = await BackupService.createFullBackup();

            const hasData = (localData.transactions?.length || 0) > 0 ||
                (localData.watchlist?.length || 0) > 0 ||
                (localData.marketPicks?.length || 0) > 0;

            if (!hasData) {
                console.log('[CLOUD_SYNC] ⏹️ Local data is empty. Skipping background upload to protect cloud vault.');
                this.status.isPending = false;
                return true;
            }

            // Encrypt
            const { encryptData } = await import('../utils/crypto');
            const encryptedBlob = await encryptData(localData, syncKey);

            console.log('[CLOUD_SYNC] ⬆️ Uploading encrypted snapshot to user_vaults...');

            // Upsert to user_vaults (same as useCloudSync)
            const { error } = await supabase
                .from('user_vaults')
                .upsert({
                    user_id: user.id,
                    encrypted_data: encryptedBlob,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                throw new Error(error.message);
            }

            this.status.lastSyncTime = Date.now();
            localStorage.setItem('vault_last_sync_time', this.status.lastSyncTime.toString());

            console.log('[CLOUD_SYNC] ✅ Background sync complete.');

            // Dispatch event for Dashboard UI
            window.dispatchEvent(new CustomEvent('cloud_sync_complete', {
                detail: { timestamp: this.status.lastSyncTime }
            }));

            return true;
        } catch (err: any) {
            this.status.lastError = err.message || 'Unknown sync error';
            console.error('[CLOUD_SYNC] ❌ Sync failed:', this.status.lastError);
            return false;
        } finally {
            this.status.isPending = false;
        }
    }


    /**
     * [DEPRECATED] Legacy restore function - now handled by useCloudSync hook
     * This has been replaced by the downloadVault() method in useCloudSync.ts
     * Keeping skeleton for backwards compatibility if needed.
     */
    static async restoreFromCloud(): Promise<boolean> {
        console.warn('[CLOUD_SYNC] restoreFromCloud() is deprecated. Use useCloudSync hook instead.');
        return false;
    }
}

export { CloudSyncService };
