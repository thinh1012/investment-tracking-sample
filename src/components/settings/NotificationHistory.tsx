import React, { useState, useEffect } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';
import { NotificationLog } from '../../types';

interface Props {
    logs: NotificationLog[];
    onClear: () => void;
    locale: string;
}

export const NotificationHistory: React.FC<Props> = ({ logs, onClear, locale }) => {
    const [logPage, setLogPage] = useState(1);
    const LOGS_PER_PAGE = 10;
    const totalLogPages = Math.ceil(logs.length / LOGS_PER_PAGE);
    const paginatedLogs = logs.slice((logPage - 1) * LOGS_PER_PAGE, logPage * LOGS_PER_PAGE);

    useEffect(() => {
        if (logs.length === 0) setLogPage(1);
    }, [logs]);

    return (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-8">
            <div className="flex items-center justify-between mb-4 pointer-events-auto">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                        <MessageSquare size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notification History</h2>
                </div>
                <button
                    onClick={onClear}
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
    );
};
