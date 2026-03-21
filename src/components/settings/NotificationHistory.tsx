import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';
import { NotificationLog } from '../../types';

interface Props {
    logs: NotificationLog[];
    onClear: () => void;
    locale: string;
}

export const NotificationHistory: React.FC<Props> = ({ logs, onClear, locale }) => {
    // [LIMIT_UI] Shows most recent 10 logs (now enforced by LogService)
    const recentLogs = logs.slice(0, 10);

    return (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
            <div className="flex items-center justify-between mb-4 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                        <MessageSquare size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Recent Notifications</h2>
                </div>
                {logs.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-xs font-medium text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                        Clear History
                    </button>
                )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
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
                            {recentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        No notification logs found.
                                    </td>
                                </tr>
                            ) : (
                                recentLogs.map(log => (
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
            {logs.length > 10 && (
                <p className="text-[10px] text-slate-400 mt-2 text-right italic">
                    Showing 10 most recent notifications. Older logs are automatically purged.
                </p>
            )}
        </div>
    );
};
