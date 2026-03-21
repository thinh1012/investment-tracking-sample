import { useState, useEffect } from 'react';
import { MarketPicksService, ManualHistoricalPriceService } from '../services/database/OtherServices';
import { MarketPick } from '../services/database/types';
import { historicalPriceService, HistoricalPriceEntry } from '../services/HistoricalPriceService';
import { deriveOpenPrice, ChartPoint, fetchMarketChart } from '../services/PriceService';
import { StrategistIntelligenceService, StrategistIntel } from '../services/StrategistIntelligenceService';

export const useMarketPicks = () => {
    const [picks, setPicks] = useState<MarketPick[]>([]);
    const [historicalData, setHistoricalData] = useState<Record<string, number>>({});
    const [manualHistoricalData, setManualHistoricalData] = useState<Record<string, number>>({});
    const [intelData, setIntelData] = useState<Record<string, StrategistIntel>>({});
    const [sparklines, setSparklines] = useState<Record<string, ChartPoint[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const loadPicks = async (force: boolean = false) => {
        const LAST_LOAD_KEY = 'investment_tracker_last_picks_load';
        const now = Date.now();
        const lastLoad = localStorage.getItem(LAST_LOAD_KEY);

        try {
            const data = await MarketPicksService.getAll();
            setPicks(data.sort((a, b) => b.addedAt - a.addedAt));

            // Skip heavy fetching if loaded recently and not forced
            if (!force && lastLoad && (now - parseInt(lastLoad) < 20 * 60 * 1000)) {
                console.log("[useMarketPicks] skipping heavy fetch (freshly loaded < 20m ago)");
                setIsLoading(false);
                return;
            }

            // 1. Load Manual Overrides
            const manualMap: Record<string, number> = {};
            const manualEntries = await ManualHistoricalPriceService.getAll();
            manualEntries.forEach(entry => {
                manualMap[entry.symbol] = entry.open;
            });
            setManualHistoricalData(manualMap);

            // 2. Load data for all picks in parallel
            const historyMap: Record<string, number> = {};
            const intelMap: Record<string, StrategistIntel> = {};
            const sparkMap: Record<string, ChartPoint[]> = {};

            console.log(`[useMarketPicks] fetching fresh data for ${data.length} picks...`);
            await Promise.all(data.map(async (pick) => {
                const sym = pick.symbol;

                // Concurrent sub-tasks for each pick
                const [history, intel, chart] = await Promise.all([
                    historicalPriceService.getPerformance(sym),
                    StrategistIntelligenceService.getIntel(sym),
                    fetchMarketChart(sym, 7)
                ]);

                if (history && history.length > 0) {
                    const latest = history.sort((a, b) => b.date.localeCompare(a.date))[0];
                    historyMap[sym] = latest.open;
                }
                if (intel) intelMap[sym] = intel;
                if (chart && chart.length > 0) sparkMap[sym] = chart;
            }));

            setHistoricalData(historyMap);
            setIntelData(intelMap);
            setSparklines(sparkMap);
            localStorage.setItem(LAST_LOAD_KEY, now.toString());
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

    const investigatePick = async (symbol: string) => {
        const result = await StrategistIntelligenceService.investigatePick(symbol);
        setIntelData(prev => ({ ...prev, [symbol.toUpperCase()]: result }));
        return result;
    };

    return {
        picks,
        historicalData: { ...historicalData, ...manualHistoricalData },
        intelData,
        sparklines,
        isLoading,
        addPick,
        removePick,
        saveManualOpen,
        investigatePick,
        refreshPicks: (force: boolean = false) => loadPicks(force)
    };
};
