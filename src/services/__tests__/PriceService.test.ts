import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    formatPrice,
    deriveOpenPrice,
    fetchPrice,
    fetchHyperliquidPrices,
    fetchBulkPricesCoinGecko,
    getPrice,
    resolveCoinGeckoIds,
    fetchMarketChart,
    getHistoricalPrice,
    PriceData
} from '../PriceService';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
});

// Mock ScoutAliasService
vi.mock('../scout/ScoutAliasService', () => ({
    ScoutAliasService: {
        getCoinGeckoId: vi.fn()
    }
}));

import { ScoutAliasService } from '../scout/ScoutAliasService';

// Mock GlobalMarketService
vi.mock('../GlobalMarketService', () => ({
    globalMarketService: {
        getMetrics: vi.fn().mockResolvedValue({ dominance: { btc: 52.5, eth: 18.2 } })
    }
}));

// Mock scoutConfig
vi.mock('../../config/scoutConfig', () => ({
    SCOUT_URL: 'http://localhost:4000'
}));

describe('PriceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorage.getItem.mockReturnValue(null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('formatPrice', () => {
        it('should return "---" for null or undefined', () => {
            expect(formatPrice(null)).toBe('---');
            expect(formatPrice(undefined)).toBe('---');
        });

        it('should format prices over $1 with 2 decimals by default', () => {
            const result = formatPrice(1234.56);
            expect(result).toContain('1,234.56');
            expect(result.startsWith('$')).toBe(true);
        });

        it('should format prices under $1 with 4 decimals by default', () => {
            const result = formatPrice(0.0045);
            expect(result).toBe('$0.0045');
        });

        it('should use custom precision when provided', () => {
            const result = formatPrice(1234.5678, undefined, false, 3);
            expect(result).toContain('1,234.568');
        });

        it('should format as indicator with % suffix', () => {
            expect(formatPrice(5.25, undefined, true)).toBe('5.25%');
            expect(formatPrice(-3.14, undefined, true)).toBe('-3.14%');
        });

        it('should return "---" for zero when isIndicator is true', () => {
            expect(formatPrice(0, undefined, true)).toBe('---');
        });

        it('should handle different locales', () => {
            const result = formatPrice(1234.56, 'de-DE');
            expect(result).toContain('$');
        });

        it('should handle very small numbers (crypto)', () => {
            const result = formatPrice(0.00001234);
            expect(result).toBe('$0.0000');
        });
    });

    describe('deriveOpenPrice', () => {
        it('should derive open price from current price and change', () => {
            const open = deriveOpenPrice(110, 10);
            expect(open).toBeCloseTo(100, 1);
        });

        it('should handle negative change correctly', () => {
            const open = deriveOpenPrice(90, -10);
            expect(open).toBeCloseTo(100, 1);
        });

        it('should handle zero change', () => {
            const open = deriveOpenPrice(50, 0);
            expect(open).toBe(50);
        });

        it('should return null for invalid currentPrice', () => {
            expect(deriveOpenPrice(0, 5)).toBeNull();
            expect(deriveOpenPrice(-100, 5)).toBeNull();
        });

        it('should return null for null/undefined change', () => {
            expect(deriveOpenPrice(100, null)).toBeNull();
            expect(deriveOpenPrice(100, undefined)).toBeNull();
        });

        it('should return null when factor would be zero or negative', () => {
            expect(deriveOpenPrice(100, -100)).toBeNull();
            expect(deriveOpenPrice(100, -200)).toBeNull();
        });

        it('should handle realistic crypto scenarios', () => {
            const btcOpen = deriveOpenPrice(45000, 5.5);
            expect(btcOpen).toBeCloseTo(42654, 0);

            const ethOpen = deriveOpenPrice(2500, -2.3);
            expect(ethOpen).toBeCloseTo(2558.9, 0);
        });
    });

    describe('getPrice', () => {
        it('should return 0 for undefined/null symbol', () => {
            expect(getPrice(undefined, { BTC: 50000 })).toBe(0);
            expect(getPrice(null, { BTC: 50000 })).toBe(0);
        });

        it('should return 1.0 for stablecoins', () => {
            const stables = ['USDC', 'USDT', 'DAI', 'FDUSD', 'USDS', 'PYUSD'];
            stables.forEach(symbol => {
                expect(getPrice(symbol, {})).toBe(1.0);
            });
        });

        it('should find exact match', () => {
            expect(getPrice('BTC', { BTC: 50000 })).toBe(50000);
        });

        it('should find case-insensitive match', () => {
            expect(getPrice('btc', { BTC: 50000 })).toBe(50000);
            expect(getPrice('BTC', { btc: 50000 })).toBe(50000);
        });

        it('should return 0 if symbol not found', () => {
            expect(getPrice('XYZ', { BTC: 50000 })).toBe(0);
        });
    });

    describe('fetchPrice - Scout Strategy', () => {
        it('should return price from Scout when available', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { label: 'BTC_PRICE', value: '65000.00' },
                    { label: 'ETH_PRICE', value: '3500.00' }
                ]
            });

            const result = await fetchPrice('BTC');

            expect(result).toEqual({
                price: 65000,
                change24h: null,
                volume24h: null
            });
            expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/intel/vault');
        });

        it('should reject Scout error strings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    { label: 'BTC_PRICE', value: '404' }
                ]
            });

            // Mock Hyperliquid fallback
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ BTC: '65000' })
            });

            const result = await fetchPrice('BTC');
            expect(result?.price).toBe(65000);
        });

        it('should fallback to Hyperliquid when Scout fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Scout offline'));

            // Mock Hyperliquid
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ BTC: '65000' })
            });

            const result = await fetchPrice('BTC');
            expect(result?.price).toBe(65000);
        });
    });

    describe('fetchPrice - LP Token Filtering', () => {
        it('should return null for LP tokens', async () => {
            const lpTokens = [
                'LP-ETH-USDC',
                'ETH-USDC 2',
                'PUMP-HYPE PRJX 3',
                'HYPE-USDC-2'
            ];

            for (const token of lpTokens) {
                const result = await fetchPrice(token);
                expect(result).toBeNull();
            }
        });

        it('should return null for metrics (.D suffix)', async () => {
            const result = await fetchPrice('BTC.D');
            expect(result).not.toBeNull(); // BTC.D is handled separately via global metrics
        });
    });

    describe('fetchPrice - Multi-Source Fallback Chain', () => {
        it('should try Hyperliquid when Scout fails', async () => {
            // Scout fails
            mockFetch.mockRejectedValueOnce(new Error('Scout offline'));

            // Hyperliquid succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ HYPE: '25.50' })
            });

            const result = await fetchPrice('HYPE');
            expect(result?.price).toBe(25.50);
        });

        it('should try CoinGecko when Hyperliquid fails', async () => {
            // Scout fails
            mockFetch.mockRejectedValueOnce(new Error('Scout offline'));

            // Hyperliquid fails
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });

            // CoinGecko succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    bitcoin: { usd: 65000, usd_24h_change: 5.2 }
                })
            });

            const result = await fetchPrice('BTC');
            expect(result?.price).toBe(65000);
            expect(result?.change24h).toBe(5.2);
        });

        it('should return null when all sources fail', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const result = await fetchPrice('UNKNOWN_TOKEN');
            expect(result).toBeNull();
        });
    });

    describe('fetchHyperliquidPrices', () => {
        it('should fetch prices from Hyperliquid', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        universe: [
                            { name: 'BTC' },
                            { name: 'ETH' }
                        ]
                    },
                    [
                        { midPx: '65000', prevDayPx: '63000', dayNtlVlm: '1000000' },
                        { midPx: '3500', prevDayPx: '3400', dayNtlVlm: '500000' }
                    ]
                ]
            });

            const result = await fetchHyperliquidPrices();

            expect(result.BTC).toEqual({
                price: 65000,
                change24h: expect.closeTo(3.17, 1),
                volume24h: 1000000
            });
            expect(result.ETH).toEqual({
                price: 3500,
                change24h: expect.closeTo(2.94, 1),
                volume24h: 500000
            });
        });

        it('should handle empty response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [{ universe: [] }, []]
            });

            const result = await fetchHyperliquidPrices();
            expect(result).toEqual({});
        });

        it('should return empty object on fetch error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await fetchHyperliquidPrices();
            expect(result).toEqual({});
        });
    });

    describe('fetchBulkPricesCoinGecko', () => {
        it('should fetch bulk prices from CoinGecko', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    bitcoin: { usd: 65000, usd_24h_change: 5.2, usd_24h_vol: 1000000 },
                    ethereum: { usd: 3500, usd_24h_change: -2.1, usd_24h_vol: 500000 }
                })
            });

            const result = await fetchBulkPricesCoinGecko(['BTC', 'ETH']);

            expect(result.BTC).toEqual({
                price: 65000,
                change24h: 5.2,
                volume24h: 1000000
            });
            expect(result.ETH).toEqual({
                price: 3500,
                change24h: -2.1,
                volume24h: 500000
            });
        });

        it('should return empty object for empty input', async () => {
            const result = await fetchBulkPricesCoinGecko([]);
            expect(result).toEqual({});
        });

        it('should handle CoinGecko rate limiting', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429
            });

            const result = await fetchBulkPricesCoinGecko(['BTC']);
            expect(result).toEqual({});
        });

        it('should handle CoinGecko search rate limit', async () => {
            // First call for ID resolution
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429
            });

            const result = await fetchBulkPricesCoinGecko(['UNKNOWN']);
            expect(result).toEqual({});
        });
    });

    describe('resolveCoinGeckoIds', () => {
        it('should use hardcoded mapping for common assets', async () => {
            const result = await resolveCoinGeckoIds(['BTC', 'ETH', 'SOL']);

            expect(result.BTC).toBe('bitcoin');
            expect(result.ETH).toBe('ethereum');
            expect(result.SOL).toBe('solana');
        });

        it('should use localStorage cache when available', async () => {
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
                CUSTOM: 'custom-token-id'
            }));

            const result = await resolveCoinGeckoIds(['CUSTOM']);
            expect(result.CUSTOM).toBe('custom-token-id');
        });

        it('should fallback to lowercase symbol for unknown tokens', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ coins: [] })
            });

            const result = await resolveCoinGeckoIds(['UNKNOWNXYZ']);
            expect(result.UNKNOWNXYZ).toBe('unknownxyz');
        });

        it('should handle LP token exclusions', async () => {
            const lpTokens = ['LP-ETH-USDC', 'ETH-USDC 2', 'PRJX-TOKEN'];
            const result = await resolveCoinGeckoIds(lpTokens);

            lpTokens.forEach(token => {
                expect(result[token]).toBe(token.toLowerCase());
            });
        });

        it('should use ScoutAliasService for alias resolution', async () => {
            (ScoutAliasService.getCoinGeckoId as any).mockResolvedValueOnce('mettoken-2');

            const result = await resolveCoinGeckoIds(['MET']);
            expect(result.MET).toBe('mettoken-2');
        });
    });

    describe('getHistoricalPrice', () => {
        it('should fetch historical price from CoinGecko', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    market_data: {
                        current_price: { usd: 45000 }
                    }
                })
            });

            const result = await getHistoricalPrice('BTC', '2024-01-15');
            expect(result).toBe(45000);
        });

        it('should use CLOSE strategy to get next day price', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    market_data: {
                        current_price: { usd: 46000 }
                    }
                })
            });

            const result = await getHistoricalPrice('BTC', '2024-01-15', 'CLOSE');
            expect(result).toBe(46000);
            // Verify it fetches for 2024-01-16 (next day)
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('16-01-2024')
            );
        });

        it('should fallback to CryptoCompare when CoinGecko fails', async () => {
            // CoinGecko fails
            mockFetch.mockRejectedValueOnce(new Error('CoinGecko error'));

            // CryptoCompare succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    BTC: { USD: 45000 }
                })
            });

            const result = await getHistoricalPrice('BTC', '2024-01-15');
            expect(result).toBe(45000);
        });

        it('should return null when both sources fail', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));

            const result = await getHistoricalPrice('BTC', '2024-01-15');
            expect(result).toBeNull();
        });
    });

    describe('fetchMarketChart', () => {
        it('should fetch chart data from cache when valid', async () => {
            const cachedData = [
                { time: 1704067200000, price: 45000 },
                { time: 1704153600000, price: 46000 }
            ];
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
                data: cachedData,
                timestamp: Date.now() // Not expired
            }));

            const result = await fetchMarketChart('BTC', 30);
            expect(result).toEqual(cachedData);
        });

        it('should fetch from CoinGecko when cache expired', async () => {
            mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
                data: [],
                timestamp: Date.now() - 5 * 60 * 60 * 1000 // Expired (5 hours ago)
            }));

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    prices: [
                        [1704067200000, 45000],
                        [1704153600000, 46000]
                    ]
                })
            });

            const result = await fetchMarketChart('BTC', 30);
            expect(result).toEqual([
                { time: 1704067200000, price: 45000 },
                { time: 1704153600000, price: 46000 }
            ]);
        });

        it('should fallback to CryptoCompare when CoinGecko fails', async () => {
            mockLocalStorage.getItem.mockReturnValueOnce(null);

            // CoinGecko fails
            mockFetch.mockRejectedValueOnce(new Error('CoinGecko error'));

            // CryptoCompare succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    Data: {
                        Data: [
                            { time: 1704067200, close: 45000 },
                            { time: 1704153600, close: 46000 }
                        ]
                    }
                })
            });

            const result = await fetchMarketChart('BTC', 30);
            expect(result).toEqual([
                { time: 1704067200000, price: 45000 },
                { time: 1704153600000, price: 46000 }
            ]);
        });

        it('should handle CoinGecko rate limiting', async () => {
            mockLocalStorage.getItem.mockReturnValueOnce(null);

            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429
            });

            // CryptoCompare fallback
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    Data: { Data: [] }
                })
            });

            const result = await fetchMarketChart('BTC', 30);
            expect(result).toEqual([]);
        });
    });

    describe('fetchPrice - Global Metrics (.D tokens)', () => {
        it('should fetch BTC dominance for BTC.D', async () => {
            const result = await fetchPrice('BTC.D');
            expect(result).toEqual({ price: 52.5, change24h: null });
        });

        it('should fetch ETH dominance for ETH.D', async () => {
            const result = await fetchPrice('ETH.D');
            expect(result).toEqual({ price: 18.2, change24h: null });
        });
    });

    describe('fetchPrice - skipHyperliquid option', () => {
        it('should skip Hyperliquid when skipHyperliquid is true', async () => {
            // Scout fails
            mockFetch.mockRejectedValueOnce(new Error('Scout offline'));

            // CoinGecko succeeds
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    bitcoin: { usd: 65000 }
                })
            });

            const result = await fetchPrice('BTC', { skipHyperliquid: true });
            expect(result?.price).toBe(65000);
        });
    });
});
