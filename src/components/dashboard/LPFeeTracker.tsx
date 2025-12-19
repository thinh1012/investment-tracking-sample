import React, { useMemo } from 'react';
import { Asset, Transaction } from '../../types';
import { Wallet, TrendingUp, PiggyBank, ArrowRight, Plus } from 'lucide-react';

interface LPFeeTrackerProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
    locale?: string;
    onAddClaim?: (lpSymbol: string) => void;
}

export const LPFeeTracker: React.FC<LPFeeTrackerProps> = ({ assets, transactions, prices, locale, onAddClaim }) => {
    const lpData = useMemo(() => {
        // 1. Identify LPs
        const lps = assets.filter(a =>
            a.lpRange ||
            a.symbol.toUpperCase().startsWith('LP') ||
            a.symbol.includes('/') ||
            a.symbol.includes('-') ||
            a.symbol.toUpperCase().includes('POOL')
        );

        return lps.map(lp => {
            // 2. Calculate Principal (Total Invested)
            // We use asset.totalInvested which is already calculated in the hook
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

            // 4. Calculate Current Pool Value
            const currentValue = lp.currentValue || principal;

            return {
                ...lp,
                principal,
                claimedUSD,
                recoveryPercent,
                isFreeRolling,
                currentValue,
                netPosition: claimedUSD + (currentValue - principal)
            };
        }).sort((a, b) => b.claimedUSD - a.claimedUSD);
    }, [assets, transactions, prices]);

    const totalStats = useMemo(() => {
        return lpData.reduce((acc, lp) => ({
            totalPrincipal: acc.totalPrincipal + lp.principal,
            totalClaimed: acc.totalClaimed + lp.claimedUSD,
            totalNet: acc.totalNet + lp.netPosition
        }), { totalPrincipal: 0, totalClaimed: 0, totalNet: 0 });
    }, [lpData]);

    return (
        <div className="space-y-6">
            {/* Summary Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500 dark:text-slate-400">
                        <Wallet size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Principal</span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        ${totalStats.totalPrincipal.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-slate-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Realized Fees</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        +${totalStats.totalClaimed.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-indigo-500 dark:text-indigo-400">
                        <PiggyBank size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Total Net Profit</span>
                    </div>
                    <div className={`text-2xl font-black ${totalStats.totalNet >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                        {totalStats.totalNet >= 0 ? '+' : ''}${totalStats.totalNet.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>
            </div>

            {/* LP Yield Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-4">Liquidity Pool</th>
                            <th className="px-6 py-4">Principal</th>
                            <th className="px-6 py-4">Realized Fees</th>
                            <th className="px-6 py-4">Payback Progress</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {lpData.map((lp) => (
                            <tr key={lp.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 dark:text-white">{lp.symbol}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {lp.isFreeRolling ? (
                                            <span className="text-emerald-500 font-bold">✨ FREE ROLLING</span>
                                        ) : (
                                            <span>Active Position</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                                    ${lp.principal.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        +${lp.claimedUSD.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 min-w-[200px]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${lp.isFreeRolling ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-indigo-500'}`}
                                                style={{ width: `${Math.min(lp.recoveryPercent, 100)}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-bold w-12 ${lp.isFreeRolling ? 'text-emerald-600' : 'text-slate-500'}`}>
                                            {lp.recoveryPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onAddClaim && onAddClaim(lp.symbol)}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-all"
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

            {/* Insights Footer */}
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30 flex items-start gap-4">
                <TrendingUp className="text-indigo-500 mt-1" size={18} />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    <span className="font-bold text-indigo-600">Pro Tip:</span> "Payback Progress" measures how much of your original cash principal has been recovered via harvested rewards. When it hits 100%, you are <strong>risk-free</strong> on that capital!
                </p>
            </div>
        </div>
    );
};
