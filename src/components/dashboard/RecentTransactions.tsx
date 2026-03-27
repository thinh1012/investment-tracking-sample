import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown, Trash2, Pencil } from 'lucide-react';
import { Transaction } from '../../types';
import { formatPrice } from '../../services/PriceService';

// Helper to format createdAt timestamp as dd/mm/yyyy hh:mm:ss
const formatCreatedAt = (timestamp: number): string => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

interface RecentTransactionsProps {
    transactions: Transaction[];
    onEditClick: (tx: Transaction) => void;
    onDeleteClick: (id: string) => void;
    locale?: string;
}

import { TableShell } from '../common/TableShell';

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onEditClick, onDeleteClick, locale }) => {
    const [isRecentTxOpen, setIsRecentTxOpen] = useState(false);
    const [txSearchTerm, setTxSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [sortKey, setSortKey] = useState<'date' | 'createdAt' | 'ticker'>('date');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const handleSort = (key: 'date' | 'createdAt' | 'ticker') => {
        if (sortKey === key) {
            setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
        const dir = sortOrder === 'desc' ? -1 : 1;
        if (sortKey === 'ticker') {
            return a.assetSymbol.localeCompare(b.assetSymbol) * dir;
        }
        if (sortKey === 'createdAt') {
            return ((a.createdAt ?? 0) - (b.createdAt ?? 0)) * dir;
        }
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
    });

    const filteredTransactions = sortedTransactions.filter((t: Transaction) => {
        const matchesTicker = !txSearchTerm.trim() || t.assetSymbol.toLowerCase().includes(txSearchTerm.trim().toLowerCase());
        const matchesType = typeFilter === 'ALL' || t.type === typeFilter;
        return matchesTicker && matchesType;
    });

    return (
        <TableShell
            title="Recent Transactions"
            subtitle=""
            icon={<TrendingUp />}
            iconColor="indigo"
            isOpen={isRecentTxOpen}
            onToggle={() => setIsRecentTxOpen(!isRecentTxOpen)}
            className="mt-10"
        >
            {/* Search + type filter */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-3">
                <div className="relative w-full md:w-72">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={txSearchTerm}
                        onChange={(e) => setTxSearchTerm(e.target.value)}
                        placeholder="Filter by ticker..."
                        className="block w-full rounded-xl border-0 py-2.5 pl-11 pr-4 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 font-medium text-sm"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-xl border-0 py-2.5 px-4 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white ring-1 ring-inset ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                >
                    <option value="ALL">All types</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                    <option value="DEPOSIT">Deposit</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="INTEREST">Earn</option>
                </select>
            </div>

            <div className="w-full overflow-hidden flex flex-col">
                <div className="flex items-center border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium">
                    <div
                        className="w-[80px] sm:w-[120px] px-2 sm:px-6 py-2 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none"
                        onClick={() => handleSort('date')}
                    >
                        <div className="flex items-center gap-2">
                            Date
                            {sortKey === 'date' && (
                                <span className="text-indigo-500">
                                    {sortOrder === 'desc' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                </span>
                            )}
                        </div>
                    </div>
                    <div
                        className="hidden lg:block w-[100px] px-4 py-2 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none"
                        onClick={() => handleSort('createdAt')}
                    >
                        <div className="flex items-center gap-2">
                            Created
                            {sortKey === 'createdAt' && (
                                <span className="text-indigo-500">
                                    {sortOrder === 'desc' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 md:flex-none md:w-[120px] px-4 py-2 md:px-6 md:py-2">Activity</div>
                    <div
                        className="flex-1 md:flex-none md:w-[100px] px-4 py-2 md:px-6 md:py-2 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none"
                        onClick={() => handleSort('ticker')}
                    >
                        <div className="flex items-center gap-2">
                            Ticker
                            {sortKey === 'ticker' && (
                                <span className="text-indigo-500">
                                    {sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 md:flex-none md:w-[120px] px-4 py-2 md:px-6 md:py-2 text-right">Volume</div>
                    <div className="hidden lg:block w-[120px] px-6 py-2 text-right">Unit Price</div>
                    <div className="flex-1 md:flex-none md:w-[120px] px-4 py-2 md:px-4 md:py-2 text-right">Registry</div>
                </div>

                {filteredTransactions.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                        {filteredTransactions.map((tx, index) => (
                            <div key={tx.id} className="flex items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group/row border-b border-slate-100 dark:divide-slate-800/50 px-4 md:px-0">
                                <div className="w-[80px] sm:w-[120px] px-2 sm:px-6 py-2 font-bold font-mono text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs tracking-tighter tabular-nums whitespace-nowrap">
                                    {tx.date}
                                </div>
                                <div className="hidden lg:block w-[100px] px-4 py-2 font-mono text-slate-300 dark:text-slate-600 text-[10px] tabular-nums whitespace-nowrap" title={tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}>
                                    {tx.createdAt ? formatCreatedAt(tx.createdAt) : <span className="text-slate-200 dark:text-slate-700">-</span>}
                                </div>
                                <div className="flex-1 md:flex-none md:w-[120px] px-4 py-2 md:px-6 md:py-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 md:px-3 md:py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest ${tx.type === 'DEPOSIT' || tx.type === 'BUY'
                                        ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                        : tx.type === 'WITHDRAWAL' || tx.type === 'SELL'
                                            ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20 shadow-lg shadow-rose-500/5'
                                            : 'bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20 shadow-lg shadow-indigo-500/5'
                                        }`}>
                                        {tx.type === 'INTEREST' ? 'EARN' : tx.type}
                                    </span>
                                </div>
                                <div className="flex-1 md:flex-none md:w-[100px] px-4 py-2 md:px-6 md:py-2 font-black text-slate-800 dark:text-slate-100 tracking-tight font-sans text-xs md:text-sm">
                                    {tx.assetSymbol}
                                </div>
                                <div className="flex-1 md:flex-none md:w-[120px] px-4 py-2 md:px-6 md:py-2 text-right font-bold font-mono text-slate-600 dark:text-slate-400 tabular-nums text-xs md:text-sm">
                                    {tx.amount.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                </div>
                                <div className="hidden lg:block w-[120px] px-6 py-2 text-right font-bold font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                                    {tx.pricePerUnit ? formatPrice(tx.pricePerUnit) : <span className="text-slate-300 dark:text-slate-700">-</span>}
                                </div>
                                <div className="flex-1 md:flex-none md:w-[120px] px-4 py-2 md:px-4 md:py-2 text-right">
                                    <div className="flex items-center justify-end gap-1 md:gap-2 opacity-100 md:opacity-0 group-hover/row:opacity-100">
                                        <button
                                            onClick={() => onEditClick(tx)}
                                            className="p-1.5 md:p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl"
                                            title="Edit Entry"
                                        >
                                            <Pencil size={14} className="md:w-4 md:h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDeleteClick(tx.id)}
                                            className="p-1.5 md:p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"
                                            title="Void Entry"
                                        >
                                            <Trash2 size={14} className="md:w-4 md:h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <TrendingUp size={48} className="text-slate-200 dark:text-slate-800" />
                            <p className="text-slate-400 dark:text-slate-500 font-black font-sans tracking-widest uppercase text-xs">No transactions recorded</p>
                        </div>
                    </div>
                )}
            </div>
        </TableShell>
    );
};
