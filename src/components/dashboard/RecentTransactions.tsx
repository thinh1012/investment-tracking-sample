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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-8">
            <div
                className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsRecentTxOpen(!isRecentTxOpen)}
            >
                <div className="flex items-center gap-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Recent Transactions</h2>
                    {isRecentTxOpen && (
                        <div className="relative" onClick={e => e.stopPropagation()}>
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={txSearchTerm}
                                onChange={(e) => setTxSearchTerm(e.target.value)}
                                placeholder="Search asset, type..."
                                className="block w-48 rounded-lg border-0 py-1.5 pl-9 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                            />
                        </div>
                    )}
                </div>
                {isRecentTxOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </div>
            {isRecentTxOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider font-semibold">
                            <tr>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none"
                                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                >
                                    <div className="flex items-center gap-1.5">
                                        Date
                                        <span className={`text-slate-400 group-hover:text-indigo-500 transition-colors`}>
                                            {sortOrder === 'desc' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                        </span>
                                    </div>
                                </th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {paginatedTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{tx.date}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'DEPOSIT' || tx.type === 'BUY'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : tx.type === 'WITHDRAWAL' || tx.type === 'SELL'
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{tx.assetSymbol}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{tx.amount.toLocaleString(locale || 'en-US')}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {tx.pricePerUnit ? `$${tx.pricePerUnit.toLocaleString(locale || 'en-US')}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEditClick(tx)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteClick(tx.id)}
                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between items-center">
                        <span className="text-sm text-slate-700 dark:text-slate-400">
                            Page <span className="font-medium">{recentTxPage}</span> of <span className="font-medium">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setRecentTxPage(Math.max(1, recentTxPage - 1))}
                                disabled={recentTxPage === 1}
                                className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setRecentTxPage(Math.min(totalPages, recentTxPage + 1))}
                                disabled={recentTxPage === totalPages}
                                className="relative inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
