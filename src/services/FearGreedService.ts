/**
 * [FEAR_GREED_SERVICE]
 * Dedicated service for fetching the Fear & Greed Index from Alternative.me API.
 * Acts as a baseline fallback when the Satellite Scout is offline.
 */

export interface FearGreedData {
    value: number;
    label: string;
    timestamp: number;
    source: 'scout' | 'api';
}

const CACHE_KEY = 'vault_fear_greed_cache';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours (the index updates daily)
const API_URL = 'https://api.alternative.me/fng/?limit=1';

class FearGreedService {
    private lastFetchAttempt: number = 0;
    private FETCH_COOLDOWN = 60 * 1000; // 1 minute cooldown between API calls

    /**
     * Inject scout data (higher priority than API)
     */
    injectScoutData(value: number): void {
        const label = this.getLabel(value);
        const data: FearGreedData = {
            value,
            label,
            timestamp: Date.now(),
            source: 'scout'
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log('[FearGreedService] 📡 Injected Scout data:', value);
    }

    /**
     * Get the current Fear & Greed value.
     * Prefers cached Scout data, falls back to API if stale.
     */
    async get(): Promise<FearGreedData | null> {
        // 1. Check cache first
        const cached = this.getCache();
        if (cached) {
            return cached;
        }

        // 2. Fetch from API if no valid cache
        return this.fetchFromAPI();
    }

    /**
     * Force refresh from the API (ignores cache)
     */
    async refresh(): Promise<FearGreedData | null> {
        return this.fetchFromAPI();
    }

    private getCache(): FearGreedData | null {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;

            const data: FearGreedData = JSON.parse(raw);
            const age = Date.now() - data.timestamp;

            // Scout data is valid for 12 hours, API data for 4 hours
            const maxAge = data.source === 'scout' ? 12 * 60 * 60 * 1000 : CACHE_DURATION;
            if (age > maxAge) return null;

            return data;
        } catch (e) {
            return null;
        }
    }

    private async fetchFromAPI(): Promise<FearGreedData | null> {
        // Cooldown to prevent hammering the API
        const now = Date.now();
        if (now - this.lastFetchAttempt < this.FETCH_COOLDOWN) {
            console.log('[FearGreedService] ⏳ API fetch on cooldown.');
            return this.getCache(); // Return stale cache if available
        }
        this.lastFetchAttempt = now;

        try {
            console.log('[FearGreedService] 🌐 Fetching from Alternative.me API...');
            const response = await fetch(API_URL);

            if (!response.ok) {
                console.warn('[FearGreedService] ⚠️ API response not OK:', response.status);
                return null;
            }

            const json = await response.json();
            // API returns: { data: [{ value: "25", value_classification: "Extreme Fear", timestamp: "..." }] }
            if (json?.data?.[0]) {
                const raw = json.data[0];
                const value = parseInt(raw.value, 10);
                const label = raw.value_classification || this.getLabel(value);

                const data: FearGreedData = {
                    value,
                    label,
                    timestamp: Date.now(),
                    source: 'api'
                };

                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                console.log('[FearGreedService] ✅ API data cached:', value, label);
                return data;
            }
        } catch (e) {
            console.warn('[FearGreedService] ❌ API fetch failed:', e);
        }

        return null;
    }

    private getLabel(value: number): string {
        if (value <= 25) return 'Extreme Fear';
        if (value <= 45) return 'Fear';
        if (value <= 55) return 'Neutral';
        if (value <= 75) return 'Greed';
        return 'Extreme Greed';
    }
}

export const fearGreedService = new FearGreedService();
