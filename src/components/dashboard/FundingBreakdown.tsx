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
                <div className="mt-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Funding Breakdown</h4>
                        <button
                            onClick={() => setIsFundingHistoryOpen(!isFundingHistoryOpen)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            title="View Funding History"
                        >
                            <Clock size={14} className="text-slate-400 hover:text-indigo-500" />
                        </button>
                    </div>

                    {/* Funding History List */}
                    {isFundingHistoryOpen && (
                        <div className="mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
                            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Fresh Capital Transactions</h5>
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
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
                                    .map(t => {
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
                                            <div key={t.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-mono">{t.date}</span>
                                                    <span className={`font-semibold ${t.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                        {t.type === 'DEPOSIT' ? 'IN' : 'OUT'}
                                                    </span>
                                                    <span className="text-slate-600 dark:text-slate-400">
                                                        {t.assetSymbol} {isNegative ? '(Sell/Swap)' : ''}
                                                    </span>
                                                </div>
                                                <div className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                                    {isNegative ? '-' : '+'}{amt.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })} {curr}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                            <div className="mt-2 text-[10px] text-slate-400 text-center border-t border-slate-50 dark:border-slate-800 pt-1">
                                Note: List shows transactions affecting "Fresh Capital". Swaps (Buy A / Sell B) usually net to zero.
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {Object.entries(groupedBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([curr, amt]) => (
                                <div key={curr} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap min-w-fit">
                                    <div className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 rounded">
                                        {curr}
                                    </div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer" onClick={() => {
                                        if (curr === 'USD Stablecoins') {
                                            setTempFunding(groupedBreakdown['USD Stablecoins']?.toString() || '');
                                            setIsEditingFunding(true);
                                        }
                                    }}>
                                        {curr === 'USD Stablecoins' && isEditingFunding ? (
                                            <input
                                                type="number"
                                                autoFocus
                                                className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-sm focus:outline-none"
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
