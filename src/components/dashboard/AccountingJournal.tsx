import React, { useState, useMemo } from 'react';
import { Transaction } from '../../types';
import { getJournalEntries, JournalEntry, getAccountType, AccountType } from '../../services/AccountingService';
import { TableShell } from '../common/TableShell';
import { Book, Filter, ArrowUpRight, ArrowDownLeft, RefreshCcw, LayoutGrid, List, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface Props {
    transactions: Transaction[];
    locale?: string;
}

const AccountCard = React.memo<{
    acc: any;
    isCompact: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    locale?: string;
}>(({ acc, isCompact, isExpanded, onToggle, locale }) => {
    return (
        <div className={`bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col hover:shadow-lg h-fit ${isCompact ? 'ring-1 ring-slate-200 dark:ring-slate-800' : ''}`}>
            <div
                onClick={() => !isCompact && onToggle()}
                className={`bg-slate-50 dark:bg-slate-800/50 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center ${isCompact ? 'cursor-default' : 'cursor-pointer group/header'}`}
            >
                <div className="flex items-center gap-3">
                    {!isCompact && (
                        <div className={`${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={14} className="text-slate-400 group-hover/header:text-indigo-500" />
                        </div>
                    )}
                    <span className={`font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white ${!isCompact ? 'group-hover/header:text-indigo-600' : ''}`}>{acc.name}</span>
                </div>
                <div className="flex gap-1">
                    {acc.sortedCurrencies.map((c: string) => (
                        <span key={c} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase tracking-widest">{c}</span>
                    ))}
                </div>
            </div>

            {isExpanded && !isCompact && (
                <div className="flex min-h-[220px]">
                    <div className="flex-1 border-r border-slate-100 dark:border-slate-800/50 flex flex-col">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-2 text-center border-b border-slate-50 dark:border-slate-800">Debit (+)</div>
                        <div className="p-4 space-y-2.5 flex-1 overflow-auto max-h-[300px] scrollbar-hide">
                            {acc.debits.map((d: JournalEntry, i: number) => (
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
                            {acc.credits.map((c: JournalEntry, i: number) => (
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
                {!isCompact && (
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2 mb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Balance</span>
                        {!isExpanded && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                className="text-[8px] font-black text-indigo-500 uppercase tracking-widest hover:underline"
                            >
                                View Details
                            </button>
                        )}
                    </div>
                )}
                {acc.sortedCurrencies.map((currency: string) => (
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
});

AccountCard.displayName = 'AccountCard';

export const AccountingJournal: React.FC<Props> = ({ transactions, locale }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filterAccount, setFilterAccount] = useState<string>('ALL');
    const [isCompact, setIsCompact] = useState(false);
    const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

    const entries = useMemo(() => getJournalEntries(transactions), [transactions]);

    const accounts = useMemo(() => {
        const accs = new Set<string>();
        for (let i = 0; i < entries.length; i++) {
            accs.add(entries[i].account.trim().toUpperCase());
        }
        return ['ALL', ...Array.from(accs).sort()];
    }, [entries]);

    const categorizedAccounts = useMemo(() => {
        const grouped: Record<AccountType, any[]> = {
            ASSET: [],
            EQUITY: [],
            REVENUE: [],
            EXPENSE: []
        };

        const accData: Record<string, any> = {};

        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const accName = entry.account.trim().toUpperCase();

            if (filterAccount !== 'ALL' && accName !== filterAccount) continue;

            if (!accData[accName]) {
                accData[accName] = {
                    name: accName,
                    debits: [],
                    credits: [],
                    balances: {},
                    currencies: new Set(),
                    type: getAccountType(accName)
                };
            }

            const data = accData[accName];
            const currency = entry.currency.trim().toUpperCase();
            data.currencies.add(currency);

            if (!data.balances[currency]) {
                data.balances[currency] = 0;
            }

            if (entry.debit > 0) {
                data.debits.push(entry);
                data.balances[currency] += entry.debit;
            }
            if (entry.credit > 0) {
                data.credits.push(entry);
                data.balances[currency] -= entry.credit;
            }
        }

        Object.values(accData).forEach((data: any) => {
            data.sortedCurrencies = Array.from(data.currencies).sort();
            grouped[data.type as AccountType].push(data);
        });

        // Sort each category by name
        (Object.keys(grouped) as AccountType[]).forEach(type => {
            grouped[type].sort((a, b) => a.name.localeCompare(b.name));
        });

        return grouped;
    }, [entries, filterAccount]);

    const toggleAccount = React.useCallback((name: string) => {
        setExpandedAccounts(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    }, []);

    const categoryColors: Record<AccountType, string> = {
        ASSET: 'emerald',
        EQUITY: 'indigo',
        REVENUE: 'indigo',
        EXPENSE: 'rose'
    };

    return (
        <TableShell
            title="Accounting Ledger"
            subtitle=""
            icon={<Book />}
            iconColor="slate"
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="lg:col-span-3 mt-6"
            extraHeaderActions={
                <div className="flex items-center gap-4 ml-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsCompact(!isCompact); }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${isCompact ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                        title={isCompact ? "Show Details" : "Compact View"}
                    >
                        {isCompact ? <EyeOff size={14} /> : <Eye size={14} />}
                        {isCompact ? "Summary" : "Details"}
                    </button>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-400" />
                        <select
                            value={filterAccount}
                            onChange={(e) => setFilterAccount(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-100 dark:bg-slate-800 border-0 rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1.5 focus:ring-2 ring-indigo-500/20 outline-none text-slate-600 dark:text-slate-300 cursor-pointer"
                        >
                            {accounts.map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <div className={`p-8 bg-slate-50/50 dark:bg-slate-950/20 space-y-12`}>
                {(Object.entries(categorizedAccounts) as [AccountType, any[]][]).map(([type, accs]) => {
                    if (accs.length === 0) return null;
                    const color = categoryColors[type];

                    return (
                        <div key={type} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`h-px flex-1 bg-${color}-500/20`}></div>
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] text-${color}-500 px-4 py-1 rounded-full bg-${color}-500/5 ring-1 ring-${color}-500/20`}>
                                    {type}s
                                </h3>
                                <div className={`h-px flex-1 bg-${color}-500/20`}></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {accs.map((acc) => (
                                    <AccountCard
                                        key={acc.name}
                                        acc={acc}
                                        isCompact={isCompact}
                                        isExpanded={!!expandedAccounts[acc.name]}
                                        onToggle={() => toggleAccount(acc.name)}
                                        locale={locale}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </TableShell>
    );
};
