import React from 'react';
import { Save, Bell, Globe } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../hooks/useSettings';
import { DataManagement } from './settings/DataManagement';
import { NotificationChannels } from './settings/NotificationChannels';
import { AlertPreferences } from './settings/AlertPreferences';
import { NotificationHistory } from './settings/NotificationHistory';

const Settings: React.FC = () => {
    const { notify } = useNotification();
    const {
        settings,
        setSettings,
        logs,
        isLoading,
        handleChange,
        handleSave,
        handleClearLogs,
        testTelegram,
        testEmail
    } = useSettings();

    const locale = localStorage.getItem('investment_tracker_locale') || 'en-US';

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Bell className="text-indigo-500" /> Notification Settings
                </h1>

                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Configure external services to receive price alerts and portfolio updates directly to your phone or email.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Data Management Section */}
                    <DataManagement notify={notify} />

                    {/* Regional Format Section */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500">
                                <Globe size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Regional Format</h2>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Number Formatting</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Choose how numbers are displayed.</p>
                            </div>
                            <select
                                value={locale}
                                onChange={(e) => {
                                    localStorage.setItem('investment_tracker_locale', e.target.value);
                                    notify.success('Locale updated! Reloading...');
                                    setTimeout(() => window.location.reload(), 500);
                                }}
                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                            >
                                <option value="en-US">US / English (1,234.56)</option>
                                <option value="vi-VN">Vietnam / Europe (1.234,56)</option>
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

                {/* History Section */}
                <NotificationHistory
                    logs={logs}
                    onClear={handleClearLogs}
                    locale={locale}
                />

                {/* Save Button */}
                <div className="mt-10 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <Save size={20} /> Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
