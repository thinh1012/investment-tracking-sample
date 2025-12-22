import React from 'react';
import { Save, Download, Upload } from 'lucide-react';

interface Props {
    notify: any;
}

export const DataManagement: React.FC<Props> = ({ notify }) => {
    return (
        <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-500">
                    <Save size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Data Management</h2>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Sync & Backup</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                        Export your ENTIRE app data (Transactions, Watchlist, Settings) to a JSON file. Use this to move to a new device or backup your data.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            try {
                                const { BackupService } = await import('../../services/db');
                                const data = await BackupService.createFullBackup();
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `crypto-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                notify.success("Full Backup exported successfully");
                            } catch (e) {
                                console.error(e);
                                notify.error("Failed to export backup");
                            }
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> Export Backup
                    </button>
                    <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2">
                        <Upload size={16} /> Restore Backup
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                    try {
                                        const json = JSON.parse(event.target?.result as string);
                                        if (confirm("This will OVERWRITE all current data. Are you sure you want to restore?")) {
                                            const { BackupService } = await import('../../services/db');
                                            await BackupService.restoreFullBackup(json);
                                            notify.success("Restored successfully! Reloading...");
                                            setTimeout(() => window.location.reload(), 1000);
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        notify.error("Failed to restore backup (Invalid JSON)");
                                    }
                                };
                                reader.readAsText(file);
                            }}
                        />
                    </label>
                </div>
            </div>
        </div >
    );
};
