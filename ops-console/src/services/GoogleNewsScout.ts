export interface ScoutInterception {
    id: string;
    title: string;
    link: string;
    source: string;
    pubDate: string;
    symbol: string;
}

class GoogleNewsScoutService {
    private baseUrl = 'https://news.google.com/rss/search';

    /**
     * "White Hat" Scout Mission:
     * Asks Google for the latest Twitter chatter about a token.
     * Query: "SYMBOL crypto site:twitter.com when:1h"
     */
    async getCreateInterceptions(symbol: string): Promise<ScoutInterception[]> {
        try {
            console.log(`[SCOUT] Intercepting comms for ${symbol} via Signal Corp Bridge...`);

            let text = '';
            // @ts-ignore
            if (typeof window.electronAPI !== 'undefined') {
                // @ts-ignore
                text = await window.electronAPI.scout.getGoogleNews(symbol);
            } else {
                // Browser Mode: Use Vite Proxy
                console.log(`[SCOUT] Browser Environment: Using Web Proxy for ${symbol}`);
                const response = await fetch(`/api/cryptopanic/news/rss/?currency=${symbol}`);
                if (response.ok) {
                    text = await response.text();
                }
            }

            if (!text) {
                console.warn(`[SCOUT] Signal lost for ${symbol} (Empty response from HQ)`);
                return [];
            }

            // Parse XML payload (CryptoPanic Format)
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const items = xmlDoc.querySelectorAll("item");

            const interceptions: ScoutInterception[] = [];

            items.forEach((item) => {
                const title = item.querySelector("title")?.textContent || "Encrypted Signal";
                const link = item.querySelector("link")?.textContent || "#";
                const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
                // CryptoPanic puts the source in the title or description, let's genericize it
                const source = "CryptoPanic Wire";

                interceptions.push({
                    id: crypto.randomUUID(),
                    source: source,
                    title: title,
                    link: link,
                    pubDate: pubDate,
                    symbol: symbol
                });
            });

            return interceptions.slice(0, 5); // Return top 5 recent comms

        } catch (error) {
            console.error(`[SCOUT] Mission Failed for ${symbol}:`, error);
            // Return empty array on failure - do not break the chain
            return [];
        }
    }
}

export const googleNewsScout = new GoogleNewsScoutService();
