import React from 'react';
import { WatchlistItem } from '../../hooks/useWatchlist';
import { Asset, PriceAlert } from '../../types';
import { WatchlistRow } from './WatchlistRow';

interface Props {
    watchlist: WatchlistItem[];
    prices: Record<string, number>;
    editingId: string | null;
    editValues: any;
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

export const WatchlistTable: React.FC<Props> = (props) => {
    const { watchlist, prices } = props;

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-[10px] text-slate-500 dark:text-slate-200 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Asset</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-right">Price</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-right">Target Buy</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-right">Target Sell</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-center">Accumulation</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest">Note</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-center">Alerts</th>
                        <th className="py-3 px-4 font-black uppercase tracking-widest text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800">
                    {watchlist.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                                Your watchlist is empty. Click + to add tokens you're watching.
                            </td>
                        </tr>
                    ) : (
                        watchlist.map(item => (
                            <WatchlistRow
                                key={item.id}
                                item={item}
                                currentPrice={prices[item.symbol] || 0}
                                isEditing={props.editingId === item.id}
                                editValues={props.editValues}
                                assets={props.assets}
                                alerts={props.alerts}
                                onEdit={props.onEdit}
                                onDelete={props.onDelete}
                                onSaveEdit={props.onSaveEdit}
                                onCancelEdit={props.onCancelEdit}
                                onSetEditValues={props.onSetEditValues}
                                onOpenAlertModal={props.onOpenAlertModal}
                                onAddCapital={props.onAddCapital}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
