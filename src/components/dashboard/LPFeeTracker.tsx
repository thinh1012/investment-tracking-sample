import React, { useMemo, useState } from 'react';
import { Asset, Transaction } from '../../types';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { ClaimHistoryModal } from './ClaimHistoryModal';

interface LPFeeTrackerProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
    locale?: string;
    onAddClaim?: (lpSymbol: string) => void;
}

export const LPFeeTracker: React.FC<LPFeeTrackerProps> = ({ assets, transactions, prices, locale, onAddClaim }) => {
    const [sortKey, setSortKey] = useState<string>('claimedUSD');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedLP, setSelectedLP] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const lpData = useMemo(() => {
        // 1. Identify LPs
        const lps = assets.filter(a =>
            a.symbol.toUpperCase().startsWith('LP') ||
            a.symbol.includes('/') ||
            a.symbol.includes('-') ||
            a.symbol.toUpperCase().includes('POOL') ||
            (a.lpRange && a.symbol.includes(' '))
        );

        const mapped = lps.map(lp => {
            // 2. Calculate Principal (Total Invested)
            const principal = lp.totalInvested;

            // 3. Calculate Fees Claimed (INTEREST transactions related to this LP)
            const rewards = transactions.filter(t => {
                if (t.type !== 'INTEREST') return false;
                const isRelated = t.relatedAssetSymbol === lp.symbol ||
                    (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(lp.symbol));
                return isRelated;
            });

            const claimedUSD = rewards.reduce((sum, t) => {
                const value = t.paymentAmount || (t.amount * (t.pricePerUnit || prices[t.assetSymbol] || 0));
                return sum + value;
            }, 0);

            const recoveryPercent = principal > 0 ? (claimedUSD / principal) * 100 : 0;
            const isFreeRolling = recoveryPercent >= 100;

            // 4. Calculate Current Pool Value & Paper Gains
            const currentValue = lp.currentValue || principal;
            const paperPnL = currentValue - principal;
            const netPosition = claimedUSD + paperPnL;
            const totalROI = principal > 0 ? (netPosition / principal) * 100 : 0;

            return {
                ...lp,
                principal,
                claimedUSD,
                recoveryPercent,
                isFreeRolling,
                currentValue,
                paperPnL,
                netPosition,
                totalROI
            };
        });

        // 5. Sorting
        return mapped.sort((a, b) => {
            const order = sortOrder === 'asc' ? 1 : -1;
            if (sortKey === 'symbol') return a.symbol.localeCompare(b.symbol) * order;

            const valA = (a as any)[sortKey] || 0;
            const valB = (b as any)[sortKey] || 0;
            return (valA - valB) * order;
        });
    }, [assets, transactions, prices, sortKey, sortOrder]);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const totalStats = useMemo(() => {
        return lpData.reduce((acc, lp) => ({
            totalPrincipal: acc.totalPrincipal + lp.principal,
            totalClaimed: acc.totalClaimed + lp.claimedUSD,
            totalPaper: acc.totalPaper + lp.paperPnL,
            totalNet: acc.totalNet + lp.netPosition
        }), { totalPrincipal: 0, totalClaimed: 0, totalPaper: 0, totalNet: 0 });
    }, [lpData]);

    return (
        <div className="space-y-6">
            {/* Summary — inline stat strip */}
            <div className="flex items-center gap-8 px-1 border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
                <div>
                    <div className="text-xs text-slate-400 mb-0.5">Principal</div>
                    <div className="text-base font-semibold font-mono text-slate-800 dark:text-white tabular-nums">
                        ${totalStats.totalPrincipal.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
                <div>
                    <div className="text-xs text-slate-400 mb-0.5">Realized fees</div>
                    <div className="text-base font-semibold font-mono text-emerald-500 tabular-nums">
                        +${totalStats.totalClaimed.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
                <div>
                    <div className="text-xs text-slate-400 mb-0.5">Paper PnL</div>
                    <div className={`text-base font-semibold font-mono tabular-nums ${totalStats.totalPaper >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-500'}`}>
                        {totalStats.totalPaper >= 0 ? '+' : ''}${totalStats.totalPaper.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
                <div>
                    <div className="text-xs text-slate-400 mb-0.5">Net profit</div>
                    <div className={`text-base font-semibold font-mono tabular-nums ${totalStats.totalNet >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                        {totalStats.totalNet >= 0 ? '+' : ''}${totalStats.totalNet.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                        <span className="text-xs font-normal ml-1.5 text-slate-400">
                            ({totalStats.totalPrincipal > 0 ? (totalStats.totalNet / totalStats.totalPrincipal * 100).toFixed(1) : '0'}%)
                        </span>
                    </div>
                </div>
            </div>

            {/* LP Yield Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium">
                        <tr>
                            <th className="px-6 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('symbol')}>
                                <div className="flex items-center gap-1">
                                    Liquidity Pool {sortKey === 'symbol' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                            </th>
                            <th className="px-6 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('principal')}>
                                <div className="flex items-center gap-1">
                                    Principal {sortKey === 'principal' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                            </th>
                            <th className="px-6 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('claimedUSD')}>
                                <div className="flex items-center gap-1">
                                    Realized Fees {sortKey === 'claimedUSD' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                            </th>
                            <th className="px-6 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('paperPnL')}>
                                <div className="flex items-center gap-1">
                                    Pool PnL {sortKey === 'paperPnL' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                            </th>
                            <th className="px-6 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('totalROI')}>
                                <div className="flex items-center gap-1">
                                    Net ROI {sortKey === 'totalROI' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                                </div>
                            </th>
                            <th className="px-6 py-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lpData.map((lp) => (
                            <tr key={lp.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 group">
                                <td className="px-4 py-2">
                                    <div className="text-sm font-medium text-slate-800 dark:text-white">{lp.symbol}</div>
                                    {lp.isFreeRolling && (
                                        <div className="text-xs text-emerald-500 mt-0.5">Free rolling</div>
                                    )}
                                </td>
                                <td className="px-4 py-2 font-mono text-sm text-slate-600 dark:text-slate-300">
                                    ${lp.principal.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="px-4 py-2 font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                    +${lp.claimedUSD.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                </td>
                                <td className={`px-4 py-2 font-mono text-sm ${lp.paperPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {lp.paperPnL >= 0 ? '+' : ''}${lp.paperPnL.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                </td>
                                <td className="px-4 py-2 min-w-[160px]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${lp.totalROI >= 0 ? (lp.isFreeRolling ? 'bg-emerald-400' : 'bg-indigo-500') : 'bg-rose-500'}`}
                                                style={{ width: `${Math.min(Math.abs(lp.totalROI), 100)}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-mono tabular-nums ${lp.totalROI >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-500'}`}>
                                            {lp.totalROI >= 0 ? '+' : ''}{lp.totalROI.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-0.5">Payback {lp.recoveryPercent.toFixed(1)}%</div>
                                </td>
                                <td className="px-6 py-2 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedLP(lp.symbol);
                                            setIsHistoryModalOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                                    >
                                        <Plus size={14} />
                                        Log Claim
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {lpData.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">
                        No Liquidity Pools found to track.
                    </div>
                )}
            </div>


            {/* Claim History Modal */}
            {selectedLP && (
                <ClaimHistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={() => setIsHistoryModalOpen(false)}
                    lpSymbol={selectedLP}
                    transactions={transactions}
                    prices={prices}
                    onLogNewClaim={() => onAddClaim && onAddClaim(selectedLP)}
                />
            )}
        </div>
    );
};
