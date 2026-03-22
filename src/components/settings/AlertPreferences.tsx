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


        </div>
    );
};
