import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react';
import { Asset, Transaction } from '../../types';

interface EarningsHistoryProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
    locale?: string;
    defaultOpen?: boolean;
}

export const EarningsHistory: React.FC<EarningsHistoryProps> = ({ assets, transactions, prices, locale, defaultOpen = false }) => {
    const [isEarningsHistoryOpen, setIsEarningsHistoryOpen] = useState(defaultOpen);
    const [showDetail, setShowDetail] = useState(false);
    const [earningsSearchTerm, setEarningsSearchTerm] = useState('');
    const [earningsSortKey, setEarningsSortKey] = useState<'totalValue' | 'source' | 'roi' | 'apr'>('totalValue');
    const [earningsSortOrder, setEarningsSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

    const toggleSourceExpansion = (source: string) => {
        const newExpanded = new Set(expandedSources);
        if (newExpanded.has(source)) {
            newExpanded.delete(source);
        } else {
            newExpanded.add(source);
        }
        setExpandedSources(newExpanded);
    };

    const handleEarningsSort = (key: 'totalValue' | 'source' | 'roi' | 'apr') => {
        if (earningsSortKey === key) {
            setEarningsSortOrder(earningsSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setEarningsSortKey(key);
            setEarningsSortOrder('desc');
        }
    };

    // Calculation Logic
    const earningsBySource = useMemo(() => {
        return transactions
            .filter(t => {
                if (t.type !== 'INTEREST') return false;
                let sources: string[] = [];
                if (t.relatedAssetSymbols && t.relatedAssetSymbols.length > 0) {
                    sources = t.relatedAssetSymbols;
                } else if (t.relatedAssetSymbol) {
                    sources = [t.relatedAssetSymbol];
                }

                if (sources.length === 0) return false;

                return sources.some(symbol => {
                    const asset = assets.find(a => a.symbol === symbol);
                    return (asset && asset.lpRange) || symbol.toUpperCase().startsWith('LP') || symbol.includes('/') || symbol.includes('-') || symbol.toUpperCase().includes('POOL');
                });
            })
            .reduce((acc, t) => {
                let sourceKey = 'Other';
                let currentSourceSymbols: string[] = [];

                if (t.relatedAssetSymbols && t.relatedAssetSymbols.length > 0) {
                    currentSourceSymbols = [...t.relatedAssetSymbols].sort();
                    sourceKey = currentSourceSymbols.join(' + ');
                } else if (t.relatedAssetSymbol) {
                    currentSourceSymbols = [t.relatedAssetSymbol];
                    sourceKey = t.relatedAssetSymbol;
                } else if (t.platform) {
                    sourceKey = t.platform;
                }

                if (!acc[sourceKey]) {
                    acc[sourceKey] = {
                        source: sourceKey,
                        sourceSymbols: currentSourceSymbols,
                        tokens: {},
                        totalValue: 0,
                        transactions: []
                    };
                }

                const symbolKey = t.assetSymbol.trim().toUpperCase();
                if (!acc[sourceKey].tokens[symbolKey]) {
                    acc[sourceKey].tokens[symbolKey] = 0;
                }
                acc[sourceKey].tokens[symbolKey] += t.amount;

                const price = prices?.[t.assetSymbol] || 0;
                acc[sourceKey].totalValue += t.amount * price;
                acc[sourceKey].transactions.push(t);

                return acc;
            }, {} as Record<string, { source: string; sourceSymbols: string[]; tokens: Record<string, number>; totalValue: number; transactions: Transaction[] }>);
    }, [transactions, assets, prices]);

    const enhancedEarnings = useMemo(() => {
        return Object.values(earningsBySource).map(item => {
            let roi = null;
            let apr = null;
            let daysActive = 0;
            let totalInvested = 0;

            const symbolsToCheck = (item.sourceSymbols && item.sourceSymbols.length > 0)
                ? item.sourceSymbols
                : [item.source];

            symbolsToCheck.forEach(symbol => {
                const asset = assets.find(a => a.symbol === symbol);

                if (asset && asset.totalInvested > 0) {
                    totalInvested += asset.totalInvested;
                } else {
                    const symbolInvested = transactions
                        .filter(t => (t.type === 'DEPOSIT' || t.type === 'BUY') && (t.assetSymbol === symbol))
                        .reduce((sum, t) => {
                            const cost = t.paymentAmount || (t.amount * (t.pricePerUnit || 0));
                            return sum + cost;
                        }, 0);
                    totalInvested += symbolInvested;
                }
            });

            if (totalInvested > 0) {
                roi = (item.totalValue / totalInvested) * 100;

                const firstTx = transactions
                    .filter(t => {
                        const isDeposit = t.type === 'DEPOSIT' || t.type === 'BUY';
                        if (!isDeposit) return false;

                        return symbolsToCheck.some(s =>
                            t.assetSymbol === s ||
                            t.relatedAssetSymbol === s ||
                            (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(s))
                        );
                    })
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                if (firstTx) {
                    const start = new Date(firstTx.date).getTime();
                    const now = new Date().getTime();
                    const diffTime = Math.abs(now - start);
                    daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (daysActive > 0) {
                        apr = (roi / daysActive) * 365;
                    }
                }
            }

            return { ...item, roi, apr, totalInvested, daysActive };
        });
    }, [earningsBySource, assets, transactions]);

    const sortedEarnings = useMemo(() => {
        return [...enhancedEarnings].sort((a, b) => {
            const order = earningsSortOrder === 'asc' ? 1 : -1;
            if (earningsSortKey === 'source') {
                return a.source.localeCompare(b.source) * order;
            } else if (earningsSortKey === 'roi') {
                const valA = a.roi || 0;
                const valB = b.roi || 0;
                return (valA - valB) * order;
            } else if (earningsSortKey === 'apr') {
                const valA = a.apr || 0;
                const valB = b.apr || 0;
                return (valA - valB) * order;
            }
            return (a.totalValue - b.totalValue) * order;
        });
    }, [enhancedEarnings, earningsSortKey, earningsSortOrder]);

    const filteredEarnings = useMemo(() => {
        return sortedEarnings.filter(item => {
            if (!earningsSearchTerm) return true;
            const term = earningsSearchTerm.toLowerCase();
            return (
                item.source.toLowerCase().includes(term) ||
                item.sourceSymbols.some(s => s.toLowerCase().includes(term))
            );
        });
    }, [sortedEarnings, earningsSearchTerm]);

    const totalEarningsByToken = useMemo(() => {
        const totals: Record<string, { quantity: number; value: number }> = {};
        Object.values(earningsBySource).forEach(source => {
            Object.entries(source.tokens).forEach(([token, amount]) => {
                if (!totals[token]) totals[token] = { quantity: 0, value: 0 };
                totals[token].quantity += amount;
                totals[token].value += (amount * (prices[token] || 0));
            });
        });
        return Object.entries(totals)
            .sort((a, b) => b[1].value - a[1].value) // Sort by value desc
            .map(([token, data]) => ({ token, ...data }));
    }, [earningsBySource, prices]);

    const totalEarningsUSD = useMemo(() => {
        return totalEarningsByToken.reduce((sum, item) => sum + item.value, 0);
    }, [totalEarningsByToken]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mt-8">
            <div
                className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsEarningsHistoryOpen(!isEarningsHistoryOpen)}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                            <TrendingUp className="text-emerald-500" size={20} />
                            Earnings History
                            {!isEarningsHistoryOpen ? <ChevronDown className="text-slate-400 ml-2" size={20} /> : <ChevronUp className="text-slate-400 ml-2" size={20} />}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Summary of earnings by Liquidity Pool.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {isEarningsHistoryOpen && (
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={earningsSearchTerm}
                                    onChange={(e) => setEarningsSearchTerm(e.target.value)}
                                    placeholder="Search source..."
                                    className="block w-40 rounded-lg border-0 py-1.5 pl-9 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        )}
                        {!isEarningsHistoryOpen ? <ChevronDown className="text-slate-400" size={20} /> : <ChevronUp className="text-slate-400" size={20} />}
                    </div>
                </div>
            </div>

            {isEarningsHistoryOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 w-full">
                            <div
                                onClick={() => setShowDetail(!showDetail)}
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

                    {/* Detailed Breakdown Transition */}
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
            )}

            {isEarningsHistoryOpen && (
                <div className="overflow-x-auto border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer group" onClick={() => handleEarningsSort('source')}>
                                    <div className="flex items-center gap-1">
                                        Source
                                        {earningsSortKey === 'source' && (earningsSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4">Tokens Earned</th>
                                <th className="px-6 py-4 text-right cursor-pointer group" onClick={() => handleEarningsSort('totalValue')}>
                                    <div className="flex items-center justify-end gap-1">
                                        Total Value
                                        {earningsSortKey === 'totalValue' && (earningsSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer group" onClick={() => handleEarningsSort('roi')}>
                                    <div className="flex items-center justify-end gap-1">
                                        ROI
                                        {earningsSortKey === 'roi' && (earningsSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right cursor-pointer group" onClick={() => handleEarningsSort('apr')}>
                                    <div className="flex items-center justify-end gap-1">
                                        APR
                                        {earningsSortKey === 'apr' && (earningsSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredEarnings.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => toggleSourceExpansion(item.source)}>
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <button
                                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                                            >
                                                {expandedSources.has(item.source) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                            {item.source}
                                            {item.sourceSymbols.length > 1 && (
                                                <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                    {item.sourceSymbols.length} Assets
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {Object.entries(item.tokens).map(([token, amount]) => (
                                                    <div key={token} className="text-sm text-slate-600 dark:text-slate-300">
                                                        <span className="font-bold">{amount.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}</span> <span className="text-xs text-slate-500">{token}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                ${item.totalValue.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.roi !== null ? (
                                                <span className="font-mono font-medium text-emerald-600">
                                                    {item.roi.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {item.apr !== null ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                        {item.apr.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {item.daysActive} days
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedSources.has(item.source) && (
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                            <td colSpan={3} className="px-0 py-0 border-b border-slate-100 dark:border-slate-800">
                                                <div className="px-6 py-3 space-y-2">
                                                    <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transaction History</h6>
                                                    <div className="max-h-48 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                                        {item.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                                            <div key={t.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-800/50 px-2 rounded">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-slate-400 font-mono w-20">{t.date}</span>
                                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">+{t.amount} {t.assetSymbol}</span>
                                                                </div>
                                                                <div>
                                                                    {t.pricePerUnit ? (
                                                                        <span className="text-slate-500">
                                                                            <span className="mr-2">@ ${t.pricePerUnit.toLocaleString(locale || 'en-US')}</span>
                                                                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                                                                ${(t.amount * t.pricePerUnit).toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-400 italic">No Price</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
