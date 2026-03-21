import React from 'react';
import { Save, Download, Upload, Cloud, ShieldCheck } from 'lucide-react';
import { NotificationSettings } from '../../types';

interface Props {
    notify: any;
    settings: NotificationSettings;
    onOpenSync: () => void;
    syncStatus: string;
    onToggleSync: (enabled: boolean) => void;
    onIntervalChange: (minutes: number) => void;
}

export const DataManagement: React.FC<Props> = ({
    notify,
    settings,
    onOpenSync,
    syncStatus,
    onToggleSync,
    onIntervalChange
}) => {

    return (
        <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-emerald-500">
                    <Save size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Data Management</h2>
            </div>


            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                        <Cloud size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Supabase Cloud Vault
                            {syncStatus === 'Connected' && <ShieldCheck size={16} className="text-emerald-500" />}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
                            Secure your data with military-grade encryption in your personal Supabase cloud locker. Sync across devices automatically.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Background Sync</label>
                                <button
                                    onClick={() => onToggleSync(!settings.cloudSyncEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.cloudSyncEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.cloudSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Frequency</label>
                                <select
                                    value={settings.cloudSyncInterval || 15}
                                    onChange={(e) => onIntervalChange(Number(e.target.value))}
                                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 outline-none"
                                >
                                    <option value={15}>15 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                    <option value={45}>45 Minutes</option>
                                    <option value={60}>1 Hour</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onOpenSync}
                    className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                    <Cloud size={18} /> Manage Cloud Vault
                </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">JSON Export & Backup</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                        Export your ENTIRE app data (Transactions, Watchlist, Settings, Notes) to a JSON file. Use this to move to a new device or backup your data offline.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={async () => {
                            try {
                                const { BackupService } = await import('../../services/database/BackupService');
                                const data = await BackupService.createFullBackup();

                                // Support for Local Disk Backup (Electron)
                                if ((window as any).electronAPI?.saveBackupToDisk) {
                                    const filename = `alpha-vault-full-backup-${new Date().toISOString().split('T')[0]}.json`;
                                    const res = await (window as any).electronAPI.saveBackupToDisk(JSON.stringify(data, null, 2), filename);
                                    if (res.success) {
                                        notify.success(`Archive secured to local disk: ${filename}`);
                                    } else {
                                        notify.error("Disk backup failed");
                                    }
                                } else {
                                    // Web Fallback
                                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `alpha-vault-full-backup-${new Date().toISOString().split('T')[0]}.json`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    notify.success("Snapshot exported via browser");
                                }
                            } catch (e) {
                                console.error(e);
                                notify.error("Failed to generate backup");
                            }
                        }}
                        className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Download size={16} /> Secure Local Backup
                    </button>
                    <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-indigo-600/10">
                        <Upload size={16} /> Restore JSON
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
                                        // Rule 1.1: Default to additive restore (already implemented in BackupService)
                                        if (confirm("Restore data from this JSON? This will merge data with your current local database.")) {
                                            const { BackupService } = await import('../../services/database/BackupService');
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
