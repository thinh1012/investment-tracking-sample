import React from 'react';
import { Pencil, Trash2, Bell, ShoppingCart } from 'lucide-react';
import { WatchlistItem } from '../../hooks/useWatchlist';
import { Asset, PriceAlert } from '../../types';
import { WatchlistServiceLogic } from '../../services/WatchlistServiceLogic';
import { GoalProgressBar } from './GoalProgressBar';

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
    onAddCapital?: (symbol: string) => void;
}

export const WatchlistRow: React.FC<Props> = (props) => {
    const {
        item, currentPrice, isEditing, editValues, assets, alerts,
        onEdit, onDelete, onSaveEdit, onCancelEdit, onSetEditValues,
        onOpenAlertModal, onAddCapital
    } = props;

    const recommendation = WatchlistServiceLogic.getRecommendation(currentPrice, item.targetBuyPrice, item.targetSellPrice);

    const matchedAsset = assets.find(a => a.symbol.toUpperCase() === item.symbol.toUpperCase());
    const heldQuantity = matchedAsset ? matchedAsset.quantity + (matchedAsset.lockedInLpQuantity || 0) : 0;

    const expected = item.expectedQty || 0;
    const { percent } = WatchlistServiceLogic.calculateProgress(heldQuantity, expected);

    const activeAlerts = alerts.filter(a => a.symbol === item.symbol);

    return (
        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <td className="py-4 px-4 font-black text-slate-800 dark:text-white text-base">
                {item.symbol}
            </td>
            <td className="py-4 px-4 text-right text-slate-900 dark:text-white font-mono text-base font-bold">
                {currentPrice > 0 ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : <span className="text-xs text-slate-400">Loading...</span>}
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
                        <span className="text-slate-800 dark:text-slate-100 font-bold">${item.targetBuyPrice.toLocaleString()}</span>
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
                        <span className="text-slate-800 dark:text-slate-100 font-bold">${item.targetSellPrice.toLocaleString()}</span>
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
                            onAddCapital={onAddCapital}
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
            <td className="py-4 px-4 text-slate-600 dark:text-slate-100 max-w-[200px]">
                {isEditing ? (
                    <input
                        type="text"
                        value={editValues.note}
                        onChange={(e) => onSetEditValues({ ...editValues, note: e.target.value })}
                        className="w-full p-1 text-sm border border-indigo-200 rounded focus:border-indigo-500 outline-none dark:bg-slate-800 dark:border-slate-600"
                    />
                ) : (
                    <div className="truncate font-bold italic opacity-90" title={item.note}>{item.note || '-'}</div>
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
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Edit">
                            <Pencil size={18} />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Remove">
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};
