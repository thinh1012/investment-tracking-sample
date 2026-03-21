/**
 * [SCOUT_ALIAS_SERVICE]
 * Centralized service for resolving ambiguous token symbols to their correct API identifiers.
 * Fetches and caches the alias map from Satellite Scout.
 * 
 * Enhanced with disambiguation support for ambiguous token symbols (e.g., MET could be Meteora or Metis).
 */

import { SCOUT_URL } from '../../config/scoutConfig';

export type AliasEntry = {
    coingeckoId?: string;
    cmcSlug?: string;
    fullName?: string;
    chain?: string;
    confidence?: 'high' | 'medium' | 'low' | 'user_confirmed';
};

export type AmbiguousTokenOption = {
    name: string;
    coingeckoId: string;
    cmcSlug: string;
    chain: string;
    category: string;
    description: string;
};

export type ResolutionResult = {
    confidence: 'high' | 'medium' | 'low' | 'ambiguous';
    primary: AliasEntry | null;
    alternatives?: AmbiguousTokenOption[];
    requiresConfirmation: boolean;
};

type AliasMap = Record<string, AliasEntry>;
type AmbiguousMap = Record<string, AmbiguousTokenOption[]>;

class ScoutAliasServiceClass {
    private static get SATELLITE_URL() { return SCOUT_URL; }
    private static CACHE_KEY = 'scout_alias_cache';
    private static AMBIGUOUS_CACHE_KEY = 'scout_ambiguous_cache';
    private static CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    private aliasMap: AliasMap = {};
    private ambiguousMap: AmbiguousMap = {};
    private lastFetch: number = 0;

    /**
     * Refresh the alias map from Satellite.
     * Called lazily on first access or if cache is stale.
     */
    async refresh(): Promise<void> {
        try {
            const res = await fetch(`${ScoutAliasServiceClass.SATELLITE_URL}/aliases`);
            if (!res.ok) throw new Error('Failed to fetch aliases from Satellite');

            const data = await res.json();

            // Separate regular aliases from ambiguous symbols
            this.ambiguousMap = data._ambiguous_symbols || {};
            delete data._ambiguous_symbols;
            delete data._comment;

            this.aliasMap = data;
            this.lastFetch = Date.now();

            // Persist to localStorage for offline access
            try {
                localStorage.setItem(ScoutAliasServiceClass.CACHE_KEY, JSON.stringify({
                    data: this.aliasMap,
                    timestamp: this.lastFetch
                }));
                localStorage.setItem(ScoutAliasServiceClass.AMBIGUOUS_CACHE_KEY, JSON.stringify({
                    data: this.ambiguousMap,
                    timestamp: this.lastFetch
                }));
            } catch { /* Ignore storage errors */ }

            console.log(`[SCOUT_ALIAS] ✅ Refreshed ${Object.keys(this.aliasMap).length} aliases, ${Object.keys(this.ambiguousMap).length} ambiguous symbols.`);
        } catch (error: any) {
            console.warn('[SCOUT_ALIAS] ⚠️ Satellite down, using local cache:', error.message);
            this.loadFromCache();
        }
    }

    /**
     * Load aliases from localStorage if available.
     */
    private loadFromCache(): void {
        try {
            const cached = localStorage.getItem(ScoutAliasServiceClass.CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                this.aliasMap = data;
                this.lastFetch = timestamp;
            }

            const ambiguousCached = localStorage.getItem(ScoutAliasServiceClass.AMBIGUOUS_CACHE_KEY);
            if (ambiguousCached) {
                const { data } = JSON.parse(ambiguousCached);
                this.ambiguousMap = data;
            }
        } catch { /* Ignore */ }
    }

    /**
     * Ensure the cache is fresh before performing lookups.
     */
    private async ensureFresh(): Promise<void> {
        const cacheAge = Date.now() - this.lastFetch;
        if (cacheAge > ScoutAliasServiceClass.CACHE_DURATION || Object.keys(this.aliasMap).length === 0) {
            await this.refresh();
        }
    }

    /**
     * Get the CoinGecko ID for a symbol.
     * Returns null if no alias exists (caller should fallback to default resolution).
     */
    async getCoinGeckoId(symbol: string): Promise<string | null> {
        await this.ensureFresh();
        const entry = this.aliasMap[symbol.toUpperCase()];
        return entry?.coingeckoId || null;
    }

    /**
     * Get the CoinMarketCap slug for a symbol.
     */
    async getCMCSlug(symbol: string): Promise<string | null> {
        await this.ensureFresh();
        const entry = this.aliasMap[symbol.toUpperCase()];
        return entry?.cmcSlug || null;
    }

