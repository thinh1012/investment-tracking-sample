import { calculateAssets, calculatePortfolioHistory } from '../domain/portfolioCalculator';

/**
 * [PORTFOLIO_WORKER]
 * Offloads heavy mathematical calculations from the UI thread.
 */
self.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    if (type === 'CALCULATE_PORTFOLIO') {
        const { transactions, prices, assetOverrides, manualPriceSources } = payload;

        try {
            const assets = calculateAssets(transactions, prices, assetOverrides, manualPriceSources);
            const history = calculatePortfolioHistory(transactions, prices);

            self.postMessage({
                type: 'CALCULATE_SUCCESS',
                payload: { assets, history }
            });
        } catch (error) {
            self.postMessage({
                type: 'CALCULATE_ERROR',
                payload: error instanceof Error ? error.message : 'Unknown calculation error'
            });
        }
    }
};
