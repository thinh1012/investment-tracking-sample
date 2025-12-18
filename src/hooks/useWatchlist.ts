import { useState, useEffect } from 'react';
import { WatchlistService } from '../services/db';

export interface WatchlistItem {
    id: string;
    symbol: string;
    targetBuyPrice?: number;
    targetSellPrice?: number;
    expectedQty?: number;
    boughtQty?: number;
    note?: string;
    createdAt: number;
}

export const useWatchlist = (onRefreshPrices?: (force?: boolean) => Promise<void>) => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [isAddingWatchlist, setIsAddingWatchlist] = useState(false);

    // Form State
    const [newWatchlistSymbol, setNewWatchlistSymbol] = useState('');
    const [newWatchlistBuyTarget, setNewWatchlistBuyTarget] = useState('');
    const [newWatchlistSellTarget, setNewWatchlistSellTarget] = useState('');
    const [newWatchlistExpectedQty, setNewWatchlistExpectedQty] = useState('');
    const [newWatchlistNote, setNewWatchlistNote] = useState('');

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({
        targetBuyPrice: '',
        targetSellPrice: '',
        expectedQty: '',
        note: ''
    });

    useEffect(() => {
        const load = async () => {
            try {
                const items = await WatchlistService.getAll();
                setWatchlist(items);
            } catch (e) {
                console.error("Failed to load watchlist", e);
            }
        };
        load();
    }, []);

    const saveToStorage = async (items: WatchlistItem[]) => {
        setWatchlist(items);
        await WatchlistService.bulkSave(items);
    };

    const handleAddWatchlist = async () => {
        if (!newWatchlistSymbol) return;
        const newItem: WatchlistItem = {
            id: crypto.randomUUID(),
            symbol: newWatchlistSymbol.toUpperCase().trim(),
            targetBuyPrice: newWatchlistBuyTarget ? parseFloat(newWatchlistBuyTarget) : undefined,
            targetSellPrice: newWatchlistSellTarget ? parseFloat(newWatchlistSellTarget) : undefined,
            expectedQty: newWatchlistExpectedQty ? parseFloat(newWatchlistExpectedQty) : undefined,
            boughtQty: 0,
            note: newWatchlistNote,
            createdAt: Date.now()
        };
        await saveToStorage([...watchlist, newItem]);

        // Reset
        setNewWatchlistSymbol('');
        setNewWatchlistBuyTarget('');
        setNewWatchlistSellTarget('');
        setNewWatchlistExpectedQty('');
        setNewWatchlistNote('');
        setIsAddingWatchlist(false);

        if (onRefreshPrices) await onRefreshPrices(true);
    };

    const handleDeleteWatchlist = (id: string) => {
        saveToStorage(watchlist.filter(item => item.id !== id));
    };

    const startEditing = (item: WatchlistItem) => {
        setEditingId(item.id);
        setEditValues({
            targetBuyPrice: item.targetBuyPrice?.toString() || '',
            targetSellPrice: item.targetSellPrice?.toString() || '',
            expectedQty: item.expectedQty?.toString() || '',
            note: item.note || ''
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditValues({ targetBuyPrice: '', targetSellPrice: '', expectedQty: '', note: '' });
    };

    const saveEditing = (id: string) => {
        const updated = watchlist.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    targetBuyPrice: editValues.targetBuyPrice ? parseFloat(editValues.targetBuyPrice) : undefined,
                    targetSellPrice: editValues.targetSellPrice ? parseFloat(editValues.targetSellPrice) : undefined,
                    expectedQty: editValues.expectedQty ? parseFloat(editValues.expectedQty) : undefined,
                    note: editValues.note
                };
            }
            return item;
        });
        saveToStorage(updated);
        setEditingId(null);
    };

    return {
        watchlist,
        isAddingWatchlist, setIsAddingWatchlist,
        // Add Form
        newWatchlistSymbol, setNewWatchlistSymbol,
        newWatchlistBuyTarget, setNewWatchlistBuyTarget,
        newWatchlistSellTarget, setNewWatchlistSellTarget,
        newWatchlistExpectedQty, setNewWatchlistExpectedQty,
        newWatchlistNote, setNewWatchlistNote,
        // Handlers
        handleAddWatchlist,
        handleDeleteWatchlist,
        // Editing
        editingId,
        editValues, setEditValues,
        startEditing,
        cancelEditing,
        saveEditing
    };
};