    /**
     * Get the full alias entry for a symbol (for UI display or debugging).
     */
    async getEntry(symbol: string): Promise<AliasEntry | null> {
        await this.ensureFresh();
        return this.aliasMap[symbol.toUpperCase()] || null;
    }

    /**
     * Check if a symbol has a defined alias.
     */
    async hasAlias(symbol: string): Promise<boolean> {
        await this.ensureFresh();
        return symbol.toUpperCase() in this.aliasMap;
    }

    /**
     * NEW: Resolve a symbol with confidence level and disambiguation support.
     * 
     * Returns:
     * - confidence: 'high' if symbol is unambiguous and resolved
     * - confidence: 'ambiguous' if multiple tokens use this symbol
     * - alternatives: list of possible tokens if ambiguous
     * - requiresConfirmation: true if user should pick the correct token
     */
    async resolveWithConfidence(symbol: string): Promise<ResolutionResult> {
        await this.ensureFresh();

        const upperSymbol = symbol.toUpperCase();
        const existingAlias = this.aliasMap[upperSymbol];
        const ambiguousOptions = this.ambiguousMap[upperSymbol];

        // Case 1: User has already confirmed this symbol
        if (existingAlias?.confidence === 'user_confirmed') {
            return {
                confidence: 'high',
                primary: existingAlias,
                requiresConfirmation: false
            };
        }

        // Case 2: Symbol is in ambiguous list AND has multiple options
        if (ambiguousOptions && ambiguousOptions.length > 1) {
            return {
                confidence: 'ambiguous',
                primary: existingAlias || null,
                alternatives: ambiguousOptions,
                requiresConfirmation: true
            };
        }

        // Case 3: Symbol has a high-confidence alias
        if (existingAlias?.confidence === 'high') {
            return {
                confidence: 'high',
                primary: existingAlias,
                requiresConfirmation: false
            };
        }

        // Case 4: Symbol exists but confidence is medium/low
        if (existingAlias) {
            return {
                confidence: existingAlias.confidence as 'medium' | 'low' || 'medium',
                primary: existingAlias,
                alternatives: ambiguousOptions,
                requiresConfirmation: ambiguousOptions && ambiguousOptions.length > 0
            };
        }

        // Case 5: Unknown symbol - check if it's in ambiguous list with single option
        if (ambiguousOptions && ambiguousOptions.length === 1) {
            const single = ambiguousOptions[0];
            return {
                confidence: 'medium',
                primary: {
                    coingeckoId: single.coingeckoId,
                    cmcSlug: single.cmcSlug,
                    fullName: single.name,
                    chain: single.chain
                },
                requiresConfirmation: false
            };
        }

        // Case 6: Completely unknown symbol - low confidence
        return {
            confidence: 'low',
            primary: null,
            requiresConfirmation: false
        };
    }

    /**
     * NEW: Save user's token choice to aliases.
     * Called after user confirms disambiguation.
     */
    async saveUserChoice(symbol: string, choice: AmbiguousTokenOption): Promise<void> {
        // Update local cache
        this.aliasMap[symbol.toUpperCase()] = {
            coingeckoId: choice.coingeckoId,
            cmcSlug: choice.cmcSlug,
            fullName: choice.name,
            chain: choice.chain,
            confidence: 'user_confirmed'
        };

        // Persist to localStorage
        try {
            localStorage.setItem(ScoutAliasServiceClass.CACHE_KEY, JSON.stringify({
                data: this.aliasMap,
                timestamp: Date.now()
            }));
        } catch { /* Ignore */ }

        // Also update Satellite Scout (if available)
        try {
            await fetch(`${ScoutAliasServiceClass.SATELLITE_URL}/aliases/${symbol.toUpperCase()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coingeckoId: choice.coingeckoId,
                    cmcSlug: choice.cmcSlug,
                    fullName: choice.name,
                    chain: choice.chain,
                    confidence: 'user_confirmed'
                })
            });
            console.log(`[SCOUT_ALIAS] ✅ Saved user choice: ${symbol} → ${choice.name}`);
        } catch (error) {
            console.warn('[SCOUT_ALIAS] ⚠️ Could not sync choice to Satellite (offline?)');
        }
    }

    /**
     * NEW: Get ambiguous options for a symbol (for modal display).
     */
    async getAmbiguousOptions(symbol: string): Promise<AmbiguousTokenOption[]> {
        await this.ensureFresh();
        return this.ambiguousMap[symbol.toUpperCase()] || [];
    }

    /**
     * NEW: Check if a symbol is ambiguous (has multiple options).
     */
    async isAmbiguous(symbol: string): Promise<boolean> {
        await this.ensureFresh();
        const options = this.ambiguousMap[symbol.toUpperCase()];
        return options && options.length > 1;
    }
}

export const ScoutAliasService = new ScoutAliasServiceClass();
