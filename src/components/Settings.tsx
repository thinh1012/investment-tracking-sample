import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, MessageSquare, Check, AlertCircle, X, Download, Upload, Globe } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { NotificationService } from '../services/notificationService';
import { LogService, TransactionService, SettingsService } from '../services/db';
import { NotificationSettings, NotificationLog } from '../types';


const Settings: React.FC = () => {
    const { notify } = useNotification();
    const [settings, setSettings] = useState<NotificationSettings>({
        telegramBotToken: '',
        telegramChatId: '',
        emailServiceId: '',
        emailTemplateId: '',
        emailPublicKey: ''
    });
    const [logs, setLogs] = useState<NotificationLog[]>([]);

    // Loading State
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const saved = await SettingsService.get();
            if (saved) {
                setSettings(prev => ({ ...prev, ...saved }));
            }
        };
        loadSettings();
    }, []);

    // Load Logs
    const loadLogs = async () => {
        try {
            const fetchedLogs = await LogService.getAll();
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Failed to load logs", error);
        }
    };

    useEffect(() => {
        loadLogs();
        window.addEventListener('notification-log-update', loadLogs);
        return () => window.removeEventListener('notification-log-update', loadLogs);
    }, []);

    // Logs Pagination
    const [logPage, setLogPage] = useState(1);
    const LOGS_PER_PAGE = 10;
    const totalLogPages = Math.ceil(logs.length / LOGS_PER_PAGE);
    const paginatedLogs = logs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

    // Reset page if logs clear
    useEffect(() => {
        if (logs.length === 0) setLogPage(1);
    }, [logs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSave = async () => {
        await SettingsService.save(settings);
        notify.success('Settings saved successfully');
    };

    const handleClearLogs = async () => {
        if (confirm('Clear all notification history?')) {
            await LogService.clearAll();
            setLogs([]);
            setLogPage(1);
            notify.info('Notification history cleared');
        }
    };



    const testTelegram = async () => {
        try {
            setIsLoading(true);
            const success = await NotificationService.sendTelegram(
                '🔔 *Test Notification*\n\nYour Telegram integration is working correctly!',
                settings
            );

            if (success) {
                notify.success('Telegram test message sent!');
            } else {
                notify.error('Failed to send Telegram message. Check credentials.');
            }
        } catch (error) {
            console.error('Test Telegram failed', error);
            notify.error('An unexpected error occurred.');
        } finally {
            await loadLogs();
            setIsLoading(false);
        }
    };

    const testEmail = async () => {
        try {
            setIsLoading(true);
            const success = await NotificationService.sendEmail(
                'Test Notification',
                'Your EmailJS integration is working correctly!',
                settings
            );

            if (success) {
                notify.success('Test email sent!');
            } else {
                notify.error('Failed to send email. Check credentials.');
            }
        } catch (error) {
            console.error('Test Email failed', error);
            notify.error('An unexpected error occurred.');
        } finally {
            await loadLogs();
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Bell className="text-indigo-500" /> Notification Settings
                </h1>

                <p className="text-slate-600 dark:text-slate-400 mb-8">
                    Configure external services to receive price alerts and portfolio updates directly to your phone or email.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
                                            const { BackupService } = await import('../services/db');
                                            const data = await BackupService.createFullBackup();
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `crypto-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
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
                                                        const { BackupService } = await import('../services/db');
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
                    </div>

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
                                value={localStorage.getItem('investment_tracker_locale') || 'en-US'}
                                onChange={(e) => {
                                    localStorage.setItem('investment_tracker_locale', e.target.value);
                                    notify.success('Locale updated! Reloading...');
                                    setTimeout(() => window.location.reload(), 500);
                                }}
                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                            >
                                <option value="en-US">US / English (1,234.56)</option>
                                <option value="vi-VN">Vietnam / Europe (1.234,56)</option>
                            </select>
                        </div>
                    </div>

                    {/* General Alert Settings */}
                    <div className="space-y-6 md:col-span-2">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500">
                                <AlertCircle size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Alert Preferences</h2>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">LP Range Monitoring</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Receive notifications when your Concentrated Liquidity positions go out of range.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="lpRangeChecksEnabled"
                                    checked={settings.lpRangeChecksEnabled ?? true} // Default to true if undefined
                                    onChange={(e) => setSettings({ ...settings, lpRangeChecksEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Custom Mesage Templates</h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Price Alert Message
                                </label>
                                <textarea
                                    name="priceAlertTemplate"
                                    value={settings.priceAlertTemplate ?? "🚨 Price Alert: {symbol} is {condition} ${target}\nCurrent Price: ${price}"}
                                    onChange={(e) => setSettings({ ...settings, priceAlertTemplate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs h-20"
                                    placeholder="Available vars: {symbol}, {target}, {condition}, {price}"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Variables: <code>{'{symbol}'}</code>, <code>{'{target}'}</code>, <code>{'{price}'}</code>, <code>{'{condition}'}</code>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    LP Status Message
                                </label>
                                <textarea
                                    name="lpAlertTemplate"
                                    value={settings.lpAlertTemplate ?? "⚠️ LP Alert: {symbol} is now {status}\nPrice: ${price}\nRange: ${min} - ${max}"}
                                    onChange={(e) => setSettings({ ...settings, lpAlertTemplate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs h-20"
                                    placeholder="Available vars: {symbol}, {status}, {price}, {min}, {max}"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Variables: <code>{'{symbol}'}</code>, <code>{'{status}'}</code>, <code>{'{price}'}</code>, <code>{'{min}'}</code>, <code>{'{max}'}</code>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Telegram Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-500">
                                <MessageSquare size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Telegram</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Bot Token
                                </label>
                                <input
                                    type="text"
                                    name="telegramBotToken"
                                    value={settings.telegramBotToken}
                                    onChange={handleChange}
                                    placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">@BotFather</a>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Chat ID
                                </label>
                                <input
                                    type="text"
                                    name="telegramChatId"
                                    value={settings.telegramChatId}
                                    onChange={handleChange}
                                    placeholder="e.g. 123456789"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Send a message to your bot and check <a href="https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">getUpdates</a> API to find your ID.
                                </p>
                            </div>

                            <button
                                onClick={testTelegram}
                                disabled={!settings.telegramBotToken || !settings.telegramChatId || isLoading}
                                className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending...' : 'Test Telegram Message'}
                            </button>
                        </div>
                    </div>

                    {/* EmailJS Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-amber-500">
                                <Mail size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Email (via EmailJS)</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Service ID
                                </label>
                                <input
                                    type="text"
                                    name="emailServiceId"
                                    value={settings.emailServiceId}
                                    onChange={handleChange}
                                    placeholder="e.g. service_xyz123"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Template ID
                                </label>
                                <input
                                    type="text"
                                    name="emailTemplateId"
                                    value={settings.emailTemplateId}
                                    onChange={handleChange}
                                    placeholder="e.g. template_abc123"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Public Key (User ID)
                                </label>
                                <input
                                    type="text"
                                    name="emailPublicKey"
                                    value={settings.emailPublicKey}
                                    onChange={handleChange}
                                    placeholder="e.g. user_12345678"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            <button
                                onClick={testEmail}
                                disabled={!settings.emailServiceId || !settings.emailTemplateId || !settings.emailPublicKey || isLoading}
                                className="w-full py-2 px-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending...' : 'Test Email'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logs Section */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
                    <div className="flex items-center justify-between mb-4 pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                                <MessageSquare size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notification History</h2>
                        </div>
                        <button
                            onClick={handleClearLogs}
                            className="text-xs font-medium text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        >
                            Clear History
                        </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-900/50 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-3">Time</th>
                                        <th className="p-3">Channel</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Message</th>
                                        <th className="p-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs font-medium">
                                    {paginatedLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400">
                                                No notification logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="p-3 text-slate-500 whitespace-nowrap">
                                                    {new Date(log.date).toLocaleString()}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${log.channel === 'TELEGRAM' ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' :
                                                        log.channel === 'EMAIL' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                                            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}>
                                                        {log.channel}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.type === 'PRICE' ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20' :
                                                        log.type === 'LP' ? 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' :
                                                            'text-slate-500'
                                                        }`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={log.message}>
                                                    {log.message.split('\n')[0]}...
                                                </td>
                                                <td className="p-3 text-right">
                                                    {log.status === 'SUCCESS' ? (
                                                        <span className="text-emerald-500 flex items-center justify-end gap-1">
                                                            Sent <Check size={12} strokeWidth={3} />
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-500 flex items-center justify-end gap-1" title={log.error}>
                                                            Failed <X size={12} strokeWidth={3} />
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    {totalLogPages > 1 && (
                        <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                                Page {logPage} of {totalLogPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                    disabled={logPage === 1}
                                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                                    disabled={logPage === totalLogPages}
                                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
