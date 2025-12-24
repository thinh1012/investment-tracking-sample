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
        <div className="lg:col-span-3 glass-card overflow-hidden animate-slide-up animate-stagger-2 group/lp">
            <div
                className="p-4 md:p-8 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-500"
                onClick={() => setIsAssetListOpen(!isAssetListOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 rounded-2xl group-hover/lp:scale-110 transition-transform duration-500">
                        <Layers className="text-indigo-500" size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-xl font-heading tracking-tight">Liquidity Pools</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Yield & Concentration Monitoring</p>
                    </div>
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isAssetListOpen ? 'bg-slate-100 dark:bg-slate-800 rotate-180' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    <ChevronDown className="text-slate-400" size={20} />
                </div>
            </div>
            {isAssetListOpen && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-500 uppercase text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] font-black font-heading">
                            <tr>
                                <th
                                    className="px-4 py-3 md:px-8 md:py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    onClick={() => handleLpSort('symbol')}
                                >
                                    <div className="flex items-center gap-2">
                                        LP Position {lpSortKey === 'symbol' && (lpSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                                    </div>
                                </th>
                                <th className="hidden md:table-cell px-6 py-5 whitespace-nowrap">Tokens Earned</th>
                                <th
                                    className="hidden lg:table-cell px-6 py-5 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    onClick={() => handleLpSort('rangeStatus')}
                                >
                                    <div className="flex items-center gap-2">
                                        Range Health {lpSortKey === 'rangeStatus' && (lpSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                                    </div>
                                </th>
                                <th
                                    className="hidden md:table-cell px-6 py-5 text-right cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    onClick={() => handleLpSort('totalInvested')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Principal {lpSortKey === 'totalInvested' && (lpSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 md:px-8 md:py-5 text-right cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                    onClick={() => handleLpSort('currentValue')}
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Value {lpSortKey === 'currentValue' && (lpSortOrder === 'asc' ? <ArrowUp size={12} className="text-indigo-500" /> : <ArrowDown size={12} className="text-indigo-500" />)}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
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
                                .map((asset, idx) => {
                                    const depositTx = transactions.find(t => t.type === 'DEPOSIT' && t.assetSymbol === asset.symbol);
                                    const fundedFromNote = depositTx?.notes?.match(/Funded from: ([^.]+)/)?.[1];

                                    return (
                                        <tr key={asset.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 group/row">
                                            <td className="px-4 py-3 md:px-8 md:py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight">{asset.symbol}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAddCapital && onAddCapital(asset.symbol);
                                                                }}
                                                                className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all scale-100 md:scale-0 group-hover/row:scale-100"
                                                                title="Add Additional Capital"
                                                            >
                                                                <Plus size={12} strokeWidth={3} />
                                                            </button>
                                                        </div>
                                                        {fundedFromNote && (
                                                            <div className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]" title={fundedFromNote}>
                                                                via {fundedFromNote}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-6">
                                                {(() => {
                                                    const rewards = transactions.filter(t => {
                                                        if (t.type !== 'INTEREST') return false;
                                                        const isMatch = t.relatedAssetSymbol === asset.symbol ||
                                                            (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(asset.symbol));
                                                        return isMatch;
                                                    });
                                                    const rewardTotals = rewards.reduce((acc, t) => {
                                                        const sym = t.assetSymbol.trim().toUpperCase();
                                                        acc[sym] = (acc[sym] || 0) + t.amount;
                                                        return acc;
                                                    }, {} as Record<string, number>);
                                                    const rewardSymbols = Object.keys(rewardTotals).sort();

                                                    if (rewardSymbols.length === 0) return <span className="text-slate-300 dark:text-slate-700 font-black">-</span>;

                                                    return (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            {rewardSymbols.map(sym => (
                                                                <div key={sym} className="px-2 py-0.5 rounded-md bg-indigo-500/5 border border-indigo-500/10 text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono tracking-tighter whitespace-nowrap">
                                                                    {rewardTotals[sym].toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })} <span className="text-indigo-400 opacity-70 ml-0.5">{sym}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-6">
                                                {asset.lpRange ? (
                                                    <div className="flex flex-col gap-2">
                                                        {asset.monitorSymbol ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg ${asset.inRange
                                                                    ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                                                                    : 'bg-rose-500/10 text-rose-500 shadow-rose-500/10 ring-1 ring-rose-500/20'
                                                                    } `}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${asset.inRange ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                    {asset.inRange ? 'In Range' : 'Out of Range'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500 italic">
                                                                Static Range
                                                            </span>
                                                        )}
                                                        <div className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/30 w-fit">
                                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5 opacity-50">Concentration</p>
                                                            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-bold leading-none">
                                                                {asset.lpRange.min.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })} - {asset.lpRange.max.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest italic">Full Range</span>
                                                )}
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-6 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="font-bold font-mono text-slate-800 dark:text-slate-200">${asset.totalInvested.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none opacity-60">Principal</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 md:px-8 md:py-6 text-right">
                                                <div className="flex flex-col items-end group/edit relative">
                                                    {editingLpSymbol === asset.symbol ? (
                                                        <div className="flex items-center justify-end gap-1 mb-2">
                                                            <input
                                                                type="number"
                                                                value={newLpValue}
                                                                onChange={(e) => setNewLpValue(e.target.value)}
                                                                className="w-24 px-2 py-1 text-sm border-0 rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-500 font-black focus:ring-2 ring-indigo-500/20 outline-none"
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
                                                                className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black font-heading text-slate-900 dark:text-white text-base md:text-xl tracking-tighter">
                                                                    ${(asset.currentValue || asset.totalInvested).toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingLpSymbol(asset.symbol);
                                                                        setNewLpValue((asset.currentValue || asset.totalInvested).toString());
                                                                    }}
                                                                    className="opacity-100 md:opacity-0 group-hover/row:opacity-100 p-1 text-slate-300 hover:text-indigo-500 transition-all bg-slate-100 dark:bg-slate-800 rounded-lg"
                                                                    title="Edit Value"
                                                                >
                                                                    <Pencil size={12} />
                                                                </button>
                                                            </div>
                                                            {asset.unrealizedPnL !== 0 && (
                                                                <div className={`text-[9px] md:text-[10px] font-black tracking-widest px-2 py-0.5 rounded-lg mt-1 ${asset.unrealizedPnL >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                    {asset.unrealizedPnL >= 0 ? '▲' : '▼'} {Math.abs(asset.pnlPercentage).toFixed(1)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            {lpAssets.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <Layers size={48} className="text-slate-200 dark:text-slate-800" />
                                            <p className="text-slate-400 dark:text-slate-500 font-black font-heading tracking-widest uppercase text-xs">No active pool positions</p>
                                        </div>
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
