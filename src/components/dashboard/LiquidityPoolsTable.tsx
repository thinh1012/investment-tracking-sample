import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, ArrowUp, ArrowDown, Plus, Check, X, Pencil } from 'lucide-react';
import { Asset, Transaction } from '../../types';
import { formatPrice } from '../../services/PriceService';

interface LiquidityPoolsTableProps {
    assets: Asset[];
    transactions: Transaction[];
    onAddTransaction?: (asset?: Asset) => void;
    updateAssetPrice?: (symbol: string, price: number) => void;
    locale?: string;
}

import { TableShell } from '../common/TableShell';
import { useLiquidityPools } from '../../hooks/useLiquidityPools';

// Helper to get LP composition from transactions
const getLpComposition = (lpSymbol: string, transactions: Transaction[]): string | null => {
    // Find all DEPOSIT transactions for this LP
    const lpDeposits = transactions.filter(tx =>
        tx.assetSymbol.toUpperCase() === lpSymbol.toUpperCase() &&
        tx.type === 'DEPOSIT' &&
        (tx.notes?.includes('Pool Creation') || tx.notes?.includes('LP Addition'))
    );

    if (lpDeposits.length === 0) return null;

    // Aggregate token amounts from all deposits
    const tokenTotals: { [symbol: string]: number } = {};

    for (const deposit of lpDeposits) {
        const match = deposit.notes?.match(/(?:Pool Creation|LP Addition): (.+)/);
        if (match && match[1]) {
            // Parse token amounts (e.g., "249.22 HYPE + 5500.26 USDC")
            const tokens = match[1].split('+').map(t => t.trim());

            for (const token of tokens) {
                const tokenMatch = token.match(/([0-9.]+)\s+([A-Z]+)/);
                if (tokenMatch) {
                    const amount = parseFloat(tokenMatch[1]);
                    const symbol = tokenMatch[2];
                    tokenTotals[symbol] = (tokenTotals[symbol] || 0) + amount;
                }
            }
        }
    }

    // Format as "X TOKEN1 + Y TOKEN2"
    const formattedTokens = Object.entries(tokenTotals)
        .map(([symbol, amount]) => `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${symbol}`)
        .join(' + ');

    return formattedTokens || null;
};


