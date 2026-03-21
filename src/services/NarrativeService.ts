
export interface AssetNarrative {
    symbol: string;
    description: string;
    categories: string[];
    contract?: string;
    links?: {
        homepage?: string;
        twitter?: string;
    };
    lastUpdated: number;
}

export const NarrativeService = {
    cache: new Map<string, AssetNarrative>(),

    /**
     * Resolves an asset's identity (Description, Categories).
     */
    async resolveIdentity(symbol: string): Promise<AssetNarrative | null> {
        // 1. Check Memory Cache
        if (this.cache.has(symbol)) return this.cache.get(symbol)!;

        // 2. Fetch from CoinGecko (Search -> Details)
        // Note: For a production app, we would cache this in IDB.
        try {
            // A. Search for ID
            const searchRes = await fetch(`https://api.coingecko.com/api/v3/search?query=${symbol}`);
            const searchData = await searchRes.json();

            const coin = searchData.coins?.find((c: any) => c.symbol.toUpperCase() === symbol.toUpperCase());
            if (!coin) return null;

            // B. Get Details (Description, Categories)
            // Using ?localization=false&tickers=false&market_data=false to save bandwidth
            const detailRes = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`);
            const details = await detailRes.json();

            const narrative: AssetNarrative = {
                symbol: symbol.toUpperCase(),
                description: details.description?.en ? this.truncateDescription(details.description.en) : "No description available.",
                categories: details.categories || [],
                contract: details.platforms?.ethereum || details.platforms?.solana || undefined,
                links: {
                    homepage: details.links?.homepage?.[0],
                    twitter: details.links?.twitter_screen_name ? `https://twitter.com/${details.links.twitter_screen_name}` : undefined
                },
                lastUpdated: Date.now()
            };

            this.cache.set(symbol, narrative);
            return narrative;

        } catch (e) {
            console.warn(`[NarrativeService] Failed to resolve identity for ${symbol}`, e);
            return null;
        }
    },

    truncateDescription(desc: string): string {
        // Remove HTML tags and truncate to ~3 sentences
        const stripped = desc.replace(/<[^>]*>?/gm, '');
        const sentences = stripped.split('. ');
        return sentences.slice(0, 3).join('. ') + '.';
    }
}
