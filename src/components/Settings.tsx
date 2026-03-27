import React from 'react';
import { Save, Bell, Globe } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../hooks/useSettings';
import { DataManagement } from './settings/DataManagement';
import { NotificationChannels } from './settings/NotificationChannels';
import { AlertPreferences } from './settings/AlertPreferences';
import { NotificationHistory } from './settings/NotificationHistory';
import { useCloudSync } from '../hooks/useCloudSync';
import { CloudSyncModal } from './CloudSyncModal';
import { BackupService } from '../services/database/BackupService';

const Settings: React.FC = () => {
    const { notify } = useNotification();
    const {
        settings,
        setSettings,
        logs,
        isLoading,
        handleChange,
        updateSetting,
        handleSave,
        toggleCloudSync,
        handleClearLogs,
        testTelegram,
        testEmail
    } = useSettings();

    const cloudSync = useCloudSync();
    const [isSyncModalOpen, setIsSyncModalOpen] = React.useState(false);

    const handleRestoreCloud = async (data: any) => {
        try {
            await BackupService.restoreFullBackup(data);
            notify.success('Vault hydrated from cloud! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            notify.error('Failed to restore from cloud');
        }
    };

    const locale = localStorage.getItem('investment_tracker_locale') || 'en-US';

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500 shrink-0">
                        <Bell size={20} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">Settings</h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1.5 text-sm shrink-0"
                >
                    <Save size={14} /> Save
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Data Management Section */}
                        <DataManagement
                            notify={notify}
                            settings={settings}
                            onOpenSync={() => setIsSyncModalOpen(true)}
                            syncStatus={cloudSync.user ? 'Connected' : 'Disconnected'}
                            onToggleSync={toggleCloudSync}
                            onIntervalChange={(min) => updateSetting('cloudSyncInterval', min)}
                        />

                        {/* Regional Format Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500">
                                    <Globe size={20} />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Regional Format</h2>
                            </div>

                            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Number Format</label>
                                <select
                                    value={locale}
                                    onChange={(e) => {
                                        localStorage.setItem('investment_tracker_locale', e.target.value);
                                        notify.success('Locale updated! Reloading...');
                                        setTimeout(() => window.location.reload(), 500);
                                    }}
                                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg px-2 py-1 outline-none"
                                >
                                    <option value="en-US">1,234.56 (US)</option>
                                    <option value="vi-VN">1.234,56 (VN)</option>
                                </select>
                            </div>
                        </div>

                        {/* Alert Preferences Section */}
                        <AlertPreferences settings={settings} setSettings={setSettings} />

                        {/* Notification Channels Section */}
                        <NotificationChannels
                            settings={settings}
                            onChange={handleChange}
                            onTestTelegram={testTelegram}
                            onTestEmail={testEmail}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* History Section (desktop only) */}
                    <div className="hidden md:block pt-4 border-t border-slate-100 dark:border-slate-800">
                        <NotificationHistory
                            logs={logs}
                            onClear={handleClearLogs}
                            locale={locale}
                        />
                    </div>
                </div>
            </div>

            <CloudSyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                onRestore={handleRestoreCloud}
                sync={cloudSync}
            />
        </div>
    );
};

export default Settings;
