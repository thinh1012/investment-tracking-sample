import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Wallet, ArrowUp, ArrowDown, RefreshCw, ChevronRight, TrendingUp, TrendingDown, Layers, Pencil } from 'lucide-react';
import { Asset } from '../../types';

interface AssetsTableProps {
    assets: Asset[];
    prices: Record<string, number>;
    onRefreshPrices?: (force?: boolean) => Promise<void>;
    onUpdateAssetOverride?: (symbol: string, overrides: { avgBuyPrice?: number }) => void;
    locale?: string;
}

export const AssetsTable: React.FC<AssetsTableProps> = ({ assets, prices, onRefreshPrices, onUpdateAssetOverride, locale }) => {
    const [isTokenListOpen, setIsTokenListOpen] = useState(false); // Default closed
    const [assetSortKey, setAssetSortKey] = useState<string>('currentValue');
    const [assetSortOrder, setAssetSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

    const tokenAssets = assets.filter(a => !a.lpRange && !a.symbol.toUpperCase().startsWith('LP') && !a.symbol.includes('/') && !a.symbol.includes('-') && !a.symbol.toUpperCase().includes('POOL'));

    const processedAssets = tokenAssets.map(asset => {
        const currentPrice = (prices && prices[asset.symbol]) || 0;
        const currentValue = asset.quantity * currentPrice;
        const pnlValue = currentValue - asset.totalInvested;
        const pnlPercent = asset.totalInvested > 0 ? (pnlValue / asset.totalInvested) * 100 : 0;
        return { ...asset, currentPrice, currentValue, pnlValue, pnlPercent };
    });

    const sortedTokenAssets = [...processedAssets].sort((a, b) => {
        const order = assetSortOrder === 'asc' ? 1 : -1;
        if (assetSortKey === 'symbol') return a.symbol.localeCompare(b.symbol) * order;
        // Default number sort
        const valA = (a as any)[assetSortKey] || 0;
        const valB = (b as any)[assetSortKey] || 0;
        return (valA - valB) * order;
    });

    const handleAssetSort = (key: string) => {
        if (assetSortKey === key) {
            setAssetSortOrder(assetSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setAssetSortKey(key);
            setAssetSortOrder('desc');
        }
    };

    const toggleSourceExpansion = (source: string) => {
        const newExpanded = new Set(expandedSources);
        if (newExpanded.has(source)) {
            newExpanded.delete(source);
        } else {
            newExpanded.add(source);
        }
        setExpandedSources(newExpanded);
    };

    return (
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div
                className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsTokenListOpen(!isTokenListOpen)}
            >
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                    <Wallet className="text-emerald-500" size={20} />
                    Tokens & Assets
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (onRefreshPrices) {
                                const btn = document.getElementById('refresh-tokens-btn');
                                if (btn) btn.classList.add('animate-spin');
                                await onRefreshPrices(true);
                                setTimeout(() => {
                                    if (btn) btn.classList.remove('animate-spin');
                                }, 1000);
                            }
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-slate-800 rounded-md ml-2"
                        title="Refresh Prices"
                    >
                        <RefreshCw id="refresh-tokens-btn" size={14} />
                    </button>
                </h2>
                {isTokenListOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </div>
            {isTokenListOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-tl-lg" onClick={() => handleAssetSort('symbol')}>
                                    <div className="flex items-center gap-1">
                                        Asset {assetSortKey === 'symbol' && (assetSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Avg Buy Price</th>
                                <th className="px-6 py-4">Current Price</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleAssetSort('totalInvested')}>
                                    <div className="flex items-center gap-1">
                                        Total Invested {assetSortKey === 'totalInvested' && (assetSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleAssetSort('currentValue')}>
                                    <div className="flex items-center gap-1">
                                        Current Value {assetSortKey === 'currentValue' && (assetSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-tr-lg" onClick={() => handleAssetSort('pnlValue')}>
                                    <div className="flex items-center gap-1">
                                        PnL {assetSortKey === 'pnlValue' && (assetSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedTokenAssets.map((asset) => {
                                const { currentPrice, currentValue, pnlValue, pnlPercent } = asset;

                                return (
                                    <React.Fragment key={asset.symbol}>
                                        <tr
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                            onClick={() => toggleSourceExpansion(asset.symbol)}
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                {expandedSources.has(asset.symbol) ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                {asset.symbol}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{asset.quantity.toLocaleString(locale || 'en-US')}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 group relative">
                                                <div className="flex items-center gap-2">
                                                    <span>${asset.averageBuyPrice.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newPrice = window.prompt(`Enter manual Average Buy Price for ${asset.symbol}:`, asset.averageBuyPrice.toString());
                                                            if (newPrice && !isNaN(parseFloat(newPrice)) && onUpdateAssetOverride) {
                                                                onUpdateAssetOverride(asset.symbol, { avgBuyPrice: parseFloat(newPrice) });
                                                            }
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                                                        title="Edit Average Buy Price"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                ${currentPrice.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">${asset.totalInvested.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">${currentValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4">
                                                <div className={`flex flex-col ${pnlValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} `}>
                                                    <span className="font-bold">
                                                        {pnlValue >= 0 ? '+' : ''}${pnlValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-xs font-medium">
                                                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedSources.has(asset.symbol) && (
                                            <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                                <td colSpan={7} className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                                                                <TrendingUp size={14} /> Rewards Earned
                                                            </h4>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-slate-500 dark:text-slate-400">Quantity:</span>
                                                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                                                    {asset.earnedQuantity ? asset.earnedQuantity.toLocaleString(locale || 'en-US') : '0'} {asset.symbol}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-1">
                                                                <span className="text-slate-500 dark:text-slate-400">Value (Current):</span>
                                                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                                    ${((asset.earnedQuantity || 0) * currentPrice).toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-2">
                                                                <Layers size={14} /> Allocated to LPs (Initial)
                                                            </h4>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-slate-500 dark:text-slate-400">Contributed:</span>
                                                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                                                    {asset.lockedInLpQuantity ? asset.lockedInLpQuantity.toLocaleString(locale || 'en-US') : '0'} {asset.symbol}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-2">
                                                                * Tracks assets moved from Holdings to funding LPs. Does not include fresh capital LP investments.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {tokenAssets.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No tokens or regular assets found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
