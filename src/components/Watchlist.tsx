import React, { useState } from 'react';
import { Plus, Eye, Bell, BellOff } from 'lucide-react';
import { PriceAlert, AlertCondition, NotificationChannel, Asset } from '../types';
import { useWatchlist } from '../hooks/useWatchlist';
import { WatchlistTable } from './watchlist/WatchlistTable';
import { AlertModal } from './watchlist/AlertModal';
import { AddWatchlistForm } from './watchlist/AddWatchlistForm';
import { BitcoinAnalogChart } from './dashboard/BitcoinAnalogChart';

interface Props {
    prices?: Record<string, number>;
    onRefreshPrices?: (force?: boolean) => Promise<void>;
    alerts?: PriceAlert[];
    onAddAlert?: (symbol: string, targetPrice: number, condition: AlertCondition, channels: NotificationChannel[]) => void;
    onRemoveAlert?: (id: string) => void;
    onToggleAlert?: (id: string) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
    assets: Asset[];
    onAddCapital?: (symbol: string) => void;
}

const Watchlist: React.FC<Props> = ({
    prices = {}, onRefreshPrices, alerts = [], onAddAlert, onRemoveAlert, onToggleAlert, isMuted, onToggleMute, assets = [], onAddCapital
}) => {
    const {
        watchlist,
        isAddingWatchlist, setIsAddingWatchlist,
        newWatchlistSymbol, setNewWatchlistSymbol,
        newWatchlistBuyTarget, setNewWatchlistBuyTarget,
        newWatchlistSellTarget, setNewWatchlistSellTarget,
        newWatchlistExpectedQty, setNewWatchlistExpectedQty,
        newWatchlistNote, setNewWatchlistNote,
        handleAddWatchlist,
        handleDeleteWatchlist,
        editingId,
        editValues, setEditValues,
        startEditing,
        cancelEditing,
        saveEditing
    } = useWatchlist(onRefreshPrices);

    // Alert Modal Local State
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [activeAlertSymbol, setActiveAlertSymbol] = useState('');
    const [activeAlertPrice, setActiveAlertPrice] = useState(0);

    const openAlertModal = (symbol: string, price: number) => {
        setActiveAlertSymbol(symbol);
        setActiveAlertPrice(price);
        setIsAlertModalOpen(true);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Eye className="text-indigo-600 dark:text-indigo-400" size={24} />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Accumulation Goals</h2>
                </div>
                <div className="flex items-center gap-1">
                    {onToggleMute && (
                        <button
                            onClick={onToggleMute}
                            className={`p-2 transition-colors rounded-lg flex items-center gap-2 text-sm font-medium ${isMuted ? 'text-slate-400 bg-slate-100 dark:bg-slate-800' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'}`}
                            title={isMuted ? "Alerts Paused (Click to Resume)" : "Alerts Active (Click to Pause)"}
                        >
                            {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
                            <span className="hidden sm:inline">{isMuted ? 'Paused' : 'Active'}</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsAddingWatchlist(true)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        title="Add Token"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="p-6">
                <BitcoinAnalogChart />
                <div className="space-y-4">
                    {/* Add Form */}
                    {isAddingWatchlist && (
                        <AddWatchlistForm
                            symbol={newWatchlistSymbol} setSymbol={setNewWatchlistSymbol}
                            buyTarget={newWatchlistBuyTarget} setBuyTarget={setNewWatchlistBuyTarget}
                            sellTarget={newWatchlistSellTarget} setSellTarget={setNewWatchlistSellTarget}
                            expectedQty={newWatchlistExpectedQty} setExpectedQty={setNewWatchlistExpectedQty}
                            note={newWatchlistNote} setNote={setNewWatchlistNote}
                            onCancel={() => setIsAddingWatchlist(false)}
                            onAdd={handleAddWatchlist}
                        />
                    )}

                    <WatchlistTable
                        watchlist={watchlist}
                        prices={prices}
                        editingId={editingId}
                        editValues={editValues}
                        assets={assets}
                        alerts={alerts}
                        onEdit={startEditing}
                        onDelete={handleDeleteWatchlist}
                        onSaveEdit={saveEditing}
                        onCancelEdit={cancelEditing}
                        onSetEditValues={setEditValues}
                        onOpenAlertModal={openAlertModal}
                        onAddCapital={onAddCapital}
                    />
                </div>
            </div>

            {/* Alert Modal */}
            <AlertModal
                isOpen={isAlertModalOpen}
                onClose={() => setIsAlertModalOpen(false)}
                symbol={activeAlertSymbol}
                currentPrice={activeAlertPrice}
                alerts={alerts}
                onAddAlert={onAddAlert}
                onRemoveAlert={onRemoveAlert}
                onToggleAlert={onToggleAlert}
            />
        </div>
    );
};

export default Watchlist;
