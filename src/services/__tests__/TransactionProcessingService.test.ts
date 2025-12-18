import { describe, it, expect, vi } from 'vitest';
import { TransactionProcessingService } from '../TransactionProcessingService';
import { Asset } from '../../types';

describe('TransactionProcessingService', () => {
    const mockAssets: Asset[] = [
        { symbol: 'ETH', quantity: 1, totalInvested: 2000, averageBuyPrice: 2000, currentPrice: 2500, currentValue: 2500, unrealizedPnL: 500, pnlPercentage: 25, rewardTokens: [] },
        { symbol: 'BTC', quantity: 0.5, totalInvested: 20000, averageBuyPrice: 40000, currentPrice: 50000, currentValue: 25000, unrealizedPnL: 5000, pnlPercentage: 25, rewardTokens: [] }
    ];

    describe('processLpFunding', () => {
        it('should correctly calculate cost basis for fresh-only funding', () => {
            const result = TransactionProcessingService.processLpFunding({
                date: '2023-01-01',
                lpSymbol: 'LP-ETH-USDT',
                tokenA: { symbol: 'ETH', amount: '0.1' },
                sourceA: 'FRESH',
                fundingSourceA: '',
                tokenB: { symbol: 'USDT', amount: '200' },
                sourceB: 'FRESH',
                fundingSourceB: '',
                assets: mockAssets,
                freshCapitalAmount: 400, // 0.1 ETH @ 2000 + 200 USDT
                lpTransactionId: 'lp-123'
            });

            expect(result.finalCostBasis).toBe(400);
            expect(result.transactions).toHaveLength(0);
            expect(result.description).toContain('0.1 ETH (Fresh)');
            expect(result.description).toContain('200 USDT (Fresh)');
        });

        it('should generate withdrawals and calculate cost basis for holdings-based funding', () => {
            const result = TransactionProcessingService.processLpFunding({
                date: '2023-01-01',
                lpSymbol: 'LP-ETH-WBTC',
                tokenA: { symbol: 'ETH', amount: '0.5' },
                sourceA: 'HOLDINGS',
                fundingSourceA: 'ETH',
                tokenB: { symbol: 'BTC', amount: '0.01' },
                sourceB: 'FRESH',
                fundingSourceB: '',
                assets: mockAssets,
                freshCapitalAmount: 500, // 0.01 BTC @ 50k
                lpTransactionId: 'lp-123'
            });

            // 0.5 ETH @ 2000 (avg buy) = 1000. 1000 + 500 fresh = 1500
            expect(result.finalCostBasis).toBe(1500);
            expect(result.transactions).toHaveLength(1);
            expect(result.transactions[0].type).toBe('WITHDRAWAL');
            expect(result.transactions[0].amount).toBe(0.5);
            expect(result.transactions[0].pricePerUnit).toBe(2000);
            expect(result.description).toContain('0.5 ETH (Holdings)');
            expect(result.description).toContain('0.01 BTC (Fresh)');
        });

        it('should handle mixed funding correctly', () => {
            const result = TransactionProcessingService.processLpFunding({
                date: '2023-01-01',
                lpSymbol: 'LP-MIXED',
                tokenA: { symbol: 'ETH', amount: '0.2' },
                sourceA: 'HOLDINGS',
                fundingSourceA: 'ETH',
                tokenB: { symbol: 'USDC', amount: '500' },
                sourceB: 'FRESH',
                fundingSourceB: '',
                assets: mockAssets,
                freshCapitalAmount: 500,
                lpTransactionId: 'lp-456'
            });

            // 0.2 ETH @ 2000 = 400. 400 + 500 fresh = 900
            expect(result.finalCostBasis).toBe(900);
            expect(result.transactions).toHaveLength(1);
            expect(result.description).toContain('0.2 ETH (Holdings)');
            expect(result.description).toContain('500 USDC (Fresh)');
        });
    });

    describe('processBatchItems', () => {
        it('should ignore empty items and format valid ones', () => {
            const items = [
                { symbol: 'ETH', amount: '1', price: '2000' },
                { symbol: '', amount: '', price: '' },
                { symbol: 'BTC', amount: '0.1', price: '40000' }
            ];
            const common = { type: 'DEPOSIT', date: '2023-01-01' };

            const results = TransactionProcessingService.processBatchItems(items, common as any);

            expect(results).toHaveLength(2);
            expect(results[0].assetSymbol).toBe('ETH');
            expect(results[1].assetSymbol).toBe('BTC');
            expect(results[0].pricePerUnit).toBe(2000);
        });
    });
});
