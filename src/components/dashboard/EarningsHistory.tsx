import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, TrendingUp } from 'lucide-react';
import { Asset, Transaction } from '../../types';
import { useEarningsCalculations } from '../../hooks/useEarningsCalculations';
import { EarningsHero } from './earnings/EarningsHero';
import { EarningsTable } from './earnings/EarningsTable';

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

    const {
        enhancedEarnings,
        totalEarningsByToken,
        totalEarningsUSD
    } = useEarningsCalculations(assets, transactions, prices);

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

    const filteredEarnings = useMemo(() => {
        let result = [...enhancedEarnings];

        // Search Filter
        if (earningsSearchTerm) {
            const term = earningsSearchTerm.toLowerCase();
            result = result.filter(item =>
                item.source.toLowerCase().includes(term) ||
                item.sourceSymbols.some(s => s.toLowerCase().includes(term))
            );
        }

        // Sort
        result.sort((a, b) => {
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

        return result;
    }, [enhancedEarnings, earningsSearchTerm, earningsSortKey, earningsSortOrder]);

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
                <>
                    <EarningsHero
                        totalEarningsUSD={totalEarningsUSD}
                        totalEarningsByToken={totalEarningsByToken}
                        showDetail={showDetail}
                        onToggleDetail={() => setShowDetail(!showDetail)}
                        locale={locale}
                    />

                    <EarningsTable
                        earnings={filteredEarnings}
                        sortKey={earningsSortKey}
                        sortOrder={earningsSortOrder}
                        onSort={handleEarningsSort}
                        expandedSources={expandedSources}
                        onToggleExpansion={toggleSourceExpansion}
                        locale={locale}
                    />
                </>
            )}
        </div>
    );
};
