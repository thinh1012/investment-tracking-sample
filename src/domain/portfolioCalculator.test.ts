
import { describe, it, expect } from 'vitest';
import { calculateAssets, calculatePortfolioHistory } from './portfolioCalculator';
import { Transaction } from '../types';

describe('portfolioCalculator', () => {

    // --- Asset Calculation Tests ---
    describe('calculateAssets', () => {
        it('should correctly sum up simple deposits', () => {
            const txs: Partial<Transaction>[] = [
                { id: '1', type: 'DEPOSIT', amount: 100, pricePerUnit: 1, assetSymbol: 'USDC', date: '2023-01-01' },
                { id: '2', type: 'DEPOSIT', amount: 50, pricePerUnit: 1, assetSymbol: 'USDC', date: '2023-01-02' }
            ];
            const prices = { 'USDC': 1.0 };
            const assets = calculateAssets(txs as Transaction[], prices);

            expect(assets).toHaveLength(1);
            expect(assets[0].symbol).toBe('USDC');
            expect(assets[0].quantity).toBe(150);
            expect(assets[0].totalInvested).toBe(150);
        });

        it('should calculate weighted average buy price', () => {
            const txs: Partial<Transaction>[] = [
                { id: '1', type: 'DEPOSIT', amount: 10, pricePerUnit: 100, assetSymbol: 'ETH', date: '2023-01-01' }, // $1000
                { id: '2', type: 'DEPOSIT', amount: 10, pricePerUnit: 200, assetSymbol: 'ETH', date: '2023-01-02' }  // $2000
            ];
            // Total Invested: 3000, Total Qty: 20 -> Avg Price: 150
            const prices = { 'ETH': 300 };
            const assets = calculateAssets(txs as Transaction[], prices);

            expect(assets[0].averageBuyPrice).toBe(150);
            expect(assets[0].totalInvested).toBe(3000);
            expect(assets[0].currentValue).toBe(6000); // 20 * 300
        });

        it('should handle withdrawals correctly (reduce quantity and invested amount)', () => {
            const txs: Partial<Transaction>[] = [
                { id: '1', type: 'DEPOSIT', amount: 10, pricePerUnit: 100, assetSymbol: 'ETH', date: '2023-01-01' },
                { id: '2', type: 'WITHDRAWAL', amount: 5, assetSymbol: 'ETH', date: '2023-01-02' }
            ];
            const prices = { 'ETH': 200 };
            const assets = calculateAssets(txs as Transaction[], prices);

            expect(assets[0].quantity).toBe(5);
            // Avg price was 100. Withdrew 5 * 100 = 500 value. Remaining invested = 500.
            expect(assets[0].totalInvested).toBe(500);
            expect(assets[0].averageBuyPrice).toBe(100);
        });

        it('should deduct stablecoin balance when used as payment', () => {
            const txs: Partial<Transaction>[] = [
                { id: '1', type: 'DEPOSIT', amount: 1000, pricePerUnit: 1, assetSymbol: 'USDC', date: '2023-01-01' },
                {
                    id: '2', type: 'DEPOSIT', amount: 1, pricePerUnit: 100, assetSymbol: 'SOL', date: '2023-01-02',
                    paymentCurrency: 'USDC', paymentAmount: 100
                }
            ];
            const prices = { 'USDC': 1, 'SOL': 150 };
            const assets = calculateAssets(txs as Transaction[], prices);

            const usdc = assets.find(a => a.symbol === 'USDC');
            const sol = assets.find(a => a.symbol === 'SOL');

            expect(usdc).toBeDefined();
            expect(usdc?.quantity).toBe(900); // 1000 - 100
            expect(usdc?.totalInvested).toBe(900);

            expect(sol).toBeDefined();
            expect(sol?.quantity).toBe(1);
            expect(sol?.totalInvested).toBe(100);
        });
    });

    // --- History Calculation Tests ---
    describe('calculatePortfolioHistory', () => {
        it('should generate daily history points', () => {
            const txs: Partial<Transaction>[] = [
                { id: '1', type: 'DEPOSIT', amount: 100, pricePerUnit: 1, assetSymbol: 'USDC', date: '2023-01-01' },
                { id: '2', type: 'DEPOSIT', amount: 50, pricePerUnit: 1, assetSymbol: 'USDC', date: '2023-01-03' }
            ];
            const prices = { 'USDC': 1.0 };

            const history = calculatePortfolioHistory(txs as Transaction[], prices);

            // Should have points for 2023-01-01, 2023-01-03, and possibly Today
            const p1 = history.invested.find(h => h.date === '2023-01-01');
            const p2 = history.invested.find(h => h.date === '2023-01-03');

            expect(p1?.value).toBe(100);
            expect(p2?.value).toBe(150);
        });
    });
});
