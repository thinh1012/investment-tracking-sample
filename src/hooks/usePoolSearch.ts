import { useState } from 'react';
import { SCOUT_URL } from '../config/scoutConfig';

export interface Pool {
    pair: string;
    protocol: string;
    chain: string;
    tvl: number;
    volume30d: number;
    apr: number;
    feeTier: number;
    address: string;
    url?: string;
    source: string;
}

export interface PoolFilters {
    chain?: string;
    minTVL?: number;
    minVolume30d?: number;
    minAPR?: number;
}

export const usePoolSearch = () => {
    const [pools, setPools] = useState<Pool[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchPools = async (
        tokenA: string,
        tokenB: string,
        filters: PoolFilters = {}
    ) => {
        if (!tokenA || !tokenB) {
            setError('Both tokens are required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                tokenA,
                tokenB,
                chain: filters.chain || 'all',
                ...(filters.minTVL && { minTVL: filters.minTVL.toString() }),
                ...(filters.minAPR && { minAPR: filters.minAPR.toString() }),
                ...(filters.minVolume30d && { minVolume30d: filters.minVolume30d.toString() })
            });

            const response = await fetch(`${SCOUT_URL}/api/pools/search?${params}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            setPools(data.pools || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch pools';
            setError(message);
            console.error('[usePoolSearch] Error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const clearResults = () => {
        setPools([]);
        setError(null);
    };

    return {
        pools,
        isLoading,
        error,
        searchPools,
        clearResults
    };
};
