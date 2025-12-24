import React, { useState } from 'react';
import { Plus, X, Activity, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMarketPicks } from '../../hooks/useMarketPicks';
import { AddPickForm } from './market-picks/AddPickForm';
import { MarketPickRow } from './market-picks/MarketPickRow';

interface Props {
    prices: Record<string, number>;
    priceChanges?: Record<string, number | null>;
    priceVolumes?: Record<string, number | null>;
    locale?: string;
    onSimulate?: (symbol: string, price: number) => void;
}

type SortKey = 'symbol' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc';

export const MarketPicks: React.FC<Props> = ({ prices, priceChanges = {}, priceVolumes = {}, locale, onSimulate }) => {
    const { picks, addPick, removePick, historicalData, saveManualOpen } = useMarketPicks();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingOpenSymbol, setEditingOpenSymbol] = useState<string | null>(null);

    // Sort State
    const [sortKey, setSortKey] = useState<SortKey>('price');
    const [sortDir, setSortDir] = useState<SortDirection>('desc');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            await addPick(searchTerm);
            setSearchTerm('');
            setIsAdding(false);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const sortedPicks = [...picks].sort((a, b) => {
        const symA = a.symbol;
        const symB = b.symbol;

        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortKey) {
            case 'symbol':
                valA = symA;
                valB = symB;
                break;
            case 'price':
                valA = prices[symA] || 0;
                valB = prices[symB] || 0;
                break;
            case 'change':
                valA = priceChanges[symA] ?? -Infinity;
                valB = priceChanges[symB] ?? -Infinity;
                break;
            case 'volume':
                valA = priceVolumes[symA] ?? -Infinity;
                valB = priceVolumes[symB] ?? -Infinity;
                break;
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortKey !== column) return <ArrowUpDown size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortDir === 'asc' ? <ArrowUp size={10} className="text-purple-500" /> : <ArrowDown size={10} className="text-purple-500" />;
    };

    const HeaderRow = () => (
        <div className="flex items-center justify-between px-3 py-2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider bg-slate-50/50 dark:bg-slate-800/30 rounded-lg mb-1 gap-2">
            <span
                className="w-[160px] min-w-[160px] cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 group transition-colors"
                onClick={() => handleSort('symbol')}
            >
                Asset <SortIcon column="symbol" />
            </span>
            <div className="flex-1 flex items-center justify-end gap-6 text-right">
                <span className="w-24 flex items-center justify-end">Open</span>
                <span
                    className="w-24 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-end gap-1 group transition-colors"
                    onClick={() => handleSort('price')}
                >
                    <SortIcon column="price" />
                    <span>Current</span>
                </span>
                <span
                    className="w-20 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-end gap-1 group transition-colors"
                    onClick={() => handleSort('change')}
                >
                    <SortIcon column="change" />
                    <span>24h %</span>
                </span>
                <span
                    className="w-20 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-end gap-1 group transition-colors"
                    onClick={() => handleSort('volume')}
                >
                    <SortIcon column="volume" />
                    <span>Vol</span>
                </span>
                <span className="w-10"></span>
                <span className="w-6"></span>
            </div>
        </div>
    );

    const assets = sortedPicks.filter(p => !p.symbol.endsWith('.D'));
    const indicators = sortedPicks.filter(p => p.symbol.endsWith('.D'));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Activity size={18} className="text-purple-500" />
                    Market Picks
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
                >
                    {isAdding ? <X size={16} /> : <Plus size={16} />}
                </button>
            </div>

            {isAdding && (
                <AddPickForm
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onSubmit={handleAdd}
                />
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {picks.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs text-center px-4">
                        <p>No market picks yet.</p>
                        <button onClick={() => setIsAdding(true)} className="text-purple-500 hover:underline mt-1">
                            Add a coin
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {assets.length > 0 && (
                            <div className="mb-6">
                                <div className="px-3 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    Assets
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                </div>
                                <HeaderRow />
                                <div className="space-y-1">
                                    {assets.map(pick => (
                                        <MarketPickRow
                                            key={pick.symbol}
                                            pick={pick}
                                            price={prices[pick.symbol]}
                                            change={priceChanges[pick.symbol]}
                                            volume={priceVolumes[pick.symbol]}
                                            openPrice={historicalData[pick.symbol]}
                                            locale={locale}
                                            editingOpen={editingOpenSymbol === pick.symbol}
                                            onEditOpen={() => setEditingOpenSymbol(pick.symbol)}
                                            onSaveOpen={(val) => saveManualOpen(pick.symbol, val)}
                                            onCancelEdit={() => setEditingOpenSymbol(null)}
                                            onRemove={() => removePick(pick.symbol)}
                                            onSimulate={onSimulate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {indicators.length > 0 && (
                            <div className="mb-2">
                                <div className="px-3 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    Market Indicators
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                </div>
                                <HeaderRow />
                                <div className="space-y-1">
                                    {indicators.map(pick => (
                                        <MarketPickRow
                                            key={pick.symbol}
                                            pick={pick}
                                            price={prices[pick.symbol]}
                                            change={priceChanges[pick.symbol]}
                                            volume={priceVolumes[pick.symbol]}
                                            openPrice={historicalData[pick.symbol]}
                                            locale={locale}
                                            editingOpen={editingOpenSymbol === pick.symbol}
                                            onEditOpen={() => setEditingOpenSymbol(pick.symbol)}
                                            onSaveOpen={(val) => saveManualOpen(pick.symbol, val)}
                                            onCancelEdit={() => setEditingOpenSymbol(null)}
                                            onRemove={() => removePick(pick.symbol)}
                                            onSimulate={onSimulate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
