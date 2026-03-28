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
        const map: Record<string, {
            totalUSD: number;
            byPool: Record<string, { tokens: Record<string, number>; totalUSD: number }>;
        }> = {};

        for (const tx of transactions) {
            if (!isEarningsTx(tx)) continue;
            const d = new Date(tx.date);
            if (isNaN(d.getTime())) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) map[key] = { totalUSD: 0, byPool: {} };
            const entry = map[key];
            const price = prices[tx.assetSymbol] ?? 0;
            const usd = tx.paymentAmount ?? (tx.amount * price);
            entry.totalUSD += usd;

            const poolKey = tx.relatedAssetSymbol
                || (tx.relatedAssetSymbols && tx.relatedAssetSymbols[0])
                || tx.assetSymbol;
            if (!entry.byPool[poolKey]) entry.byPool[poolKey] = { tokens: {}, totalUSD: 0 };
            entry.byPool[poolKey].tokens[tx.assetSymbol] = (entry.byPool[poolKey].tokens[tx.assetSymbol] || 0) + tx.amount;
            entry.byPool[poolKey].totalUSD += usd;
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
                <span className="text-center">Pools</span>
                <span className="text-right">Total USD</span>
            </div>

            {monthlyData.map(({ key, label, totalUSD, byPool }) => {
                const isOpen = expandedMonths.has(key);
                const poolEntries = Object.entries(byPool).sort(([, a], [, b]) => b.totalUSD - a.totalUSD);

                return (
                    <div key={key} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <button
                            className="w-full grid grid-cols-3 items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm transition-colors"
                            onClick={() => toggle(key)}
                        >
                            <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-left">
                                <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                {label}
                            </span>
                            <span className="text-center text-slate-500 dark:text-slate-400 text-xs">
                                {poolEntries.length} pool{poolEntries.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-right font-semibold text-slate-800 dark:text-slate-100">
                                {formatPrice(totalUSD, locale)}
                            </span>
                        </button>

                        {isOpen && (
                            <div className="px-4 pb-3 space-y-2">
                                {/* Token totals strip */}
                                {(() => {
                                    const tokenTotals: Record<string, number> = {};
                                    poolEntries.forEach(([, { tokens }]) => {
                                        Object.entries(tokens).forEach(([sym, qty]) => {
                                            tokenTotals[sym] = (tokenTotals[sym] || 0) + qty;
                                        });
                                    });
                                    const entries = Object.entries(tokenTotals).sort(([, a], [, b]) => b - a);
                                    return (
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                                            {entries.map(([sym, qty]) => (
                                                <span key={sym} className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                        {qty < 0.01 ? qty.toFixed(4) : qty.toFixed(2)}
                                                    </span>
                                                    {' '}{sym}
                                                </span>
                                            ))}
                                        </div>
                                    );
                                })()}
                                {poolEntries.map(([pool, { tokens, totalUSD: poolUSD }]) => {
                                    const pct = totalUSD > 0 ? (poolUSD / totalUSD) * 100 : 0;
                                    const tokenList = Object.entries(tokens)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([sym, qty]) => `${qty < 0.01 ? qty.toFixed(4) : qty.toFixed(2)} ${sym}`)
                                        .join(' · ');
                                    return (
                                        <div key={pool} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate mr-2">{pool}</span>
                                                <span className="font-mono text-slate-600 dark:text-slate-300 shrink-0">
                                                    {formatPrice(poolUSD, locale)}
                                                    <span className="ml-1.5 text-slate-400">{pct.toFixed(0)}%</span>
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{tokenList}</div>
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
