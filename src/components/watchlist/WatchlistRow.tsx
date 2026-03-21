import React, { useState } from 'react';
import { Pencil, Trash2, Bell, ShoppingCart, RefreshCw, BookOpen } from 'lucide-react';
import { WatchlistItem } from '../../hooks/useWatchlist';
import { Asset, PriceAlert } from '../../types';
import { WatchlistServiceLogic } from '../../services/WatchlistServiceLogic';
import { GoalProgressBar } from './GoalProgressBar';
import { formatPrice } from '../../services/PriceService';

interface Props {
    item: WatchlistItem;
    currentPrice: number;
    isEditing: boolean;
    editValues: {
        targetBuyPrice: string;
        targetSellPrice: string;
        expectedQty: string;
        note: string;
    };
    assets: Asset[];
    alerts: PriceAlert[];
    onEdit: (item: WatchlistItem) => void;
    onDelete: (id: string) => void;
    onSaveEdit: (id: string) => void;
    onCancelEdit: () => void;
    onSetEditValues: (values: any) => void;
    onOpenAlertModal: (symbol: string, price: number) => void;
    onAddTransaction?: () => void;
    priceSource?: string;
}

export const WatchlistRow: React.FC<Props> = (props) => {
    const {
        item, currentPrice, isEditing, editValues, assets, alerts,
        onEdit, onDelete, onSaveEdit, onCancelEdit, onSetEditValues,
        onOpenAlertModal, onAddTransaction, priceSource
    } = props;

    const [isExpanded, setIsExpanded] = useState(false);


    const recommendation = WatchlistServiceLogic.getRecommendation(currentPrice, item.targetBuyPrice, item.targetSellPrice);

    const matchedAsset = assets.find(a => a.symbol.toUpperCase() === item.symbol.toUpperCase());
    const heldQuantity = matchedAsset ? matchedAsset.quantity + (matchedAsset.lockedInLpQuantity || 0) : 0;

    const expected = item.expectedQty || 0;
    const { percent } = WatchlistServiceLogic.calculateProgress(heldQuantity, expected);

    const activeAlerts = alerts.filter(a => a.symbol === item.symbol);


    return (
        <>
            <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="py-4 px-4 font-black text-slate-800 dark:text-white text-base">
                    {item.symbol}
                </td>
                <td className="py-4 px-4 text-right text-slate-900 dark:text-white font-mono text-base font-bold">
                    <div className="flex items-center justify-end gap-2">
                        {currentPrice > 0 ? (
                            <>
                                {priceSource === 'satellite' && (
                                    <span title="Satellite Verified Oracle" className="text-indigo-500 animate-pulse">📡</span>
                                )}
                                {formatPrice(currentPrice)}
                            </>
                        ) : (
                            <span className="text-xs text-slate-400">Loading...</span>
                        )}
                    </div>
                </td>

                {/* Avg Price (Cost Basis) */}
                <td className="py-4 px-4 text-right font-mono">
                    {matchedAsset && matchedAsset.averageBuyPrice > 0 ? (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {formatPrice(matchedAsset.averageBuyPrice)}
                        </span>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                </td>

                {/* Target Buy */}
                <td className="py-4 px-4 text-right font-mono">
                    {isEditing ? (
                        <input
                            type="number"
                            value={editValues.targetBuyPrice}
                            onChange={(e) => onSetEditValues({ ...editValues, targetBuyPrice: e.target.value })}
                            className="w-20 p-1 text-right text-sm border border-indigo-200 rounded focus:border-indigo-500 outline-none dark:bg-slate-800 dark:border-slate-600"
                            autoFocus
                        />
                    ) : (
                        item.targetBuyPrice ? (
                            <span className="text-slate-800 dark:text-slate-100 font-bold">{formatPrice(item.targetBuyPrice)}</span>
                        ) : <span className="text-slate-300">-</span>
                    )}
                </td>

                {/* Target Sell */}
                <td className="py-4 px-4 text-right font-mono">
                    {isEditing ? (
                        <input
                            type="number"
                            value={editValues.targetSellPrice}
                            onChange={(e) => onSetEditValues({ ...editValues, targetSellPrice: e.target.value })}
                            className="w-20 p-1 text-right text-sm border border-indigo-200 rounded focus:border-indigo-500 outline-none dark:bg-slate-800 dark:border-slate-600"
                        />
                    ) : (
                        item.targetSellPrice ? (
                            <span className="text-slate-800 dark:text-slate-100 font-bold">{formatPrice(item.targetSellPrice)}</span>
                        ) : <span className="text-slate-300">-</span>
                    )}
                </td>

                {/* Progress */}
                <td className="py-3 px-4 min-w-[180px]">
                    {isEditing ? (
                        <div className="flex gap-2 items-center justify-center">
                            <span className="text-xs text-slate-400">Target Qty:</span>
                            <input
                                type="number"
                                value={editValues.expectedQty}
                                onChange={(e) => onSetEditValues({ ...editValues, expectedQty: e.target.value })}
                                className="w-20 p-1 text-right text-sm border border-indigo-200 rounded focus:border-indigo-500 outline-none dark:bg-slate-800 dark:border-slate-600"
                                placeholder="Exp"
                            />
                        </div>
                    ) : (
                        expected > 0 ? (
                            <GoalProgressBar
                                heldQuantity={heldQuantity}
                                expectedQty={expected}
                                percent={percent}
                                symbol={item.symbol}
                                onAddTransaction={onAddTransaction}
                            />
                        ) : (
                            <div className="flex justify-center">
                                <button onClick={() => onEdit(item)} className="text-xs text-indigo-500 hover:underline">
                                    + Set Goal
                                </button>
                            </div>
                        )
                    )}
                </td>


                {/* Note */}
                <td className="py-2 px-4 text-slate-600 dark:text-slate-100 min-w-[200px]">
                    {isEditing ? (
                        <textarea
                            value={editValues.note}
                            onChange={(e) => onSetEditValues({ ...editValues, note: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    onSaveEdit(item.id);
                                }
                            }}
                            className="w-full h-20 p-2 text-xs border border-indigo-200 rounded-lg focus:border-indigo-500 outline-none dark:bg-slate-800 dark:border-slate-600 custom-scrollbar resize-none"
                            placeholder="Add token notes here... (Ctrl+Enter to save)"
                        />
                    ) : (
                        <div className="flex items-start gap-2 group/note">
                            <div className="flex-1 text-xs font-bold italic opacity-90 line-clamp-3 hover:line-clamp-none transition-all duration-300" title={item.note}>
                                {item.note || '-'}
                            </div>
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('focus-note-symbol', {
                                        detail: { symbol: item.symbol }
                                    }));
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-all opacity-0 group-hover/note:opacity-100"
                                title={`Jump to ${item.symbol} Intel`}
                            >
                                <BookOpen size={14} />
                            </button>
                        </div>
                    )}
                </td>

                {/* Alerts */}
                <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => onOpenAlertModal(item.symbol, currentPrice)}
                            className={`p-1.5 rounded-full transition-colors ${activeAlerts.length > 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-300 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title={`${activeAlerts.length} Active Alerts`}
                        >
                            {activeAlerts.length > 0 ? <Bell size={16} fill="currentColor" /> : <Bell size={16} />}
                        </button>
                        {activeAlerts.length > 0 && <span className="text-xs font-semibold text-indigo-600">{activeAlerts.length}</span>}
                    </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                    {isEditing ? (
                        <div className="flex justify-end gap-2">
                            <button onClick={() => onSaveEdit(item.id)} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/20">
                                Save
                            </button>
                            <button onClick={onCancelEdit} className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-end gap-2">
                            {/* Hover-only actions: Edit/Delete */}
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Edit">
                                    <Pencil size={18} />
                                </button>
                                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Remove">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </td>
            </tr>
        </>
    );
};
