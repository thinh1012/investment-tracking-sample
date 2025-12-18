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
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-2 font-medium uppercase tracking-wider">Asset</th>
                        <th className="py-2 font-medium uppercase tracking-wider text-right">Price</th>
                        <th className="py-2 font-medium uppercase tracking-wider text-right">Target Buy</th>
                        <th className="py-2 font-medium uppercase tracking-wider text-right">Target Sell</th>
                        <th className="py-2 font-medium uppercase tracking-wider text-center">Accumulation</th>
                        <th className="py-2 font-medium uppercase tracking-wider pl-4">Note</th>
                        <th className="py-2 font-medium uppercase tracking-wider text-center">Alerts</th>
                        <th className="py-2 font-medium uppercase tracking-wider text-right">Action</th>
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
