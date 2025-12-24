import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Transaction } from '../../types';

interface FundingBreakdownProps {
    groupedBreakdown: Record<string, number>;
    fundingOffset: number | null;
    transactions: Transaction[];
    onUpdateFundingOffset: (offset: number | null) => void;
    locale?: string;
}

export const FundingBreakdown: React.FC<FundingBreakdownProps> = ({ groupedBreakdown, fundingOffset, transactions, onUpdateFundingOffset, locale }) => {
    const [isFundingHistoryOpen, setIsFundingHistoryOpen] = useState(false);
    const [isEditingFunding, setIsEditingFunding] = useState(false);
    const [tempFunding, setTempFunding] = useState('');

    return (
        <>
            {Object.keys(groupedBreakdown).length > 0 && (
                <div className="mt-8 mb-10 overflow-hidden animate-slide-up animate-stagger-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-1 px-2 mesh-gradient rounded-lg text-white text-[10px] font-black tracking-widest uppercase">
                            Capital
                        </div>
                        <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-heading">Funding Breakdown</h4>
                        <button
                            onClick={() => setIsFundingHistoryOpen(!isFundingHistoryOpen)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-110 active:scale-95 group"
                            title="View Funding History"
                        >
                            <Clock size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </button>
                    </div>

                    {/* Funding History List */}
                    {isFundingHistoryOpen && (
                        <div className="mb-6 glass border dark:border-slate-800/50 rounded-2xl p-5 animate-in slide-in-from-top-4 fade-in duration-500 shadow-2xl shadow-indigo-500/5 ring-1 ring-indigo-500/10">
                            <h5 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 font-heading flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" />
                                Fresh Capital Transactions
                            </h5>
                            <div className="max-h-60 overflow-y-auto pr-3 space-y-2 custom-scrollbar">
                                {transactions
                                    .filter(t => {
                                        if (t.type === 'DEPOSIT') return t.paymentAmount || (t.pricePerUnit && t.amount);
                                        if (t.type === 'WITHDRAWAL') {
                                            if (t.linkedTransactionId) {
                                                const parent = transactions.find(Lx => Lx.id === t.linkedTransactionId);
                                                return !(parent && parent.paymentAmount);
                                            }
                                            return true; // Simple withdrawals reduce capital
                                        }
                                        return false;
                                    })
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((t, idx) => {
                                        let amt = 0;
                                        let curr = 'USD';
                                        let isNegative = false;

                                        if (t.type === 'DEPOSIT') {
                                            amt = t.paymentAmount || (t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0);
                                            curr = t.paymentCurrency || 'USD';
                                        } else {
                                            amt = t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0;
                                            curr = 'USD'; // Assumption for withdrawals
                                            isNegative = true;
                                        }

                                        return (
                                            <div key={t.id} className={`flex justify-between items-center text-xs py-2.5 border-b border-slate-100/50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-lg transition-colors animate-slide-up animate-stagger-${Math.min(idx + 1, 4)}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-bold tracking-tighter opacity-70">{t.date}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${t.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                        {t.type === 'DEPOSIT' ? 'INFLOW' : 'OUTFLOW'}
                                                    </span>
                                                    <span className="font-bold text-slate-600 dark:text-slate-300">
                                                        {t.assetSymbol} {isNegative ? <span className="text-[10px] font-medium text-slate-400">(Sale/Exit)</span> : ''}
                                                    </span>
                                                </div>
                                                <div className="font-heading font-black text-slate-800 dark:text-slate-100">
                                                    {isNegative ? '-' : '+'}{amt.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })} <span className="text-[10px] opacity-50 uppercase tracking-widest">{curr}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className="mt-4 text-[10px] text-slate-400 text-center border-t border-slate-100/50 dark:border-slate-800/30 pt-3 italic font-medium">
                                Note: List shows transactions affecting "Fresh Capital". Swaps (Buy A / Sell B) usually net to zero.
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                        {Object.entries(groupedBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([curr, amt], idx) => (
                                <div key={curr} className={`flex items-center gap-3 glass border border-slate-200/50 dark:border-slate-800/50 rounded-xl px-4 py-2.5 shadow-lg shadow-slate-200/20 dark:shadow-slate-900/40 whitespace-nowrap min-w-fit hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 animate-slide-up animate-stagger-${Math.min(idx + 1, 4)} group`}>
                                    <div className="p-1 px-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-black tracking-widest rounded-lg border border-indigo-500/20 group-hover:mesh-gradient group-hover:text-white transition-all duration-300">
                                        {curr}
                                    </div>
                                    <div className="text-base font-black text-slate-800 dark:text-slate-100 cursor-pointer font-heading" onClick={() => {
                                        if (curr === 'USD Stablecoins') {
                                            setTempFunding(groupedBreakdown['USD Stablecoins']?.toString() || '');
                                            setIsEditingFunding(true);
                                        }
                                    }}>
                                        {curr === 'USD Stablecoins' && isEditingFunding ? (
                                            <input
                                                type="number"
                                                autoFocus
                                                className="w-24 bg-slate-100 dark:bg-slate-800 border border-indigo-500/20 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 ring-indigo-500/10 font-black text-indigo-500"
                                                value={tempFunding}
                                                onChange={e => setTempFunding(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        const val = parseFloat(tempFunding);
                                                        if (!isNaN(val)) {
                                                            const currentDisplayed = groupedBreakdown['USD Stablecoins'] || 0;
                                                            const actual = currentDisplayed - (fundingOffset || 0);
                                                            const newOffset = val - actual;
                                                            onUpdateFundingOffset(newOffset);
                                                        } else {
                                                            onUpdateFundingOffset(null);
                                                        }
                                                        setIsEditingFunding(false);
                                                    }
                                                    if (e.key === 'Escape') setIsEditingFunding(false);
                                                }}
                                                onBlur={() => {
                                                    const val = parseFloat(tempFunding);
                                                    if (!isNaN(val)) {
                                                        const currentDisplayed = groupedBreakdown['USD Stablecoins'] || 0;
                                                        const actual = currentDisplayed - (fundingOffset || 0);
                                                        const newOffset = val - actual;
                                                        onUpdateFundingOffset(newOffset);
                                                    }
                                                    setIsEditingFunding(false);
                                                }}
                                            />
                                        ) : (
                                            `$${amt.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}`
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </>
    );
};
