import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Transaction } from '../../../types';
import { formatPrice } from '../../../services/PriceService';

interface MonthlyEarningsProps {
    transactions: Transaction[];
    prices: Record<string, number>;
    locale?: string;
}

const EARNINGS_TYPES = new Set(['INTEREST', 'STAKING', 'REWARD', 'YIELD', 'SAVINGS', 'FARMING', 'LENDING', 'OTHER']);

function isEarningsTx(tx: Transaction): boolean {
    if (tx.type === 'INTEREST') return true;
    if (tx.interestType && EARNINGS_TYPES.has(tx.interestType)) return true;
    return false;
}

function formatMonth(key: string): string {
    const [year, month] = key.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export const MonthlyEarnings: React.FC<MonthlyEarningsProps> = ({ transactions, prices, locale }) => {
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

    const monthlyData = useMemo(() => {
        const map: Record<string, { tokens: Record<string, number>; totalUSD: number }> = {};

        for (const tx of transactions) {
            if (!isEarningsTx(tx)) continue;
            const d = new Date(tx.date);
            if (isNaN(d.getTime())) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) map[key] = { tokens: {}, totalUSD: 0 };
            const entry = map[key];
            entry.tokens[tx.assetSymbol] = (entry.tokens[tx.assetSymbol] || 0) + tx.amount;
            const price = prices[tx.assetSymbol] ?? 0;
            entry.totalUSD += tx.amount * price;
        }

        return Object.entries(map)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([key, data]) => ({ key, label: formatMonth(key), ...data }));
    }, [transactions, prices]);

    const toggle = (key: string) => {
        setExpandedMonths(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    if (monthlyData.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 text-sm mt-2">
                No earnings recorded yet.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-2">
            <div className="grid grid-cols-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800">
                <span>Month</span>
                <span className="text-center">Tokens</span>
                <span className="text-right">Total USD</span>
            </div>

            {monthlyData.map(({ key, label, tokens, totalUSD }) => {
                const isOpen = expandedMonths.has(key);
                const tokenEntries = Object.entries(tokens).sort(([, a], [, b]) => b - a);

                return (
                    <div key={key} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <button
                            className="w-full grid grid-cols-3 items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm transition-colors"
                            onClick={() => toggle(key)}
                        >
                            <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-left">
                                <ChevronDown
                                    size={14}
                                    className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                                {label}
                            </span>
                            <span className="text-center text-slate-500 dark:text-slate-400 text-xs">
                                {tokenEntries.map(([sym]) => sym).join(', ')}
                            </span>
                            <span className="text-right font-semibold text-slate-800 dark:text-slate-100">
                                {formatPrice(totalUSD, locale)}
                            </span>
                        </button>

                        {isOpen && (
                            <div className="px-6 pb-3 space-y-1">
                                {tokenEntries.map(([sym, qty]) => {
                                    const price = prices[sym] ?? 0;
                                    const usd = qty * price;
                                    return (
                                        <div key={sym} className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 py-0.5">
                                            <span className="font-medium text-slate-600 dark:text-slate-300">{sym}</span>
                                            <span>
                                                {qty < 0.001 ? qty.toFixed(6) : qty < 1 ? qty.toFixed(4) : qty.toFixed(2)}
                                                {price > 0 && (
                                                    <span className="ml-2 text-slate-400 dark:text-slate-500">
                                                        ≈ {formatPrice(usd, locale)}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
