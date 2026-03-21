/**
 * BackupCenter - Disaster Recovery Dashboard
 * 
 * A settings component for managing cloud sync and JSON snapshots.
 */

import React, { useState, useCallback } from 'react';
import { ExportService } from '../../services/ExportService';
import { Download, Upload, HardDrive } from 'lucide-react';

interface BackupCenterProps {
    notify: {
        success: (msg: string) => void;
        error: (msg: string) => void;
    };
}

export const BackupCenter: React.FC<BackupCenterProps> = ({ notify }) => {


    const snapshotSizeKB = ExportService.getSnapshotSizeKB();



    // Download JSON snapshot
    const handleDownloadSnapshot = useCallback(() => {
        ExportService.downloadSnapshot();
        notify.success('JSON snapshot downloaded!');
    }, [notify]);

    // Import JSON snapshot
    const handleImportSnapshot = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await ExportService.importSnapshot(file);

        if (result.success) {
            notify.success(result.message + ' Verifying...');

            // ✅ FIX: Verify data is actually in IndexedDB before reload
            // This prevents race condition where page reloads before IndexedDB write completes
            try {
                const { TransactionService } = await import('../../services/database/TransactionService');
                const txCount = (await TransactionService.getAll()).length;

                console.log(`✅ [Import] Verified: ${txCount} transactions in IndexedDB`);
                notify.success(`Import complete! ${txCount} transactions loaded. Reloading in 5 seconds...`);

                // ✅ Extended delay to ensure IndexedDB fully persists all data
                setTimeout(() => window.location.reload(), 5000);
            } catch (verifyError) {
                console.error('[Import] Verification failed:', verifyError);
                // Reload anyway after longer delay - data might still be there
                setTimeout(() => window.location.reload(), 3000);
            }
        } else {
            notify.error(result.message);
        }

        // Reset input
        e.target.value = '';
    }, [notify]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500">
                    <HardDrive size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Backup & Recovery</h2>
                    <p className="text-xs text-slate-500">Manage your local JSON snapshots and data archives.</p>
                </div>
            </div>

            {/* JSON Snapshot Section */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Download size={18} className="text-emerald-500" />
                        <h3 className="font-semibold text-slate-900 dark:text-white">JSON Snapshots</h3>
                    </div>
                    <span className="text-xs text-slate-500">~{snapshotSizeKB} KB</span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Download a portable backup file or restore from a previous snapshot.
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadSnapshot}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all"
                    >
                        <Download size={14} />
                        Download Snapshot
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all cursor-pointer">
                        <Upload size={14} />
                        Import Snapshot
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportSnapshot}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};
