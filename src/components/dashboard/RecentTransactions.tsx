import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown, Trash2, Pencil } from 'lucide-react';
import { Transaction } from '../../types';

interface RecentTransactionsProps {
    transactions: Transaction[];
    onEditClick: (tx: Transaction) => void;
    onDeleteClick: (id: string) => void;
    locale?: string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onEditClick, onDeleteClick, locale }) => {
    const [isRecentTxOpen, setIsRecentTxOpen] = useState(false);
    const [txSearchTerm, setTxSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [recentTxPage, setRecentTxPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const MAX_PAGES = 100;

    const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    const filteredTransactions = sortedTransactions.filter(t => {
        if (!txSearchTerm) return true;
        const s = txSearchTerm.toLowerCase();
        return (
            t.assetSymbol.toLowerCase().includes(s) ||
            t.type.toLowerCase().includes(s) ||
            (t.notes && t.notes.toLowerCase().includes(s))
        );
    });

    const allRecentTransactions = filteredTransactions.slice(0, MAX_PAGES * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(allRecentTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = allRecentTransactions.slice((recentTxPage - 1) * ITEMS_PER_PAGE, recentTxPage * ITEMS_PER_PAGE);

    // Reset page when search changes
    React.useEffect(() => {
        setRecentTxPage(1);
    }, [txSearchTerm]);

    return (
        <div className="glass-card overflow-hidden mt-10 animate-slide-up animate-stagger-3 group/tx">
            <div
                className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-500"
                onClick={() => setIsRecentTxOpen(!isRecentTxOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 rounded-2xl group-hover/tx:scale-110 transition-transform duration-500">
                        <TrendingUp className="text-indigo-500" size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xl font-heading tracking-tight">Recent Transactions</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Ledger History & Activity</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                    {isRecentTxOpen && (
                        <div className="relative group/search w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={txSearchTerm}
                                onChange={(e) => setTxSearchTerm(e.target.value)}
                                placeholder="Filter ledger..."
                                className="block w-full rounded-2xl border-0 py-2.5 pl-11 pr-4 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-bold text-sm transition-all"
                            />
                        </div>
                    )}
                    <div className={`p-2 rounded-xl transition-all duration-300 ${isRecentTxOpen ? 'bg-slate-100 dark:bg-slate-800 rotate-180' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <ChevronDown className="text-slate-400" size={20} />
                    </div>
                </div>
            </div>
            {isRecentTxOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-[0.2em] font-black font-heading">
                            <tr>
                                <th
                                    className="px-8 py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors group select-none"
                                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                >
                                    <div className="flex items-center gap-2">
                                        Timestamp
                                        <span className={`transition-colors ${sortOrder === 'desc' ? 'text-indigo-500' : 'text-slate-300'}`}>
                                            {sortOrder === 'desc' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                        </span>
                                    </div>
                                </th>
                                <th className="px-6 py-5">Activity</th>
                                <th className="px-6 py-5">Ticker</th>
                                <th className="px-6 py-5 text-right">Volume</th>
                                <th className="px-6 py-5 text-right">Unit Price</th>
                                <th className="px-8 py-5 text-right">Registry</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {paginatedTransactions.length > 0 ? paginatedTransactions.map((tx, idx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 group/row">
                                    <td className="px-8 py-5 font-bold font-mono text-slate-400 dark:text-slate-500 text-xs tracking-tighter tabular-nums whitespace-nowrap">
                                        {tx.date}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${tx.type === 'DEPOSIT' || tx.type === 'BUY'
                                            ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                            : tx.type === 'WITHDRAWAL' || tx.type === 'SELL'
                                                ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 shadow-lg shadow-rose-500/5'
                                                : 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-800 dark:text-slate-100 tracking-tight font-heading">{tx.assetSymbol}</td>
                                    <td className="px-6 py-5 text-right font-bold font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                                        {tx.amount.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                                        {tx.pricePerUnit ? `$${tx.pricePerUnit.toLocaleString(locale || 'en-US', { maximumFractionDigits: 6 })}` : <span className="text-slate-300 dark:text-slate-700">-</span>}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all duration-300 translate-x-4 group-hover/row:translate-x-0">
                                            <button
                                                onClick={() => onEditClick(tx)}
                                                className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"
                                                title="Edit Entry"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteClick(tx.id)}
                                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                title="Void Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <TrendingUp size={48} className="text-slate-200 dark:text-slate-800" />
                                            <p className="text-slate-400 dark:text-slate-500 font-black font-heading tracking-widest uppercase text-xs">No transactions recorded</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/40 px-8 py-4 gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        Registry Page <span className="text-indigo-500">{recentTxPage}</span> / {totalPages}
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setRecentTxPage(Math.max(1, recentTxPage - 1))}
                            disabled={recentTxPage === 1}
                            className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setRecentTxPage(Math.min(totalPages, recentTxPage + 1))}
                            disabled={recentTxPage === totalPages}
                            className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
