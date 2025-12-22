import { describe, it, expect } from 'vitest';
import {
    calculateEarningsBySource,
    enhanceEarnings,
    calculateTotalsByToken
} from '../lpEarningsCalculator';
import { Asset, Transaction } from '../../types';

describe('lpEarningsCalculator', () => {
    const mockAssets: Asset[] = [
        {
            quantity: 1,
            currentPrice: 1100,
            symbol: 'HLP',

            totalInvested: 1000,
            lpRange: { min: 1000, max: 2000 },
            averageBuyPrice: 1000,
            currentValue: 1100,
            unrealizedPnL: 100,
            pnlPercentage: 100
        }
    ];

    const mockTransactions: Transaction[] = [
        {
            id: 'dep1',
            type: 'DEPOSIT',
            assetSymbol: 'HLP',
            amount: 1,
            date: '2022-12-01', // 1 month before interests
            pricePerUnit: 1000
        },
        {
            id: '1',
            type: 'INTEREST',
            assetSymbol: 'USDC',
            amount: 50,
            date: '2023-01-01',
            relatedAssetSymbol: 'HLP',
            pricePerUnit: 1
        },
        {
            id: '2',
            type: 'INTEREST',
            assetSymbol: 'HYPE',
            amount: 10,
            date: '2023-01-15',
            relatedAssetSymbol: 'HLP',
            pricePerUnit: 5
        }
    ];

    const mockPrices: Record<string, number> = {
        'USDC': 1,
        'HYPE': 5,
        'HLP': 1100
    };

    describe('calculateEarningsBySource', () => {
        it('should group interest by source LP', () => {
            const result = calculateEarningsBySource(mockAssets, mockTransactions, mockPrices);

            expect(result['HLP']).toBeDefined();
            expect(result['HLP'].tokens['USDC']).toBe(50);
            expect(result['HLP'].tokens['HYPE']).toBe(10);
            expect(result['HLP'].totalValue).toBe(100);
        });

        it('should handle multi-asset LP sources with valid LP naming', () => {
            const multiTx: Transaction[] = [{
                id: '3',
                type: 'INTEREST',
                assetSymbol: 'USDC',
                amount: 20,
                date: '2023-02-01',
                relatedAssetSymbols: ['BTC/USDC', 'ETH/USDC'],
                pricePerUnit: 1
            }];
            const result = calculateEarningsBySource([], multiTx, mockPrices);
            expect(result['BTC/USDC + ETH/USDC']).toBeDefined();
        });
    });

    describe('enhanceEarnings', () => {
        it('should calculate ROI and APR correctly', () => {
            const earningsBySource = calculateEarningsBySource(mockAssets, mockTransactions, mockPrices);
            const result = enhanceEarnings(earningsBySource, mockAssets, mockTransactions);

            const hlp = result[0];
            expect(hlp.roi).toBe(10); // (100 / 1000) * 100
            expect(hlp.totalInvested).toBe(1000);
            expect(hlp.daysActive).toBeGreaterThan(0);
            expect(hlp.apr).toBeDefined();
            expect(hlp.apr).toBeGreaterThan(0);
        });
    });

    describe('calculateTotalsByToken', () => {
        it('should summarize totals across all sources', () => {
            const earningsBySource = calculateEarningsBySource(mockAssets, mockTransactions, mockPrices);
            const result = calculateTotalsByToken(earningsBySource, mockPrices);

            expect(result).toEqual([
                { token: 'USDC', quantity: 50, value: 50 },
                { token: 'HYPE', quantity: 10, value: 50 }
            ]);
        });
    });
});
