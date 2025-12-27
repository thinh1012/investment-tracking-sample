import { useState, useEffect } from 'react';
import { MarketPicksService, MarketPick, ManualHistoricalPriceService } from '../services/db';
import { historicalPriceService, HistoricalPriceEntry } from '../services/historicalPriceService';
import { deriveOpenPrice, ChartPoint, fetchMarketChart } from '../services/priceService';
import { StrategistIntelligenceService, StrategistIntel } from '../services/StrategistIntelligenceService';

export const useMarketPicks = () => {
    const [picks, setPicks] = useState<MarketPick[]>([]);
    const [historicalData, setHistoricalData] = useState<Record<string, number>>({});
    const [manualHistoricalData, setManualHistoricalData] = useState<Record<string, number>>({});
    const [intelData, setIntelData] = useState<Record<string, StrategistIntel>>({});
    const [sparklines, setSparklines] = useState<Record<string, ChartPoint[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const loadPicks = async () => {
        try {
            const data = await MarketPicksService.getAll();
            setPicks(data.sort((a, b) => b.addedAt - a.addedAt));

            // 1. Load Manual Overrides
            const manualMap: Record<string, number> = {};
            const manualEntries = await ManualHistoricalPriceService.getAll();
            manualEntries.forEach(entry => {
                manualMap[entry.symbol] = entry.open;
            });
            setManualHistoricalData(manualMap);

            // 2. Load latest daily open prices for all picks
            const historyMap: Record<string, number> = {};
            const intelMap: Record<string, StrategistIntel> = {};
            const sparkMap: Record<string, ChartPoint[]> = {};

            for (const pick of data) {
                const sym = pick.symbol;

                // Fetch Historical Open
                const history = await historicalPriceService.getPerformance(sym);
                if (history && history.length > 0) {
                    const latest = history.sort((a, b) => b.date.localeCompare(a.date))[0];
                    historyMap[sym] = latest.open;
                }

                // Fetch Intel
                const intel = await StrategistIntelligenceService.getIntel(sym);
                if (intel) intelMap[sym] = intel;

                // Fetch Sparkline (7 days)
                const chart = await fetchMarketChart(sym, 7);
                if (chart && chart.length > 0) sparkMap[sym] = chart;
            }
            setHistoricalData(historyMap);
            setIntelData(intelMap);
            setSparklines(sparkMap);
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

        // Fetch history for the new pick immediately
        const history = await historicalPriceService.getPerformance(cleanSymbol);
        if (history && history.length > 0) {
            const latest = history.sort((a, b) => b.date.localeCompare(a.date))[0];
            setHistoricalData(prev => ({ ...prev, [cleanSymbol]: latest.open }));
        }

        window.dispatchEvent(new Event('market_picks_updated'));
    };

    const removePick = async (symbol: string) => {
        const cleanSymbol = symbol.toUpperCase().trim();
        setPicks(prev => prev.filter(p => p.symbol !== cleanSymbol));
        await MarketPicksService.delete(cleanSymbol);

        const newHistory = { ...historicalData };
        delete newHistory[cleanSymbol];
        setHistoricalData(newHistory);

        window.dispatchEvent(new Event('market_picks_updated'));
    };

    const saveManualOpen = async (symbol: string, openPrice: number) => {
        const todayStr = new Date().toISOString().split('T')[0];
        await ManualHistoricalPriceService.save({ symbol, open: openPrice, date: todayStr });
        setManualHistoricalData(prev => ({ ...prev, [symbol.toUpperCase()]: openPrice }));
    };

    return {
        picks,
        historicalData: { ...historicalData, ...manualHistoricalData },
        intelData,
        sparklines,
        isLoading,
        addPick,
        removePick,
        saveManualOpen
    };
};
