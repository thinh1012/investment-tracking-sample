
export interface TechnicalIndicators {
    rsi: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    sma20?: number;
    sma50?: number;
    condition: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
}

export const TechnicalAnalysisService = {
    /**
     * Calculates RSI (Relative Strength Index) for a given set of closing prices.
     * @param prices Array of closing prices (newest last).
     * @param period Lookback period (default 14).
     */
    calculateRSI(prices: number[], period: number = 14): number {
        if (prices.length < period + 1) return 50; // Insufficient data

        let gains = 0;
        let losses = 0;

        // Calculate initial average gain/loss
        for (let i = 1; i <= period; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) gains += diff;
            else losses -= diff;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        // Smooth with subsequent candles
        for (let i = period + 1; i < prices.length; i++) {
            const diff = prices[i] - prices[i - 1];
            if (diff >= 0) {
                avgGain = (avgGain * (period - 1) + diff) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) - diff) / period;
            }
        }

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    },

    /**
     * Calculates Simple Moving Average (SMA).
     */
    calculateSMA(prices: number[], period: number): number | undefined {
        if (prices.length < period) return undefined;
        const slice = prices.slice(prices.length - period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    },

    /**
     * Generates a full technical report for a symbol.
     */
    analyze(prices: number[]): TechnicalIndicators {
        // Ensure we have enough data and it's sorted properly (we expect input array to be chronological)
        // If the caller passes raw DB history, it might need sorting. Assuming input is [oldest, ..., newest]

        const rsi = this.calculateRSI(prices);
        const sma20 = this.calculateSMA(prices, 20);
        const sma50 = this.calculateSMA(prices, 50);

        const currentPrice = prices[prices.length - 1];

        // Determine basic trend
        let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
        if (sma20 && sma50) {
            if (currentPrice > sma20 && sma20 > sma50) trend = 'BULLISH';
            else if (currentPrice < sma20 && sma20 < sma50) trend = 'BEARISH';
        } else if (sma20) {
            if (currentPrice > sma20) trend = 'BULLISH';
            else trend = 'BEARISH';
        }

        let condition: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
        if (rsi > 70) condition = 'OVERBOUGHT';
        if (rsi < 30) condition = 'OVERSOLD';

        return { rsi, trend, sma20, sma50, condition };
    }
};
