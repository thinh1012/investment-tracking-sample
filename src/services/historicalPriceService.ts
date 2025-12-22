import { HistoricalPriceService } from './db';

const CRYPTOCOMPARE_API_V2 = 'https://min-api.cryptocompare.com/data/v2/histoday';

export interface HistoricalPriceEntry {
    symbol: string;
    date: string;
    open: number;
    close: number;
    id: string;
}

export const historicalPriceService = {
    /**
     * Syncs historical prices for a list of symbols.
     * Fetches the last 30 days of data and saves to DB.
     */
    async syncHistoricalPrices(symbols: string[]): Promise<void> {
        const lastSync = localStorage.getItem('investment_tracker_last_historical_sync');
        const now = Date.now();

        // Sync once every 24 hours to save API calls
        if (lastSync && (now - parseInt(lastSync) < 24 * 60 * 60 * 1000)) {
            console.log('[HistoricalPriceService] Sync skipped (last sync < 24h ago)');
            return;
        }

        console.log(`[HistoricalPriceService] Syncing history for ${symbols.length} symbols...`);

        for (const symbol of symbols) {
            try {
                const response = await fetch(`${CRYPTOCOMPARE_API_V2}?fsym=${symbol.toUpperCase()}&tsym=USD&limit=30`);
                if (!response.ok) continue;

                const data = await response.json();
                if (data.Response === 'Success' && data.Data?.Data) {
                    const entries: HistoricalPriceEntry[] = data.Data.Data.map((day: any) => {
                        const dateStr = new Date(day.time * 1000).toISOString().split('T')[0];
                        return {
                            symbol: symbol.toUpperCase(),
                            date: dateStr,
                            open: day.open,
                            close: day.close,
                            id: `${symbol.toUpperCase()}_${dateStr}`
                        };
                    });

                    await HistoricalPriceService.saveBulk(entries);
                }
            } catch (error) {
                console.error(`[HistoricalPriceService] Failed to sync ${symbol}:`, error);
            }

            // Subtle delay to be nice to free API
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        localStorage.setItem('investment_tracker_last_historical_sync', now.toString());
        console.log('[HistoricalPriceService] Sync complete.');
    },

    /**
     * Gets performance data for a symbol.
     */
    async getPerformance(symbol: string): Promise<HistoricalPriceEntry[]> {
        return HistoricalPriceService.getBySymbol(symbol.toUpperCase());
    }
};