export const LiquidityPoolsTable = React.memo(({ assets, transactions, onAddTransaction, updateAssetPrice, locale }: LiquidityPoolsTableProps) => {
    const [isAssetListOpen, setIsAssetListOpen] = useState(false);
    const [editingLpSymbol, setEditingLpSymbol] = useState<string | null>(null);
    const [newLpValue, setNewLpValue] = useState<string>('');

    const {
        lpAssets,
        lpSortKey,
        lpSortOrder,
        handleLpSort,
        getRewardsForAsset
    } = useLiquidityPools({ assets, transactions });

    return (
        <TableShell
            title="Liquidity Pools"
            subtitle=""
            icon={<Layers />}
            iconColor="indigo"
            isOpen={isAssetListOpen}
            onToggle={() => setIsAssetListOpen(!isAssetListOpen)}
            className="lg:col-span-3"
        >
            <table className="w-full text-sm text-left border-collapse">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-medium">
                    <tr>
                        <th
                            className="px-4 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                            onClick={() => handleLpSort('symbol')}
                        >
                            <div className="flex items-center gap-1">
                                Pool {lpSortKey === 'symbol' && (lpSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                            </div>
                        </th>
                        <th
                            className="hidden md:table-cell px-4 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                            onClick={() => handleLpSort('earnings')}
                        >
                            <div className="flex items-center gap-1">
                                Rewards {lpSortKey === 'earnings' && (lpSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                            </div>
                        </th>
                        <th
                            className="hidden lg:table-cell px-4 py-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                            onClick={() => handleLpSort('rangeStatus')}
                        >
                            <div className="flex items-center gap-1">
                                Range {lpSortKey === 'rangeStatus' && (lpSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                            </div>
                        </th>
                        <th
                            className="hidden md:table-cell px-4 py-2 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                            onClick={() => handleLpSort('totalInvested')}
                        >
                            <div className="flex items-center justify-end gap-1">
                                Principal {lpSortKey === 'totalInvested' && (lpSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                            </div>
                        </th>
                        <th
                            className="px-4 py-2 text-right cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                            onClick={() => handleLpSort('currentValue')}
                        >
                            <div className="flex items-center justify-end gap-1">
                                Value {lpSortKey === 'currentValue' && (lpSortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {lpAssets.map((asset, idx) => {
                        const depositTx = transactions.find(t => t.type === 'DEPOSIT' && t.assetSymbol === asset.symbol);
                        const fundedFromNote = depositTx?.notes?.match(/Funded from: ([^.]+)/)?.[1];
                        const rewardAssets = getRewardsForAsset(asset);

                        return (
                            <tr key={asset.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 group/row">
                                <td className="px-4 py-2 md:px-4 md:py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base tracking-tight">{asset.symbol}</span>
                                                {asset.lpRange && asset.monitorSymbol && (
                                                    <span className={`lg:hidden w-2 h-2 rounded-full flex-shrink-0 ${asset.inRange ? 'bg-emerald-500' : 'bg-rose-500'}`} title={asset.inRange ? 'In range' : 'Out of range'} />
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAddTransaction && onAddTransaction(asset);
                                                    }}
                                                    className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 scale-100 md:scale-0 group-hover/row:scale-100"
                                                    title="Add Additional Capital"
                                                >
                                                    <Plus size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                            {fundedFromNote && (
                                                <div className="hidden md:block text-xs font-medium text-slate-400 mt-1 opacity-70 truncate max-w-[150px]" title={fundedFromNote}>
                                                    via {fundedFromNote}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="hidden md:table-cell px-4 py-2">
                                    {rewardAssets.length === 0 ? (
                                        <span className="text-slate-300 dark:text-slate-700">—</span>
                                    ) : (
                                        <div className="flex flex-col gap-0.5">
                                            {rewardAssets.map(reward => (
                                                <span key={reward.symbol} className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {reward.amount.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })} <span className="text-slate-400 dark:text-slate-500">{reward.symbol}</span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="hidden lg:table-cell px-4 py-2">
                                    {asset.lpRange ? (
                                        <div className="flex flex-col gap-1">
                                            {asset.monitorSymbol && (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium ${asset.inRange ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        <span className="mr-1">•</span>{asset.inRange ? 'In range' : 'Out of range'}
                                                    </span>
                                                    {asset.monitorPrice !== undefined && asset.monitorPrice > 0 && (
                                                        <span className="text-xs font-mono text-slate-500">
                                                            {formatPrice(asset.monitorPrice)} {asset.monitorSymbol}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {!asset.monitorSymbol && <span className="text-xs text-slate-400">Static range</span>}
                                            <span className="text-xs font-mono text-slate-500">
                                                {(() => {
                                                    const isTokenToToken = asset.monitorSymbol?.includes('/');
                                                    const precision = isTokenToToken ? 6 : 4;
                                                    return `${formatPrice(asset.lpRange.min, locale, false, precision).replace('$', '')} – ${formatPrice(asset.lpRange.max, locale, false, precision).replace('$', '')}`;
                                                })()}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400">Full range</span>
                                    )}
                                </td>
                                <td className="hidden md:table-cell px-4 py-2 text-right">
                                    <span className="text-sm font-mono text-slate-700 dark:text-slate-300">${asset.totalInvested.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</span>
                                </td>
                                <td className="px-4 py-2 md:px-4 md:py-2 text-right">
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
                                                            if (!isNaN(val)) {
                                                                // For LPs, store total value directly (not per-unit)
                                                                updateAssetPrice(asset.symbol, val);
                                                            }
                                                        }
                                                        setEditingLpSymbol(null);
                                                        setNewLpValue('');
                                                    }}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                                                        ${(asset.currentValue || asset.totalInvested).toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingLpSymbol(asset.symbol);
                                                            setNewLpValue((asset.currentValue || asset.totalInvested).toString());
                                                        }}
                                                        className="opacity-100 md:opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-indigo-500"
                                                        title="Edit Value"
                                                    >
                                                        <Pencil size={11} />
                                                    </button>
                                                </div>
                                                {(() => {
                                                    const composition = getLpComposition(asset.symbol, transactions);
                                                    return composition ? (
                                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                                            {composition}
                                                        </span>
                                                    ) : null;
                                                })()}
                                                {asset.unrealizedPnL !== 0 && (
                                                    <span className={`text-xs font-mono ${asset.unrealizedPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {asset.unrealizedPnL >= 0 ? '+' : ''}{Math.abs(asset.pnlPercentage).toFixed(1)}%
                                                    </span>
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
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                No active pool positions
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </TableShell>
    );
});
