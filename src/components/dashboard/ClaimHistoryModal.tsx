import React, { useMemo } from 'react';
import { X, TrendingUp, Calendar, Coins } from 'lucide-react';
import { Transaction } from '../../types';

interface ClaimHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    lpSymbol: string;
    transactions: Transaction[];
    prices: Record<string, number>;
    onLogNewClaim: () => void;
}

export const ClaimHistoryModal: React.FC<ClaimHistoryModalProps> = ({
    isOpen,
    onClose,
    lpSymbol,
    transactions,
    prices,
    onLogNewClaim
}) => {
    const claims = useMemo(() => {
        return transactions
            .filter(t => {
                if (t.type !== 'INTEREST') return false;
                return t.relatedAssetSymbol === lpSymbol ||
                    (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(lpSymbol));
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, lpSymbol]);

    const totalValue = useMemo(() => {
        return claims.reduce((sum, t) => {
            const value = t.paymentAmount || (t.amount * (t.pricePerUnit || prices[t.assetSymbol] || 0));
            return sum + value;
        }, 0);
    }, [claims, prices]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Coins className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                Claim History
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                {lpSymbol}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Summary */}
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 border-b border-emerald-200 dark:border-emerald-800/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                Total Realized Fees
                            </span>
                        </div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {claims.length} claim{claims.length !== 1 ? 's' : ''} recorded
                    </p>
                </div>

                {/* Claims Table */}
                <div className="overflow-y-auto max-h-[400px]">
                    {claims.length === 0 ? (
                        <div className="p-12 text-center">
                            <Coins size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-400 dark:text-slate-500 font-medium">
                                No claims recorded yet for this LP
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                                Click "Log New Claim" below to add your first one
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                <tr className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="px-6 py-3 text-left">Date</th>
                                    <th className="px-6 py-3 text-left">Token</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-right">Value (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {claims.map((claim, idx) => {
                                    const value = claim.paymentAmount || (claim.amount * (claim.pricePerUnit || prices[claim.assetSymbol] || 0));
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(claim.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800 dark:text-white">
                                                    {claim.assetSymbol}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                                                {claim.amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            onLogNewClaim();
                            onClose();
                        }}
                        className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                    >
                        <TrendingUp size={16} />
                        Log New Claim
                    </button>
                </div>
            </div>
        </div>
    );
};
