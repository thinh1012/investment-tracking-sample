import { initDB } from './database/core';
import { ScoutSource } from './database/types';

export class ScoutSourceService {
    private static SEED_SOURCES: Partial<ScoutSource>[] = [
        {
            name: 'Hyperliquid (HYPE) DefiLlama',
            url: 'https://defillama.com/chain/hyperliquid-l1',
            category: 'CHAIN',
            tags: ['hype', 'hyperliquid']
        },
        {
            name: 'SUI DefiLlama',
            url: 'https://defillama.com/chain/sui',
            category: 'CHAIN',
            tags: ['sui']
        },
        {
            name: 'Solana DefiLlama',
            url: 'https://defillama.com/chain/solana',
            category: 'CHAIN',
            tags: ['solana']
        },
        {
            name: 'Ethereum DefiLlama',
            url: 'https://defillama.com/chain/ethereum',
            category: 'CHAIN',
            tags: ['ethereum']
        },
        {
            name: 'YieldBasis (CMC)',
            url: 'https://coinmarketcap.com/currencies/yieldbasis/',
            category: 'YIELD',
            tags: ['yield', 'cmc']
        },
        {
            name: 'Pump.fun (CMC)',
            url: 'https://coinmarketcap.com/currencies/pump-fun/',
            category: 'SENTIMENT',
            tags: ['memecoins', 'cmc']
        },
        {
            name: 'USDT Dominance (TV)',
            url: 'https://www.tradingview.com/symbols/USDT.D/',
            category: 'GLOBAL',
            tags: ['dominance', 'usdt']
        },
        {
            name: 'USDC Dominance (TV)',
            url: 'https://www.tradingview.com/symbols/USDC.D/',
            category: 'GLOBAL',
            tags: ['dominance', 'usdc']
        },
        {
            name: 'Altcoin Dominance (OTHERS)',
            url: 'https://www.tradingview.com/symbols/OTHERS/',
            category: 'GLOBAL',
            tags: ['dominance', 'others']
        },
        {
            name: 'Orderbook Stats (Coinglass)',
            url: 'https://www.coinglass.com/large-orderbook-statistics',
            category: 'GLOBAL',
            tags: ['orderbook', 'macro']
        },
        {
            name: 'Global DeFi Market Cap (Llama)',
            url: 'https://api.llama.fi/charts',
            category: 'GLOBAL',
            tags: ['defi', 'marketcap']
        },
        {
            name: 'Global DeFi Volume (Llama)',
            url: 'https://api.llama.fi/summary/dexs/all?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true',
            category: 'GLOBAL',
            tags: ['defi', 'volume']
        },
        {
            name: 'Global Crypto Market Stats (CG)',
            url: 'https://api.coingecko.com/api/v3/global',
            category: 'GLOBAL',
            tags: ['crypto', 'macro']
        },
        // [ETF_INTELLIGENCE] Coinglass ETF Flow Sources
        {
            name: 'Bitcoin ETF (Coinglass)',
            url: 'https://www.coinglass.com/bitcoin-etf',
            category: 'GLOBAL',
            tags: ['etf', 'btc', 'inflow'],
            targetSelector: '.ant-table-row',
            captureDelay: 8,
            randomFactor: 3
        },
        {
            name: 'Ethereum ETF (Coinglass)',
            url: 'https://www.coinglass.com/etf/ethereum',
            category: 'GLOBAL',
            tags: ['etf', 'eth', 'inflow'],
            targetSelector: '.ant-table-row',
            captureDelay: 8,
            randomFactor: 3
        },
        {
            name: 'Solana ETF (Coinglass)',
            url: 'https://www.coinglass.com/sol-etf',
            category: 'GLOBAL',
            tags: ['etf', 'sol', 'inflow'],
            targetSelector: '.ant-table-row',
            captureDelay: 8,
            randomFactor: 3
        }
    ];

    static async getAll(): Promise<ScoutSource[]> {
        const db = await initDB();
        const sources = await db.getAll('scout_sources');

        // [ADDITIVE_SEED]: Ensure missing industry targets are auto-injected
        const normalize = (url: string) => url.replace(/\/$/, '').toLowerCase();
        const existingUrls = new Set(sources.map(s => normalize(s.url)));
        const missingSeeds = this.SEED_SOURCES.filter(s => !existingUrls.has(normalize(s.url as string)));

        if (missingSeeds.length > 0) {
            console.log(`[SCOUT_SOURCE] Found ${missingSeeds.length} missing industry targets. Injecting...`);
            for (const seed of missingSeeds) {
                await this.addSource(seed as any);
            }
            return db.getAll('scout_sources');
        }

        return sources;
    }

    static async addSource(source: Omit<ScoutSource, 'id' | 'createdAt'>): Promise<string> {
        const db = await initDB();
        const id = crypto.randomUUID();
        const newSource: ScoutSource = {
            ...source,
            id,
            createdAt: Date.now()
        };
        await db.put('scout_sources', newSource);
        return id;
    }

    static async updateSource(source: ScoutSource): Promise<void> {
        const db = await initDB();
        await db.put('scout_sources', source);
    }

    static async removeSource(id: string): Promise<void> {
        const db = await initDB();
        await db.delete('scout_sources', id);
    }

    static async getByCategory(category: ScoutSource['category']): Promise<ScoutSource[]> {
        const db = await initDB();
        return db.getAllFromIndex('scout_sources', 'by-category', category);
    }

    private static async seed() {
        // Handled by getAll additive logic
        await this.getAll();
    }

    /**
     * Integrates links from user_note.txt into the trusted sources DB.
     */
    static async syncFromNotes(text: string) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);

        if (!matches) return;

        const existing = await this.getAll();
        const existingUrls = new Set(existing.map(s => s.url));

        for (const url of matches) {
            if (!existingUrls.has(url)) {
                // Infer potential name/tags
                let name = 'Imported Source';
                let tags: string[] = [];

                if (url.includes('defillama.com/chain/')) {
                    const slug = url.split('/').pop();
                    name = `${slug?.toUpperCase()} Data`;
                    tags = [slug || ''];
                }

                await this.addSource({
                    name,
                    url,
                    category: 'CHAIN',
                    tags
                });
                console.log(`[SCOUT_SOURCE] Auto-synced new source: ${url}`);
            }
        }
    }
}
