import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { getJournalEntries, JournalEntry } from '../../services/accountingService';
import { TableShell } from '../common/TableShell';
import { Book, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, LayoutGrid, List, ChevronDown } from 'lucide-react';

interface Props {
    transactions: Transaction[];
    locale?: string;
}

export const AccountingJournal: React.FC<Props> = ({ transactions, locale }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filterAccount, setFilterAccount] = useState<string>('ALL');
    const [viewMode, setViewMode] = useState<'journal' | 't-account'>('t-account');
    const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

    const entries = useMemo(() => getJournalEntries(transactions), [transactions]);

    const toggleAccount = (name: string) => {
        setExpandedAccounts(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const accounts = useMemo(() => {
        const accs = new Set<string>();
        entries.forEach(e => accs.add(e.account.trim().toUpperCase()));
        return ['ALL', ...Array.from(accs).sort()];
    }, [entries]);

    const tAccounts = useMemo(() => {
        const grouped: Record<string, {
            debits: JournalEntry[],
            credits: JournalEntry[],
            balances: Record<string, number>,
            currencies: Set<string>
        }> = {};

        entries.forEach(entry => {
            const accName = entry.account.trim().toUpperCase();
            if (!grouped[accName]) {
                grouped[accName] = { debits: [], credits: [], balances: {}, currencies: new Set() };
            }

            const currency = entry.currency.trim().toUpperCase();
            grouped[accName].currencies.add(currency);

            if (!grouped[accName].balances[currency]) {
                grouped[accName].balances[currency] = 0;
            }

            if (entry.debit > 0) {
                grouped[accName].debits.push(entry);
                grouped[accName].balances[currency] += entry.debit;
            }
            if (entry.credit > 0) {
                grouped[accName].credits.push(entry);
                grouped[accName].balances[currency] -= entry.credit;
            }
        });

        return Object.entries(grouped)
            .map(([name, data]) => ({
                name,
                ...data,
                sortedCurrencies: Array.from(data.currencies).sort()
            }))
            .filter(acc => filterAccount === 'ALL' || acc.name === filterAccount)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [entries, filterAccount]);

    return (
        <TableShell
            title="Accounting Ledger"
            subtitle="T-Account Ledger Views"
            icon={<Book />}
            iconColor="slate"
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="lg:col-span-3 mt-6"
            extraHeaderActions={
                <div className="flex items-center gap-4 ml-4">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1.5 focus:ring-2 ring-indigo-500/20 outline-none text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                        >
                            {accounts.map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 bg-slate-50/50 dark:bg-slate-950/20">
                {tAccounts.map((acc) => {
                    const isExpanded = expandedAccounts[acc.name];
                    return (
                        <div key={acc.name} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 hover:shadow-lg transition-all duration-500 h-fit">
                            <div
                                onClick={() => toggleAccount(acc.name)}
                                className="bg-slate-50 dark:bg-slate-800/50 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer group/header"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={14} className="text-slate-400 group-hover/header:text-indigo-500" />
                                    </div>
                                    <span className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white group-hover/header:text-indigo-600 transition-colors">{acc.name}</span>
                                </div>
                                <div className="flex gap-1">
                                    {acc.sortedCurrencies.map(c => (
                                        <span key={c} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase tracking-widest">{c}</span>
                                    ))}
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="flex min-h-[220px] animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex-1 border-r border-slate-100 dark:border-slate-800/50 flex flex-col">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 text-center border-b border-slate-50 dark:border-slate-800">Debit (+)</div>
                                        <div className="p-4 space-y-2.5 flex-1 overflow-auto max-h-[300px] scrollbar-hide">
                                            {acc.debits.map((d, i) => (
                                                <div key={i} className="flex flex-col gap-0.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] text-slate-400 font-mono">{new Date(d.date).toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })}</span>
                                                        <span className="text-xs font-black text-emerald-500 font-mono">
                                                            {d.debit.toLocaleString(locale, { maximumFractionDigits: 6 })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] text-slate-300 dark:text-slate-600 uppercase font-bold truncate max-w-full" title={d.description}>
                                                            {d.description}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400/50 uppercase">{d.currency}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {acc.debits.length === 0 && (
                                                <div className="h-full flex items-center justify-center opacity-10">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest -rotate-45">No Debits</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 text-center border-b border-slate-50 dark:border-slate-800">Credit (-)</div>
                                        <div className="p-4 space-y-2.5 flex-1 overflow-auto max-h-[300px] scrollbar-hide">
                                            {acc.credits.map((c, i) => (
                                                <div key={i} className="flex flex-col gap-0.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-rose-500 font-mono">
                                                            {c.credit.toLocaleString(locale, { maximumFractionDigits: 6 })}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 font-mono text-right">{new Date(c.date).toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[8px] font-bold text-slate-400/50 uppercase">{c.currency}</span>
                                                        <span className="text-[8px] text-slate-300 dark:text-slate-600 uppercase font-bold truncate text-right w-full" title={c.description}>
                                                            {c.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {acc.credits.length === 0 && (
                                                <div className="h-full flex items-center justify-center opacity-10">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest rotate-45">No Credits</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 dark:bg-slate-800/30 px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2 mb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Balance</span>
                                    {!isExpanded && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleAccount(acc.name); }}
                                            className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                                        >
                                            View Details
                                        </button>
                                    )}
                                </div>
                                {acc.sortedCurrencies.map(currency => (
                                    <div key={currency} className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{currency}</span>
                                        <span className={`text-sm font-black font-mono tracking-tight ${acc.balances[currency] >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {acc.balances[currency].toLocaleString(locale, { maximumFractionDigits: 6 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </TableShell>
    );
};
