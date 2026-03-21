import { useEffect, useRef } from 'react';
import { eventManager } from '../services/EventManager';

/**
 * useReactiveIntelligence
 * Monitors volatility and dispatches harvest requests to the Scout.
 */
export const useReactiveIntelligence = (holdings: any[], watchlist: any[]) => {
    const lastNotified = useRef<{ [symbol: string]: number }>({});

    useEffect(() => {
        // This is a simulation or bridge hook.
        // In a real scenario, this would be triggered by a Price Source update.
        const checkVolatility = () => {
            const allAssets = [...holdings, ...watchlist];

            allAssets.forEach(asset => {
                const symbol = asset.symbol || asset.id;
                const change = Math.abs(asset.change24h || 0);

                // THRESHOLD: If movement is > 5% and we haven't checked news in 1 hour
                if (change > 5) {
                    const now = Date.now();
                    const lastCheck = lastNotified.current[symbol] || 0;

                    if (now - lastCheck > 3600000) { // 1 Hour Cool-down
                        console.log(`[STRATEGIST] Volatility detected for ${symbol} (${change.toFixed(2)}%). Requesting Scout Intel...`);

                        eventManager.emit('scout:request_intel', {
                            symbol,
                            reason: `Volatility detected: ${change.toFixed(2)}%`
                        });

                        lastNotified.current[symbol] = now;
                    }
                }
            });
        };

        // Poll every 30 seconds for simulation of live price updates
        const interval = setInterval(checkVolatility, 30000);
        return () => clearInterval(interval);
    }, [holdings, watchlist]);
};
