import React from 'react';
import { TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';

interface EarningsHeroProps {
    totalEarningsUSD: number;
    totalEarningsByToken: { token: string; quantity: number; value: number }[];
    showDetail: boolean;
    onToggleDetail: () => void;
    locale?: string;
}

export const EarningsHero: React.FC<EarningsHeroProps> = ({
    totalEarningsUSD,
    totalEarningsByToken,
    showDetail,
    onToggleDetail,
    locale
}) => {
    return (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full">
                    <div
                        onClick={onToggleDetail}
                        className={`bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800 p-6 rounded-2xl border ${showDetail ? 'border-emerald-500 shadow-emerald-500/10' : 'border-emerald-100 dark:border-emerald-800/30'} shadow-sm group hover:scale-[1.01] transition-all duration-300 cursor-pointer relative overflow-hidden`}
                    >
                        <div className="absolute top-4 right-4 text-emerald-500/40 group-hover:text-emerald-500 transition-colors">
                            {showDetail ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <TrendingUp className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Estimated LP Earnings</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                                        ${totalEarningsUSD.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">USD</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2">
                                    Accumulated across <span className="font-bold text-slate-700 dark:text-slate-200">{totalEarningsByToken.length}</span> reward tokens. <span className="text-emerald-600 font-medium ml-1">Click to {showDetail ? 'hide' : 'view'} breakdown</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:grid grid-cols-2 gap-3 flex-shrink-0">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Top Reward</span>
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                            {totalEarningsByToken[0]?.token || 'N/A'}
                        </span>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg Monthly</span>
                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                            ${(totalEarningsUSD / 12).toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            {showDetail && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Detailed Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {totalEarningsByToken.map(({ token, quantity, value }) => (
                            <div key={token} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{token}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{quantity.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}</div>
                                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                                    ${value.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
