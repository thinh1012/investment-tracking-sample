import React from 'react';
import { ChevronDown } from 'lucide-react';

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
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
                <div className="shrink-0">
                    <div className="text-xs text-slate-400 mb-0.5 whitespace-nowrap">Total LP earnings</div>
                    <div className="text-2xl font-semibold font-mono text-slate-900 dark:text-white">
                        ${totalEarningsUSD.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="shrink-0">
                    <div className="text-xs text-slate-400 mb-0.5 whitespace-nowrap">Top reward</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {totalEarningsByToken[0]?.token || '—'}
                    </div>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="shrink-0">
                    <div className="text-xs text-slate-400 mb-0.5 whitespace-nowrap">Avg monthly</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        ${(totalEarningsUSD / 12).toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <button
                    onClick={onToggleDetail}
                    className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                    Breakdown
                    <ChevronDown size={14} className={showDetail ? 'rotate-180' : ''} />
                </button>
            </div>

            {showDetail && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {totalEarningsByToken.map(({ token, quantity, value }) => (
                        <div key={token} className="border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{token}</div>
                            <div className="text-xs font-mono text-slate-500 mt-0.5">{quantity.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}</div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                ${value.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
