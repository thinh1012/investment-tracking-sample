import React from 'react';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Transaction } from '../../../types';

interface EarningsItem {
    source: string;
    sourceSymbols: string[];
    tokens: Record<string, number>;
    totalValue: number;
    roi: number | null;
    apr: number | null;
    daysActive: number;
    transactions: Transaction[];
}

interface EarningsTableProps {
    earnings: EarningsItem[];
    sortKey: string;
    sortOrder: 'asc' | 'desc';
    onSort: (key: any) => void;
    expandedSources: Set<string>;
    onToggleExpansion: (source: string) => void;
    locale?: string;
}

export const EarningsTable: React.FC<EarningsTableProps> = ({
    earnings,
    sortKey,
    sortOrder,
    onSort,
    expandedSources,
    onToggleExpansion,
    locale
}) => {
    return (
        <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider font-semibold">
                    <tr>
                        <th className="px-6 py-4 cursor-pointer group" onClick={() => onSort('source')}>
                            <div className="flex items-center gap-1">
                                Source
                                {sortKey === 'source' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                            </div>
                        </th>
                        <th className="px-6 py-4">Tokens Earned</th>
                        <th className="px-6 py-4 text-right cursor-pointer group" onClick={() => onSort('totalValue')}>
                            <div className="flex items-center justify-end gap-1">
                                Total Value
                                {sortKey === 'totalValue' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                            </div>
                        </th>
                        <th className="px-6 py-4 text-right cursor-pointer group" onClick={() => onSort('roi')}>
                            <div className="flex items-center justify-end gap-1">
                                ROI
                                {sortKey === 'roi' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                            </div>
                        </th>
                        <th className="px-6 py-4 text-right cursor-pointer group" onClick={() => onSort('apr')}>
                            <div className="flex items-center justify-end gap-1">
                                APR
                                {sortKey === 'apr' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {earnings.map((item, idx) => (
                        <React.Fragment key={idx}>
                            <tr
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => onToggleExpansion(item.source)}
                            >
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                                        {expandedSources.has(item.source) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                    {item.source}
                                    {item.sourceSymbols.length > 1 && (
                                        <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                            {item.sourceSymbols.length} Assets
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {Object.entries(item.tokens).map(([token, amount]) => (
                                            <div key={token} className="text-sm text-slate-600 dark:text-slate-300">
                                                <span className="font-bold">{amount.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}</span> <span className="text-xs text-slate-500">{token}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        ${item.totalValue.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {item.roi !== null ? (
                                        <span className="font-mono font-medium text-emerald-600">
                                            {item.roi.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {item.apr !== null ? (
                                        <div className="flex flex-col items-end">
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {item.apr.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {item.daysActive} days
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            </tr>
                            {expandedSources.has(item.source) && (
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                    <td colSpan={5} className="px-0 py-0 border-b border-slate-100 dark:border-slate-800">
                                        <div className="px-6 py-3 space-y-2">
                                            <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transaction History</h6>
                                            <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                                {[...item.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                                    <div key={t.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-2 rounded">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-slate-400 font-mono w-20">{t.date}</span>
                                                            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{t.amount} {t.assetSymbol}</span>
                                                        </div>
                                                        <div>
                                                            {t.pricePerUnit ? (
                                                                <span className="text-slate-500">
                                                                    <span className="mr-2">@ ${t.pricePerUnit.toLocaleString(locale || 'en-US')}</span>
                                                                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                                                        ${(t.amount * t.pricePerUnit).toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">No Price</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
