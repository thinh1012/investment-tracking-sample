import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Wallet, ArrowUp, ArrowDown, RefreshCw, ChevronRight, TrendingUp, TrendingDown, Layers, Pencil } from 'lucide-react';
import { Asset } from '../../types';

interface AssetsTableProps {
    assets: Asset[];
    transactions: import('../../types').Transaction[];
    prices: Record<string, number>;
    onRefreshPrices?: (force?: boolean) => Promise<void>;
    onUpdateAssetOverride?: (symbol: string, overrides: { avgBuyPrice?: number }) => void;
    locale?: string;
}

import { TableShell } from '../common/TableShell';

export const AssetsTable: React.FC<AssetsTableProps> = ({ assets, transactions, prices, onRefreshPrices, onUpdateAssetOverride, locale }) => {
    const [isTokenListOpen, setIsTokenListOpen] = useState(false); // Default closed
    const [assetSortKey, setAssetSortKey] = useState<string>('currentValue');
    const [assetSortOrder, setAssetSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

    const tokenAssets = assets.filter(a => !a.lpRange && !a.symbol.toUpperCase().startsWith('LP') && !a.symbol.includes('/') && !a.symbol.includes('-') && !a.symbol.toUpperCase().includes('POOL'));

    const processedAssets = tokenAssets.map(asset => {
        const currentPrice = (prices && prices[asset.symbol]) || 0;
        const currentValue = asset.quantity * currentPrice;
        const pnlValue = currentValue - asset.totalInvested;
        const pnlPercent = asset.totalInvested >= 0.01 ? (pnlValue / asset.totalInvested) * 100 : 0;
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
        <TableShell
            title="Tokens & Assets"
            subtitle="Spot Balance & Performance"
            icon={<Wallet />}
            iconColor="emerald"
            isOpen={isTokenListOpen}
            onToggle={() => setIsTokenListOpen(!isTokenListOpen)}
            extraHeaderActions={(
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
                    className="p-1.5 text-slate-400 hover:text-indigo-500 transition-all bg-slate-100 dark:bg-slate-800/50 rounded-xl"
                    title="Refresh Prices"
                >
                    <RefreshCw id="refresh-tokens-btn" size={16} />
                </button>
            )}
            className="lg:col-span-3"
        >
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 uppercase text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] font-black font-heading">
                    <tr>
                        <th className="px-4 py-3 md:px-8 md:py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors" onClick={() => handleAssetSort('symbol')}>
                            <div className="flex items-center gap-2">
                                Asset {assetSortKey === 'symbol' && (assetSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                            </div>
                        </th>

                        <th className="hidden md:table-cell px-6 py-5">Avg Buy Price</th>
                        <th className="px-3 py-3 md:px-6 md:py-5">Price</th>
                        <th className="hidden lg:table-cell px-6 py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right" onClick={() => handleAssetSort('totalInvested')}>
                            <div className="flex items-center justify-end gap-2">
                                Invested {assetSortKey === 'totalInvested' && (assetSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                            </div>
                        </th>
                        <th className="px-4 py-3 md:px-6 md:py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right" onClick={() => handleAssetSort('currentValue')}>
                            <div className="flex items-center justify-end gap-2">
                                Value {assetSortKey === 'currentValue' && (assetSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                            </div>
                        </th>
                        <th className="px-4 py-3 md:px-8 md:py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-right" onClick={() => handleAssetSort('pnlValue')}>
                            <div className="flex items-center justify-end gap-2">
                                PnL {assetSortKey === 'pnlValue' && (assetSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {sortedTokenAssets.map((asset, idx) => {
                        const { currentPrice, currentValue, pnlValue, pnlPercent } = asset;
                        const isPositive = pnlValue >= 0;

                        return (
                            <React.Fragment key={asset.symbol}>
                                <tr
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 cursor-pointer group/row"
                                    onClick={() => toggleSourceExpansion(asset.symbol)}
                                >
                                    <td className="px-4 py-3 md:px-8 md:py-5 font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 md:gap-4">
                                        <div className={`p-1 rounded-lg transition-all duration-300 ${expandedSources.has(asset.symbol) ? 'bg-indigo-500/10 text-indigo-500 rotate-0' : 'text-slate-300 -rotate-90'}`}>
                                            <ChevronDown size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm md:text-base tracking-tight">{asset.symbol}</span>
                                            <span className="hidden md:inline text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Token</span>
                                        </div>
                                    </td>

                                    <td className="hidden md:table-cell px-6 py-5 text-slate-500 dark:text-slate-400 group relative">
                                        <div className="flex items-center gap-2 font-mono font-medium">
                                            <span>${asset.averageBuyPrice.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newPrice = window.prompt(`Enter manual Average Buy Price for ${asset.symbol}:`, asset.averageBuyPrice.toString());
                                                    if (newPrice && !isNaN(parseFloat(newPrice)) && onUpdateAssetOverride) {
                                                        onUpdateAssetOverride(asset.symbol, { avgBuyPrice: parseFloat(newPrice) });
                                                    }
                                                }}
                                                className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-300 hover:text-indigo-500 transition-all bg-slate-100 dark:bg-slate-800 rounded-lg"
                                            >
                                                <Pencil size={12} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 md:px-6 md:py-5 text-slate-500 dark:text-slate-400 font-mono font-medium text-xs md:text-sm">
                                        ${currentPrice < 1 ? currentPrice.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 }) : currentPrice.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="hidden lg:table-cell px-6 py-5 font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight text-right">${asset.totalInvested.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 md:px-6 md:py-5 font-black text-slate-900 dark:text-white font-mono tracking-tight text-right text-sm md:text-base">${currentValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</td>
                                    <td className="px-4 py-3 md:px-8 md:py-5 text-right">
                                        <div className={`p-1.5 md:p-3 rounded-xl flex flex-col items-end transition-all duration-300 group-hover/row:translate-x-1 shadow-sm ${isPositive ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/10' : 'bg-rose-500/5 text-rose-500 border border-rose-500/10'} `}>
                                            <span className="font-black font-mono text-xs md:text-sm leading-none">
                                                {isPositive ? '+' : ''}{pnlValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                            </span>
                                            <span className="text-[9px] md:text-[10px] font-black tracking-widest mt-0.5 md:mt-1 opacity-70">
                                                {isPositive ? '▲' : '▼'} {Math.abs(pnlPercent).toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                                {expandedSources.has(asset.symbol) && (
                                    <tr className="bg-slate-50/20 dark:bg-slate-900/40 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <td colSpan={7} className="px-4 py-6 md:px-8">
                                            <div className="flex flex-col gap-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                                    <div className="glass border border-indigo-500/10 p-5 rounded-2xl shadow-xl shadow-indigo-500/5">
                                                        <h4 className="font-black text-indigo-500 dark:text-indigo-300 mb-4 flex items-center gap-3 font-heading uppercase tracking-widest text-xs">
                                                            <TrendingUp size={16} /> Rewards Portfolio
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-400 font-bold">Quantity:</span>
                                                                <span className="font-black text-slate-700 dark:text-slate-200">
                                                                    {asset.earnedQuantity ? asset.earnedQuantity.toLocaleString(locale || 'en-US') : '0'} {asset.symbol}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-400 font-bold">Market Value:</span>
                                                                <span className="font-black text-emerald-500 dark:text-emerald-400 italic">
                                                                    ${((asset.earnedQuantity || 0) * currentPrice).toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="glass border border-emerald-500/10 p-5 rounded-2xl shadow-xl shadow-emerald-500/5">
                                                        <h4 className="font-black text-emerald-500 dark:text-emerald-300 mb-4 flex items-center gap-3 font-heading uppercase tracking-widest text-xs">
                                                            <Layers size={16} /> Asset Allocation
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-slate-400 font-bold">In Liquidity Pools:</span>
                                                                <span className="font-black text-slate-700 dark:text-slate-200">
                                                                    {asset.lockedInLpQuantity ? asset.lockedInLpQuantity.toLocaleString(locale || 'en-US') : '0'} {asset.symbol}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-300 dark:text-slate-600 italic font-medium leading-relaxed mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                                                * Tracks assets moved from Holdings to fund LPs. Does not include fresh capital buys.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Audit Trail Section */}
                                                <div className="glass border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-lg">
                                                    <h4 className="font-black text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-3 font-heading uppercase tracking-widest text-xs">
                                                        <Wallet size={16} /> Transaction Audit: {asset.symbol}
                                                    </h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-[10px] md:text-xs">
                                                            <thead className="text-slate-400 uppercase font-black tracking-widest">
                                                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                                                    <th className="py-2 text-left">Date</th>
                                                                    <th className="py-2 text-left">Type</th>
                                                                    <th className="py-2 text-right">Price</th>
                                                                    <th className="py-2 text-right">Running Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/30">
                                                                {(() => {
                                                                    let runningQty = 0;
                                                                    return transactions
                                                                        .filter(t =>
                                                                            t.assetSymbol.toUpperCase() === asset.symbol.toUpperCase() ||
                                                                            (t.paymentCurrency && t.paymentCurrency.toUpperCase() === asset.symbol.toUpperCase())
                                                                        )
                                                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                                        .map((t, tIdx) => {
                                                                            const isSource = t.assetSymbol.toUpperCase() === asset.symbol.toUpperCase();
                                                                            let amountChange = 0;
                                                                            let typeLabel: string = t.type;
                                                                            let priceLabel = t.pricePerUnit ? `$${t.pricePerUnit.toLocaleString()}` : '-';

                                                                            if (isSource) {
                                                                                // Standard Deposit/Withdrawal/Interest
                                                                                if (t.type === 'DEPOSIT' || t.type === 'INTEREST') amountChange = Number(t.amount);
                                                                                else if (t.type === 'WITHDRAWAL') amountChange = -Number(t.amount);
                                                                            } else {
                                                                                // This asset was used as Payment (Spent)
                                                                                amountChange = -Number(t.paymentAmount || 0);
                                                                                typeLabel = `BOUGHT ${t.assetSymbol}`; // e.g., "BOUGHT ETH"
                                                                                priceLabel = '-'; // Price irrelevant here, or could show implied price
                                                                            }

                                                                            if (isNaN(amountChange)) amountChange = 0; // Safety net
                                                                            runningQty += amountChange;

                                                                            return (
                                                                                <tr key={t.id || tIdx} className="text-slate-600 dark:text-slate-400">
                                                                                    <td className="py-2">{new Date(t.date).toLocaleDateString()}</td>
                                                                                    <td className="py-2 font-black">
                                                                                        <span className={
                                                                                            t.type === 'DEPOSIT' ? 'text-emerald-500' :
                                                                                                t.type === 'WITHDRAWAL' ? 'text-rose-500' :
                                                                                                    !isSource ? 'text-amber-500' : // Spent color
                                                                                                        'text-indigo-500'
                                                                                        }>
                                                                                            {typeLabel}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="py-2 text-right font-mono">
                                                                                        {priceLabel}
                                                                                    </td>
                                                                                    <td className="py-2 text-right font-mono font-black text-slate-800 dark:text-slate-200">
                                                                                        {runningQty.toLocaleString()}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        }).reverse(); // Show newest first for audit
                                                                })()}
                                                            </tbody>
                                                        </table>
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
                            <td colSpan={7} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                    <Wallet size={48} className="text-slate-200 dark:text-slate-800" />
                                    <p className="text-slate-400 dark:text-slate-500 font-black font-heading tracking-widest uppercase text-xs">No active assets detected</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </TableShell>
    );
};
