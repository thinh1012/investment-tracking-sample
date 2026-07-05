/**
 * ExportService - JSON Snapshotting for Offline Portability
 * 
 * Creates downloadable JSON snapshots of the entire vault state for
 * backup, migration, or disaster recovery purposes.
 */

class ExportService {
    /**
     * Download the snapshot as a JSON file
     */
    static async downloadSnapshot(): Promise<void> {
        const { BackupService } = await import('./database/BackupService');
        const snapshot = await BackupService.createFullBackup();
        const filename = `vault_state_${new Date().toISOString().split('T')[0]}.json`;

        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('[EXPORT] 📦 Snapshot downloaded:', filename);
    }

    /**
     * Import a snapshot from a JSON file
     */
    static async importSnapshot(file: File): Promise<{ success: boolean; message: string }> {
        try {
            const text = await file.text();
            const snapshot: any = JSON.parse(text);

            // Full-backup format (cloud vault / Download Snapshot / pre-restore snapshot):
            // { version, date, transactions, watchlist, marketPicks, settings, storageSnapshot, ... }
            if (snapshot.version && !snapshot.metadata) {
                console.log('[EXPORT] 📦 Detected full-backup format - running full restore...');

                const { BackupService } = await import('./database/BackupService');
                await BackupService.restoreFullBackup(snapshot);

                console.log(`[EXPORT] ✅ Full backup restored: ${snapshot.transactions?.length || 0} transactions from ${snapshot.date}`);
                return {
                    success: true,
                    message: `Restored full backup from ${(snapshot.date || '').split('T')[0]}: ${snapshot.transactions?.length || 0} transactions, ${snapshot.watchlist?.length || 0} watchlist, ${snapshot.marketPicks?.length || 0} picks + settings/preferences.`
                };
            }

            // New format validation
            if (!snapshot.metadata?.version) {
                return { success: false, message: 'Invalid snapshot file: missing metadata.' };
            }

            // Restore data to IndexedDB (primary storage) + localStorage (legacy)
            if (snapshot.transactions?.length) {
                const { TransactionService } = await import('./database/TransactionService');
                await TransactionService.bulkImport(snapshot.transactions);
            }
            if (snapshot.assets?.length) {
                localStorage.setItem('vault_assets', JSON.stringify(snapshot.assets));
            }
            if (snapshot.notes?.length) {
                localStorage.setItem('vault_notes', JSON.stringify(snapshot.notes));
            }
            if (snapshot.settings && Object.keys(snapshot.settings).length) {
                localStorage.setItem('investment_tracker_settings', JSON.stringify(snapshot.settings));
            }
            if (snapshot.intelHistory?.length) {
                localStorage.setItem('intel_history', JSON.stringify(snapshot.intelHistory));
            }

            console.log('[EXPORT] ✅ Snapshot imported successfully from:', file.name);
            return {
                success: true,
                message: `Restored ${snapshot.transactions?.length || 0} transactions, ${snapshot.assets?.length || 0} assets from ${snapshot.metadata.exportedAt}.`
            };
        } catch (err: any) {
            console.error('[EXPORT] ❌ Import failed:', err.message);
            return { success: false, message: `Import failed: ${err.message}` };
        }
    }

    /**
     * Get the current snapshot size estimate in KB
     */
    static async getSnapshotSizeKB(): Promise<number> {
        const { BackupService } = await import('./database/BackupService');
        const snapshot = await BackupService.createFullBackup();
        const jsonString = JSON.stringify(snapshot);
        return Math.round(jsonString.length / 1024);
    }

}

export { ExportService };
