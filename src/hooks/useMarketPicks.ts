import { useState, useEffect } from 'react';
import { MarketPicksService, MarketPick } from '../services/db';

export const useMarketPicks = () => {
    const [picks, setPicks] = useState<MarketPick[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPicks = async () => {
        try {
            const data = await MarketPicksService.getAll();
            setPicks(data.sort((a, b) => b.addedAt - a.addedAt));
        } catch (e) {
            console.error("Failed to load market picks", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPicks();

        const handleUpdate = () => loadPicks();
        window.addEventListener('market_picks_updated', handleUpdate);
        return () => window.removeEventListener('market_picks_updated', handleUpdate);
    }, []);

    const addPick = async (symbol: string, note?: string) => {
        const cleanSymbol = symbol.toUpperCase().trim();
        if (picks.some(p => p.symbol === cleanSymbol)) return;

        const newPick: MarketPick = {
            symbol: cleanSymbol,
            addedAt: Date.now(),
            note
        };

        setPicks(prev => [newPick, ...prev]);
        await MarketPicksService.add(newPick);
        window.dispatchEvent(new Event('market_picks_updated'));
    };

    const removePick = async (symbol: string) => {
        const cleanSymbol = symbol.toUpperCase().trim();
        setPicks(prev => prev.filter(p => p.symbol !== cleanSymbol));
        await MarketPicksService.delete(cleanSymbol);
        window.dispatchEvent(new Event('market_picks_updated'));
    };

    return {
        picks,
        isLoading,
        addPick,
        removePick
    };
};
