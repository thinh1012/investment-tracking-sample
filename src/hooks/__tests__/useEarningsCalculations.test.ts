import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEarningsCalculations } from '../useEarningsCalculations';
import { Asset, Transaction } from '../../types';

// Mock React for renderHook
vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
        ...actual,
    };
});

describe('useEarningsCalculations', () => {
    const mockAssets: Asset[] = [
        {
            symbol: 'HLP',
            name: 'Hyperliquid LP',
            totalAmount: 1,
            totalInvested: 1000,
            lpRange: '1000-2000',
            avgBuyPrice: 1000,
            currentValue: 1100,
            unrealizedPL: 100,
            percentage: 100
        }
    ];

    const mockTransactions: Transaction[] = [
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

    it('should calculate earnings correctly for a single LP', () => {
        const { result } = renderHook(() => useEarningsCalculations(mockAssets, mockTransactions, mockPrices));

        // Total Value: (50 * 1) + (10 * 5) = 100
        expect(result.current.totalEarningsUSD).toBe(100);

        // Enhanced Earnings
        expect(result.current.enhancedEarnings.length).toBe(1);
        const hlpEarnings = result.current.enhancedEarnings[0];
        expect(hlpEarnings.source).toBe('HLP');
        expect(hlpEarnings.totalValue).toBe(100);

        // ROI: (100 / 1000) * 100 = 10%
        expect(hlpEarnings.roi).toBe(10);
    });

    it('should calculate tokens earned accurately', () => {
        const { result } = renderHook(() => useEarningsCalculations(mockAssets, mockTransactions, mockPrices));

        expect(result.current.totalEarningsByToken).toEqual([
            { token: 'USDC', quantity: 50, value: 50 },
            { token: 'HYPE', quantity: 10, value: 50 }
        ]);
    });

    it('should handle multi-asset LP sources', () => {
        const multiAssetTransactions: Transaction[] = [
            {
                id: '3',
                type: 'INTEREST',
                assetSymbol: 'USDC',
                amount: 20,
                date: '2023-02-01',
                relatedAssetSymbols: ['BTC', 'ETH'],
                pricePerUnit: 1
            }
        ];

        const assets: Asset[] = [
            { symbol: 'BTC', totalInvested: 500 } as any,
            { symbol: 'ETH', totalInvested: 500 } as any
        ];

        const { result } = renderHook(() => useEarningsCalculations(assets, multiAssetTransactions, mockPrices));

        expect(result.current.enhancedEarnings[0].source).toBe('BTC + ETH');
        expect(result.current.enhancedEarnings[0].totalInvested).toBe(1000);
    });
});
