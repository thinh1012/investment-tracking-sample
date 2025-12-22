import React, { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Search, ArrowRight, Activity, ArrowUpDown, ArrowUp, ArrowDown, Calculator } from 'lucide-react';
import { useMarketPicks } from '../../hooks/useMarketPicks';
import { deriveOpenPrice } from '../../services/priceService';

interface Props {
    prices: Record<string, number>;
    priceChanges?: Record<string, number | null>;
    priceVolumes?: Record<string, number | null>;
    locale?: string;
    onSimulate?: (symbol: string, price: number) => void;
}

type SortKey = 'symbol' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc';

const formatVolume = (num: number | null | undefined, locale?: string): string => {
    if (num === null || num === undefined) return '-';
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M`;
    return `$${num.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
};

const formatPrice = (num: number | null | undefined, locale?: string, isIndicator: boolean = false): string => {
    if (num === null || num === undefined) return '---';
    if (isIndicator) return `${num.toFixed(2)}%`;

    const decimals = num < 1 ? 6 : 2;
    return `$${num.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const MarketPicks: React.FC<Props> = ({ prices, priceChanges = {}, priceVolumes = {}, locale, onSimulate }) => {
    const { picks, addPick, removePick, historicalData, saveManualOpen } = useMarketPicks();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingOpen, setEditingOpen] = useState<{ symbol: string; value: string } | null>(null);

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
                <form onSubmit={handleAdd} className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Add symbol (e.g. BTC)"
                            className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!searchTerm.trim()}
                            className="absolute right-2 top-2 p-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg disabled:opacity-50"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </form>
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
                        {/* Header Row Component */}
                        {(() => {
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
                                            <SortIcon column="price" /> Current
                                        </span>
                                        <span
                                            className="w-20 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-end gap-1 group transition-colors"
                                            onClick={() => handleSort('change')}
                                        >
                                            <SortIcon column="change" /> 24h %
                                        </span>
                                        <span
                                            className="w-20 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-end gap-1 group transition-colors"
                                            onClick={() => handleSort('volume')}
                                        >
                                            <SortIcon column="volume" /> Vol
                                        </span>
                                        <span className="w-6"></span>
                                    </div>
                                </div>
                            );

                            const renderItem = (pick: typeof sortedPicks[0]) => {
                                const price = prices[pick.symbol];
                                const change = priceChanges[pick.symbol];
                                const volume = priceVolumes[pick.symbol];
                                const openPrice = historicalData[pick.symbol];

                                return (
                                    <div key={pick.symbol} className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 gap-2">
                                        {/* Asset Info */}
                                        <div className="flex items-center gap-3 w-[160px] min-w-[160px]">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                                                {pick.symbol.substring(0, 3)}
                                            </div>
                                            <div className="truncate">
                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{pick.symbol}</div>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="flex-1 flex items-center justify-end gap-6 text-right">
                                            {/* Open Price */}
                                            <div className="w-24 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                <span className="md:hidden block text-[8px] uppercase text-slate-400">Open</span>
                                                {editingOpen?.symbol === pick.symbol ? (
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={editingOpen.value}
                                                        onChange={(e) => setEditingOpen({ ...editingOpen, value: e.target.value })}
                                                        onBlur={async () => {
                                                            const val = parseFloat(editingOpen.value);
                                                            if (!isNaN(val)) await saveManualOpen(pick.symbol, val);
                                                            setEditingOpen(null);
                                                        }}
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = parseFloat(editingOpen.value);
                                                                if (!isNaN(val)) await saveManualOpen(pick.symbol, val);
                                                                setEditingOpen(null);
                                                            }
                                                            if (e.key === 'Escape') setEditingOpen(null);
                                                        }}
                                                        className="w-full bg-white dark:bg-slate-800 border border-purple-500 rounded px-1 outline-none text-right"
                                                        autoFocus
                                                    />
                                                ) : (() => {
                                                    const displayOpen = openPrice || deriveOpenPrice(price, change);
                                                    const isEstimated = !openPrice && !!displayOpen;

                                                    return (
                                                        <span
                                                            onClick={() => setEditingOpen({ symbol: pick.symbol, value: (displayOpen || price || 0).toString() })}
                                                            className={`cursor-pointer hover:text-purple-500 transition-colors ${!displayOpen ? 'opacity-50' : ''}`}
                                                            title={isEstimated ? "Estimated from 24h change. Click to set manually." : "Daily Open. Click to override."}
                                                        >
                                                            {displayOpen ? (
                                                                <>
                                                                    {formatPrice(displayOpen, locale, pick.symbol.endsWith('.D'))}
                                                                    {isEstimated && <span className="ml-0.5 text-[8px] opacity-70">*</span>}
                                                                </>
                                                            ) : '---'}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Current Price */}
                                            <div className="w-24 font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                <span className="md:hidden block text-[8px] uppercase text-slate-400">Current</span>
                                                {formatPrice(price, locale, pick.symbol.endsWith('.D'))}
                                            </div>

                                            {/* 24h Change */}
                                            <div className="w-20 flex justify-end">
                                                {change !== undefined && change !== null ? (
                                                    <div className={`text-xs font-medium flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 2 })}%
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )}
                                            </div>

                                            {/* Volume */}
                                            <div className="w-20 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                                {formatVolume(volume, locale)}
                                            </div>

                                            {/* Simulate Button */}
                                            {onSimulate && (
                                                <div className="w-10 flex justify-end">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSimulate(pick.symbol, price);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-purple-500 transition-all hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                                                        title="Simulate LP"
                                                    >
                                                        <Calculator size={14} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="w-6 flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removePick(pick.symbol);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                                    title="Remove"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            const assets = sortedPicks.filter(p => !p.symbol.endsWith('.D'));
                            const indicators = sortedPicks.filter(p => p.symbol.endsWith('.D'));

                            return (
                                <>
                                    {/* Assets Section */}
                                    {assets.length > 0 && (
                                        <div className="mb-6">
                                            <div className="px-3 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                Assets
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                            </div>
                                            <HeaderRow />
                                            <div className="space-y-1">
                                                {assets.map(renderItem)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Indicators Section */}
                                    {indicators.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-3 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                Market Indicators
                                                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                            </div>
                                            <HeaderRow />
                                            <div className="space-y-1">
                                                {indicators.map(renderItem)}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};
