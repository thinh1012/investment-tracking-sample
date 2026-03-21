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
    onCompound?: (tx: Transaction) => void;
}

export const EarningsHistory: React.FC<EarningsHistoryProps> = ({ assets, transactions, prices, locale, defaultOpen = false, onCompound }) => {
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
        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-8">
            <div
                className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 flex justify-between items-center"
                onClick={() => setIsEarningsHistoryOpen(!isEarningsHistoryOpen)}
            >
                <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Earnings History</h2>
                <div className="flex items-center gap-3">
                    {isEarningsHistoryOpen && (
                        <div className="relative" onClick={e => e.stopPropagation()}>
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={earningsSearchTerm}
                                onChange={(e) => setEarningsSearchTerm(e.target.value)}
                                placeholder="Search..."
                                className="block w-36 rounded-lg border border-slate-200 dark:border-slate-700 py-1 pl-8 pr-3 text-xs bg-transparent text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    )}
                    <ChevronDown className={`text-slate-400 ${isEarningsHistoryOpen ? 'rotate-180' : ''}`} size={16} />
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
                        onCompound={onCompound}
                        locale={locale}
                    />
                </>
            )}
        </div>
    );
};
