/**
 * ExportService - JSON Snapshotting for Offline Portability
 * 
 * Creates downloadable JSON snapshots of the entire vault state for
 * backup, migration, or disaster recovery purposes.
 */

interface VaultSnapshot {
    metadata: {
        version: string;
        timestamp: string;
        exportedAt: string;
    };
    transactions: any[];
    assets: any[];
    notes: any[];
    settings: Record<string, any>;
    intelHistory?: any[];
}

class ExportService {
    private static SNAPSHOT_VERSION = '1.2';

    /**
     * Generate a complete JSON snapshot of the vault
     */
    static generateJsonSnapshot(): VaultSnapshot {
        const now = new Date();

        return {
            metadata: {
                version: this.SNAPSHOT_VERSION,
                timestamp: now.toISOString(),
                exportedAt: now.toLocaleString()
            },
            transactions: (this.getStoredData('vault_transactions') as any[]) || [],
            assets: (this.getStoredData('vault_assets') as any[]) || [],
            notes: (this.getStoredData('vault_notes') as any[]) || [],
            settings: (this.getStoredData('investment_tracker_settings') as Record<string, any>) || {},
            intelHistory: (this.getStoredData('intel_history') as any[]) || undefined
        };
    }

    /**
     * Download the snapshot as a JSON file
     */
    static downloadSnapshot(): void {
        const snapshot = this.generateJsonSnapshot();
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

            // [FIX] Support both legacy and new backup formats
            // Legacy: { version, date, transactions: [...] }
            // New: { metadata: { version }, transactions: [...], assets: [...] }
            const isLegacyFormat = snapshot.version && !snapshot.metadata;

            if (isLegacyFormat) {
                console.log('[EXPORT] 📦 Detected legacy backup format - converting...');

                // [CRITICAL FIX] Write to IndexedDB, not localStorage!
                if (snapshot.transactions?.length) {
                    const { TransactionService } = await import('./database/TransactionService');
                    await TransactionService.bulkImport(snapshot.transactions);
                }

                console.log(`[EXPORT] ✅ Legacy snapshot imported: ${snapshot.transactions?.length || 0} transactions from ${snapshot.date}`);
                return {
                    success: true,
                    message: `Restored ${snapshot.transactions?.length || 0} transactions from legacy backup (${snapshot.date.split('T')[0]}).`
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
    static getSnapshotSizeKB(): number {
        const snapshot = this.generateJsonSnapshot();
        const jsonString = JSON.stringify(snapshot);
        return Math.round(jsonString.length / 1024);
    }

    /**
     * Helper to safely parse stored JSON data
     */
    private static getStoredData(key: string): any[] | Record<string, any> | null {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
}

export { ExportService };
export type { VaultSnapshot };
