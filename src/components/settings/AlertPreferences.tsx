import React from 'react';
import { AlertCircle } from 'lucide-react';
import { NotificationSettings } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface Props {
    settings: NotificationSettings;
    setSettings: (settings: NotificationSettings) => void;
}

export const AlertPreferences: React.FC<Props> = ({ settings, setSettings }) => {
    const { notify } = useNotification();
    return (
        <div className="space-y-6 md:col-span-2">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500">
                    <AlertCircle size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Alert Preferences</h2>
            </div>

            {/* LP Range Monitoring */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">LP Range Monitoring</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Alert when CL positions go out of range.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input
                        type="checkbox"
                        name="lpRangeChecksEnabled"
                        checked={settings.lpRangeChecksEnabled ?? true}
                        onChange={(e) => setSettings({ ...settings, lpRangeChecksEnabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {/* Bitcoin Volatility Sentry */}
            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">BTC Volatility Sentry</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Alert on sudden BTC price moves.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Window</span>
                        <select
                            value={settings.volatilityWindowMinutes || 60}
                            onChange={(e) => setSettings({ ...settings, volatilityWindowMinutes: parseInt(e.target.value) })}
                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-1.5 outline-none"
                        >
                            <option value={30}>30m</option>
                            <option value={60}>1h</option>
                            <option value={120}>2h</option>
                            <option value={240}>4h</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Move</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-mono">$</span>
                            <input
                                type="number"
                                value={settings.volatilityThreshold || 1000}
                                onChange={(e) => setSettings({ ...settings, volatilityThreshold: parseInt(e.target.value) })}
                                placeholder="1000"
                                className="w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm rounded-lg p-1.5 text-right outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer group ml-auto">
                        <input
                            type="checkbox"
                            checked={settings.volatilityTelegramEnabled ?? true}
                            onChange={(e) => setSettings({ ...settings, volatilityTelegramEnabled: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-500 transition-colors uppercase tracking-tight">Telegram</span>
                    </label>
                </div>
            </div>

            {/* Periodic Market Updates */}
            <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Periodic Market Updates</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Conviction plays summary on a schedule.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={settings.marketPicksNotifInterval || 2 * 60 * 60 * 1000}
                        onChange={(e) => setSettings({ ...settings, marketPicksNotifInterval: parseInt(e.target.value) })}
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 outline-none"
                    >
                        <option value={30 * 60 * 1000}>30 mins</option>
                        <option value={1 * 60 * 60 * 1000}>1h</option>
                        <option value={2 * 60 * 60 * 1000}>2h</option>
                        <option value={4 * 60 * 60 * 1000}>4h</option>
                        <option value={12 * 60 * 60 * 1000}>12h</option>
                    </select>
                    <button
                        onClick={() => {
                            localStorage.setItem('investment_tracker_last_picks_notif', '0');
                            window.dispatchEvent(new Event('force-market-picks-notif'));
                            notify.success('Market Update dispatched! 🔭');
                        }}
                        className="text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                        Force Send
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer ml-auto">
                        <input
                            type="checkbox"
                            checked={settings.marketPicksNotifEnabled ?? false}
                            onChange={(e) => setSettings({ ...settings, marketPicksNotifEnabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>

        </div>
    );
};
