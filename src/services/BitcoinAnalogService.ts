import { ChartPoint } from './priceService';

export interface AnalogData {
    day: number;
    value: number; // Normalized to 100 at Day 0
    rsi?: number; // Optional RSI value for current path
}

export interface BitcoinAnalogResult {
    currentPath: AnalogData[];
    averagePath: AnalogData[];
    lastOversoldDate: string | null;
    currentDay0Price: number | null;
    currentRSI: number | null;
}

export const BitcoinAnalogService = {
    /**
     * Calculates RSI(14) for a given set of price points.
     */
    calculateRSI(prices: number[], period: number = 14): number[] {
        const rsi: number[] = new Array(prices.length).fill(0);
        if (prices.length <= period) return rsi;

        let gains = 0;
        let losses = 0;

        // First average
        for (let i = 1; i <= period; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            const gain = diff >= 0 ? diff : 0;
            const loss = diff < 0 ? -diff : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            rsi[i] = 100 - (100 / (1 + rs));
        }

        return rsi;
    },

    /**
     * Processes market data to find RSI < 30 events and build the analog chart data.
     */
    processAnalogs(data: ChartPoint[]): BitcoinAnalogResult {
        if (data.length < 200) {
            return { currentPath: [], averagePath: [], lastOversoldDate: null, currentDay0Price: null, currentRSI: null };
        }

        const prices = data.map(p => p.price);
        const rsi = this.calculateRSI(prices);

        // 1. Find all "Day 0" events (RSI crosses below 30)
        const allEventIndices: number[] = [];
        for (let i = 1; i < rsi.length; i++) {
            if (rsi[i] < 30 && rsi[i - 1] >= 30) {
                allEventIndices.push(i);
            }
        }

        // 2. Identify the absolute last event for the "Current" line
        const lastEventIndex = allEventIndices[allEventIndices.length - 1];
        const lastOversoldDate = lastEventIndex ? new Date(data[lastEventIndex].time).toLocaleDateString() : null;

        // 3. Extract paths for historical events (must have 80 days of future data)
        const historicalEvents = allEventIndices
            .filter(idx => idx < rsi.length - 80) // Must have 80 days of future data
            .slice(-6); // Take up to 6 most recent historical events

        // If the lastEventIndex is also in historicalEvents (meaning it's 80+ days old), 
        // we should remove it from historicalEvents so it's not averaged with itself
        const filteredHistoricalPoints = historicalEvents.filter(idx => idx !== lastEventIndex).slice(-5);
        const paths: number[][] = [];

        filteredHistoricalPoints.forEach(idx => {
            const start = idx - 90;
            const end = idx + 80;
            if (start >= 0 && end < prices.length) {
                const day0Price = prices[idx];
                const segment = prices.slice(start, end + 1).map(p => (p / day0Price) * 100);
                paths.push(segment);
            }
        });

        // 4. Calculate Average Path
        const averagePath: AnalogData[] = [];
        if (paths.length > 0) {
            const pathLength = paths[0].length;
            for (let i = 0; i < pathLength; i++) {
                let sum = 0;
                paths.forEach(p => sum += p[i]);
                averagePath.push({
                    day: i - 90,
                    value: sum / paths.length
                });
            }
        }

        // 5. Build Current Path
        const currentPath: AnalogData[] = [];
        if (lastEventIndex) {
            const start = lastEventIndex - 90;
            const end = Math.min(lastEventIndex + 80, prices.length - 1);
            const day0Price = prices[lastEventIndex];

            for (let i = start; i <= end; i++) {
                if (i >= 0) {
                    currentPath.push({
                        day: i - lastEventIndex,
                        value: (prices[i] / day0Price) * 100,
                        rsi: rsi[i] // Capture RSI value for the current path
                    });
                }
            }
        }

        return {
            currentPath,
            averagePath,
            lastOversoldDate,
            currentDay0Price: lastEventIndex ? prices[lastEventIndex] : null,
            currentRSI: rsi[rsi.length - 1]
        };
    }
};
