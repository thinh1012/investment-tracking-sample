import { describe, it, expect } from 'vitest';
import { calculateAssets, calculatePortfolioHistory } from '../portfolioCalculator';
import { Transaction } from '../../types';

describe('portfolioCalculator', () => {
    describe('calculateAssets', () => {
        it('should calculate assets from a single DEPOSIT', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 10,
                    pricePerUnit: 2500,
                    notes: ''
                }
            ];

            const prices = { 'ETH': 3000 };
            const assets = calculateAssets(transactions, prices);

            expect(assets.length).toBe(1);
            const eth = assets[0];
            expect(eth.symbol).toBe('ETH');
            expect(eth.quantity).toBe(10);
            expect(eth.totalInvested).toBe(25000); // 10 * 2500
            expect(eth.averageBuyPrice).toBe(2500);
            expect(eth.currentPrice).toBe(3000);
            expect(eth.currentValue).toBe(30000); // 10 * 3000
            expect(eth.unrealizedPnL).toBe(5000); // 30000 - 25000
            expect(eth.pnlPercentage).toBeCloseTo(20, 1); // 5000 / 25000 * 100
        });

        it('should handle multiple DEPOSITs with DCA calculation', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 40000,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 50000,
                    notes: ''
                }
            ];

            const prices = { 'BTC': 48000 };
            const assets = calculateAssets(transactions, prices);

            const btc = assets.find(a => a.symbol === 'BTC')!;
            expect(btc.quantity).toBe(2);
            expect(btc.totalInvested).toBe(90000); // 40000 + 50000
            expect(btc.averageBuyPrice).toBe(45000); // 90000 / 2
        });

        it('should handle INTEREST (rewards) correctly', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE',
                    amount: 100,
                    pricePerUnit: 20,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'INTEREST',
                    assetSymbol: 'HYPE',
                    amount: 5,
                    notes: ''
                }
            ];

            const prices = { 'HYPE': 25 };
            const assets = calculateAssets(transactions, prices);

            const hype = assets.find(a => a.symbol === 'HYPE')!;
            expect(hype.quantity).toBe(105); // 100 + 5
            expect(hype.earnedQuantity).toBe(5);
            expect(hype.totalInvested).toBe(2000); // Only the deposit, not rewards
        });

        it('should handle WITHDRAWAL correctly', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'SOL',
                    amount: 50,
                    pricePerUnit: 100,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'SOL',
                    amount: 20,
                    notes: ''
                }
            ];

            const prices = { 'SOL': 120 };
            const assets = calculateAssets(transactions, prices);

            const sol = assets.find(a => a.symbol === 'SOL')!;
            expect(sol.quantity).toBe(30); // 50 - 20
            // totalInvested should be proportionally reduced
            expect(sol.totalInvested).toBe(3000); // 5000 - (20 * 100)
        });

        it('should handle full WITHDRAWAL (zero quantity)', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'DOGE',
                    amount: 1000,
                    pricePerUnit: 0.1,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'DOGE',
                    amount: 1000,
                    notes: ''
                }
            ];

            const prices = { 'DOGE': 0.15 };
            const assets = calculateAssets(transactions, prices);

            // Asset should be filtered out since quantity is 0
            expect(assets.find(a => a.symbol === 'DOGE')).toBeUndefined();
        });

        it('should handle stablecoins with default price 1', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'USDC',
                    amount: 5000,
                    notes: ''
                }
            ];

            const prices = { 'USDC': 1 };
            const assets = calculateAssets(transactions, prices);

            const usdc = assets.find(a => a.symbol === 'USDC')!;
            expect(usdc.quantity).toBe(5000);
            expect(usdc.totalInvested).toBe(5000);
            expect(usdc.currentValue).toBe(5000);
        });

        it('should apply asset overrides for avgBuyPrice', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 5,
                    pricePerUnit: 2000,
                    notes: ''
                }
            ];

            const prices = { 'ETH': 3000 };
            const overrides = { 'ETH': { avgBuyPrice: 1800 } };
            const assets = calculateAssets(transactions, prices, overrides);

            const eth = assets[0];
            expect(eth.averageBuyPrice).toBe(1800); // Overridden
            expect(eth.totalInvested).toBe(9000); // Recalculated: 5 * 1800
        });

        it('should handle compounded deposits correctly', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE',
                    amount: 100,
                    pricePerUnit: 20,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE',
                    amount: 10,
                    pricePerUnit: 22,
                    isCompound: true,
                    notes: 'Compounded from rewards'
                }
            ];

            const prices = { 'HYPE': 25 };
            const assets = calculateAssets(transactions, prices);

            const hype = assets.find(a => a.symbol === 'HYPE')!;
            expect(hype.quantity).toBe(110);
            expect(hype.totalInvested).toBe(2000); // Only original deposit
            expect(hype.compoundedPrincipal).toBe(220); // 10 * 22
        });
    });

    describe('calculatePortfolioHistory', () => {
        it('should generate invested history from transactions', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 5,
                    pricePerUnit: 2000,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 0.5,
                    pricePerUnit: 40000,
                    notes: ''
                }
            ];

            const prices = { 'ETH': 2500, 'BTC': 45000 };
            const history = calculatePortfolioHistory(transactions, prices);

            expect(history.invested.length).toBeGreaterThanOrEqual(2);
            // After first deposit: 10000
            const day1 = history.invested.find(h => h.date === '2024-01-15');
            expect(day1?.value).toBe(10000);
            // After second deposit: 10000 + 20000 = 30000
            const day2 = history.invested.find(h => h.date === '2024-01-20');
            expect(day2?.value).toBe(30000);
        });

        it('should track earnings history', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE',
                    amount: 100,
                    pricePerUnit: 20,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'INTEREST',
                    assetSymbol: 'HYPE',
                    amount: 5,
                    notes: ''
                }
            ];

            const prices = { 'HYPE': 25 };
            const history = calculatePortfolioHistory(transactions, prices);

            // Earnings should be valued at current price
            const earningsAtEnd = history.earnings[history.earnings.length - 1];
            expect(earningsAtEnd.value).toBe(125); // 5 * 25
        });

        it('should handle empty transactions', () => {
            const history = calculatePortfolioHistory([], {});
            expect(history.invested).toEqual([]);
            expect(history.earnings).toEqual([]);
        });

        it('should exclude compounded deposits from invested history', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 5,
                    pricePerUnit: 2000,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 0.5,
                    pricePerUnit: 2200,
                    isCompound: true,
                    notes: 'Compounded'
                }
            ];

            const prices = { 'ETH': 2500 };
            const history = calculatePortfolioHistory(transactions, prices);

            // Invested should only count non-compound deposits
            const lastInvested = history.invested[history.invested.length - 1];
            expect(lastInvested.value).toBe(10000); // Only the original 5 * 2000
        });
    });
});
