import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, ArrowUp, ArrowDown, Plus, Check, X, Pencil } from 'lucide-react';
import { Asset, Transaction } from '../../types';

interface LiquidityPoolsTableProps {
    assets: Asset[];
    transactions: Transaction[];
    onAddCapital?: (symbol: string) => void;
    updateAssetPrice?: (symbol: string, price: number) => void;
    locale?: string;
}

export const LiquidityPoolsTable: React.FC<LiquidityPoolsTableProps> = ({ assets, transactions, onAddCapital, updateAssetPrice, locale }) => {
    const [isAssetListOpen, setIsAssetListOpen] = useState(false);
    const [lpSortKey, setLpSortKey] = useState<string>('currentValue');
    const [lpSortOrder, setLpSortOrder] = useState<'asc' | 'desc'>('desc');
    const [editingLpSymbol, setEditingLpSymbol] = useState<string | null>(null);
    const [newLpValue, setNewLpValue] = useState<string>('');

    const lpAssets = assets.filter(a => a.lpRange || a.symbol.toUpperCase().startsWith('LP') || a.symbol.includes('/') || a.symbol.includes('-') || a.symbol.toUpperCase().includes('POOL'));

    const handleLpSort = (key: string) => {
        if (lpSortKey === key) {
            setLpSortOrder(lpSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setLpSortKey(key);
            setLpSortOrder('desc');
        }
    };

    return (
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div
                className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsAssetListOpen(!isAssetListOpen)}
            >
                <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                    <Layers className="text-indigo-500" size={20} />
                    Liquidity Pools
                </h2>
                {isAssetListOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </div>
            {isAssetListOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider font-semibold">
                            <tr>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-tl-lg"
                                    onClick={() => handleLpSort('symbol')}
                                >
                                    <div className="flex items-center gap-1">
                                        LP Name {lpSortKey === 'symbol' && (lpSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4">Rewards</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    onClick={() => handleLpSort('rangeStatus')}
                                >
                                    <div className="flex items-center gap-1">
                                        Range Status {lpSortKey === 'rangeStatus' && (lpSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    onClick={() => handleLpSort('totalInvested')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Investment Details {lpSortKey === 'totalInvested' && (lpSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-tr-lg"
                                    onClick={() => handleLpSort('currentValue')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Current Value {lpSortKey === 'currentValue' && (lpSortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {lpAssets
                                .sort((a, b) => {
                                    const order = lpSortOrder === 'asc' ? 1 : -1;

                                    if (lpSortKey === 'symbol') {
                                        return a.symbol.localeCompare(b.symbol) * order;
                                    }
                                    if (lpSortKey === 'rangeStatus') {
                                        const statA = a.inRange ? 2 : (a.lpRange ? 1 : 0);
                                        const statB = b.inRange ? 2 : (b.lpRange ? 1 : 0);
                                        return (statA - statB) * order;
                                    }
                                    if (lpSortKey === 'totalInvested') {
                                        return (a.totalInvested - b.totalInvested) * order;
                                    }
                                    // Default: Current Value
                                    const valA = a.currentValue || 0;
                                    const valB = b.currentValue || 0;
                                    return (valA - valB) * order;
                                })
                                .map((asset) => {
                                    const depositTx = transactions.find(t => t.type === 'DEPOSIT' && t.assetSymbol === asset.symbol);
                                    const fundedFromNote = depositTx?.notes?.match(/Funded from: ([^.]+)/)?.[1];

                                    return (
                                        <tr key={asset.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{asset.symbol}</div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddCapital && onAddCapital(asset.symbol);
                                                        }}
                                                        className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
                                                        title="Add Additional Capital"
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                                {fundedFromNote && (
                                                    <div className="text-[10px] text-slate-400 font-normal mt-1 max-w-[200px] leading-tight" title={fundedFromNote}>
                                                        Source: {fundedFromNote}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const rewards = transactions.filter(t => t.type === 'INTEREST' && t.relatedAssetSymbol === asset.symbol);
                                                    const rewardTotals = rewards.reduce((acc, t) => {
                                                        acc[t.assetSymbol] = (acc[t.assetSymbol] || 0) + t.amount;
                                                        return acc;
                                                    }, {} as Record<string, number>);
                                                    const rewardSymbols = Object.keys(rewardTotals);

                                                    if (rewardSymbols.length === 0) return <span className="text-slate-400 text-xs">-</span>;

                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            {rewardSymbols.map(sym => (
                                                                <div key={sym} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                                    {rewardTotals[sym].toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })} <span className="text-slate-400 text-[10px]">{sym}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{asset.quantity.toLocaleString(locale || 'en-US')}</td>
                                            <td className="px-6 py-4">
                                                {asset.lpRange ? (
                                                    <div className="flex flex-col gap-1">
                                                        {asset.monitorSymbol ? (
                                                            <>
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${asset.inRange
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                                    } `}>
                                                                    {asset.inRange ? '🟢 In Range' : '🔴 Out of Range'}
                                                                </span>
                                                                <span className="text-xs text-slate-500 font-medium">
                                                                    {asset.monitorSymbol}: {asset.monitorSymbol.includes('/') ? '' : '$'}
                                                                    {asset.monitorPrice?.toLocaleString(locale || 'en-US', { maximumFractionDigits: asset.monitorSymbol.includes('/') ? 6 : 2 })}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                                Unmonitored
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-slate-400">
                                                            Range: {asset.lpRange.min.toLocaleString(locale || 'en-US', { maximumFractionDigits: 6 })} - {asset.lpRange.max.toLocaleString(locale || 'en-US', { maximumFractionDigits: 6 })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">No Range Set</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Invested</span>
                                                    <span>${asset.totalInvested.toLocaleString(locale || 'en-US', { maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Current Value</span>
                                                    {editingLpSymbol === asset.symbol ? (
                                                        <div className="flex items-center justify-end gap-2 mt-1">
                                                            <input
                                                                type="number"
                                                                value={newLpValue}
                                                                onChange={(e) => setNewLpValue(e.target.value)}
                                                                className="w-24 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                                autoFocus
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (updateAssetPrice && newLpValue) {
                                                                        const val = parseFloat(newLpValue);
                                                                        if (!isNaN(val) && asset.quantity > 0) {
                                                                            updateAssetPrice(asset.symbol, val / asset.quantity);
                                                                        }
                                                                    }
                                                                    setEditingLpSymbol(null);
                                                                    setNewLpValue('');
                                                                }}
                                                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingLpSymbol(null);
                                                                    setNewLpValue('');
                                                                }}
                                                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="group flex items-center justify-end gap-2">
                                                            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                                                ${(asset.currentValue || asset.totalInvested).toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                                            </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingLpSymbol(asset.symbol);
                                                                    setNewLpValue((asset.currentValue || asset.totalInvested).toString());
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                                                                title="Edit Value"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {asset.unrealizedPnL !== 0 && (
                                                        <div className={`text-xs font-medium mt-1 ${asset.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {asset.unrealizedPnL >= 0 ? '+' : ''}{asset.unrealizedPnL.toLocaleString(locale || 'en-US')} ({asset.pnlPercentage.toFixed(1)}%)
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {lpAssets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No Liquidity Pools found. Add a transaction with "LP-" prefix or defined range.
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
