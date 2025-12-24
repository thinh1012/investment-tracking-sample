import { useState, useEffect, useRef, useCallback } from 'react';
import { BackupService } from '../services/db';

/**
 * useAutoSync Hook
 * Watches local state (IndexedDB and LocalStorage) and triggers an automated cloud upload.
 */
export const useAutoSync = (
    user: any,
    syncKey: string,
    triggerData: any, // Used to trigger the effect
    uploadVault: (data: any) => Promise<void>,
    checkSyncStatus?: () => Promise<boolean>
) => {
    const isFirstRun = useRef(true);
    const lastUploadData = useRef<string | null>(null);
    const [storageTick, setStorageTick] = useState(0);

    // Listen for LocalStorage changes from other tabs/components
    useEffect(() => {
        const handleStorageUpdate = () => {
            setStorageTick(prev => prev + 1);
        };
        window.addEventListener('storage', handleStorageUpdate);
        window.addEventListener('local-storage-update', handleStorageUpdate);
        return () => {
            window.removeEventListener('storage', handleStorageUpdate);
            window.removeEventListener('local-storage-update', handleStorageUpdate);
        };
    }, []);

    const performSync = useCallback(async (reason: string) => {
        if (!user || !syncKey) return;

        // CONFLICT GUARD: Don't auto-upload if cloud is newer
        if (checkSyncStatus) {
            console.log(`Auto-Sync: Pre-flight check... (${reason})`);
            const isConflict = await checkSyncStatus();
            if (isConflict) {
                console.warn(`Auto-Sync: Blocking upload. Cloud contains newer data. Manual restore required.`);
                return;
            }
        }

        try {
            const fullData = await BackupService.createFullBackup();
            const dataStr = JSON.stringify(fullData);

            // Optimization: Don't upload if nothing changed
            if (dataStr === lastUploadData.current) {
                console.log(`Auto-Sync: Data identical, skipping upload (${reason})`);
                return;
            }

            console.log(`Auto-Sync: Starting upload (${reason})...`);
            await uploadVault(fullData);
            lastUploadData.current = dataStr;
            console.log("Auto-Sync: Full backup successfully pushed to cloud. ✅");
        } catch (e) {
            console.error("Auto-Sync failed", e);
        }
    }, [user, syncKey, uploadVault, checkSyncStatus]);

    useEffect(() => {
        // Skip the very first run (initial data load)
        if (isFirstRun.current) {
            isFirstRun.current = false;
            // Record initial state to compare against
            BackupService.createFullBackup().then(data => {
                lastUploadData.current = JSON.stringify(data);
            });
            return;
        }

        if (!user || !syncKey) return;

        console.log("Auto-Sync: Change detected. Debouncing 15-minute upload...");
        const timer = setTimeout(() => performSync("Idle window reached"), 900000);

        return () => {
            clearTimeout(timer);
        };
    }, [triggerData, storageTick, user, syncKey, performSync]);

    // Safety Net: Sync when tab is hidden or closed (Mobile & Desktop reliable)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                performSync("Visibility change (hidden)");
            }
        };

        const handlePageHide = () => {
            performSync("Page hide");
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [performSync]);
};
