import React from 'react';
import { AlertCircle } from 'lucide-react';
import { NotificationSettings } from '../../types';

interface Props {
    settings: NotificationSettings;
    setSettings: (settings: NotificationSettings) => void;
}

export const AlertPreferences: React.FC<Props> = ({ settings, setSettings }) => {
    return (
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
                        checked={settings.lpRangeChecksEnabled ?? true}
                        onChange={(e) => setSettings({ ...settings, lpRangeChecksEnabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Periodic Market Updates</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive a status summary of your conviction plays every few hours.</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={settings.marketPicksNotifInterval || 2 * 60 * 60 * 1000}
                        onChange={(e) => setSettings({ ...settings, marketPicksNotifInterval: parseInt(e.target.value) })}
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 outline-none"
                    >
                        <option value={1 * 60 * 60 * 1000}>Every 1h</option>
                        <option value={2 * 60 * 60 * 1000}>Every 2h</option>
                        <option value={4 * 60 * 60 * 1000}>Every 4h</option>
                        <option value={12 * 60 * 60 * 1000}>Every 12h</option>
                    </select>
                    <label className="relative inline-flex items-center cursor-pointer">
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

            <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Custom Message Templates</h3>

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
                        Market Picks Summary
                    </label>
                    <textarea
                        name="marketPicksAlertTemplate"
                        value={settings.marketPicksAlertTemplate ?? "🔭 Tactical Market Update\n\n{items}\n\nAuto-sent every 2 hours"}
                        onChange={(e) => setSettings({ ...settings, marketPicksAlertTemplate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs h-24"
                        placeholder="Available vars: {items}"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                        Variables: <code>{'{items}'}</code>
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
    );
};
