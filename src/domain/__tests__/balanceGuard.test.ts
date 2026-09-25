import { describe, it, expect } from 'vitest';
import { findBalanceIssues } from '../balanceGuard';
import { calculateAssets } from '../portfolioCalculator';
import { Transaction } from '../../types';

const tx = (t: Partial<Transaction>): Transaction => ({ id: crypto.randomUUID(), date: '2026-09-20', assetSymbol: 'USDC', type: 'DEPOSIT', amount: 0, ...t });

const funded = [tx({ assetSymbol: 'USDG', amount: 1000, pricePerUnit: 1, date: '2026-09-01' })];

describe('findBalanceIssues', () => {
    it('passes a swap paid from holdings within balance', () => {
        const swap = tx({ assetSymbol: 'UP', amount: 600, pricePerUnit: 0.4, paymentCurrency: 'USDG', paymentAmount: 250 });
        expect(findBalanceIssues(funded, [swap])).toEqual([]);
    });

    it('flags a paymentCurrency debit larger than the tracked balance', () => {
        const swap = tx({ assetSymbol: 'UP', amount: 3000, pricePerUnit: 0.4, paymentCurrency: 'USDG', paymentAmount: 1200 });
        expect(findBalanceIssues(funded, [swap])[0]).toMatch(/^USDG: spending/);
    });

    it('flags a withdrawal larger than the tracked balance', () => {
        const w = tx({ assetSymbol: 'USDG', type: 'WITHDRAWAL', amount: 1500 });
        expect(findBalanceIssues(funded, [w])).toHaveLength(1);
    });

    it('flags a swap logged as both a WITHDRAWAL and a paymentCurrency debit', () => {
        const existing = [...funded, tx({ assetSymbol: 'USDG', type: 'WITHDRAWAL', amount: 250 })];
        const swap = tx({ assetSymbol: 'UP', amount: 600, pricePerUnit: 0.4, paymentCurrency: 'USDG', paymentAmount: 250 });
        expect(findBalanceIssues(existing, [swap]).some(i => i.includes('counted twice'))).toBe(true);
    });

    it('flags the reverse order: WITHDRAWAL added after the paying DEPOSIT', () => {
        const existing = [...funded, tx({ assetSymbol: 'UP', amount: 600, pricePerUnit: 0.4, paymentCurrency: 'USDG', paymentAmount: 250 })];
        const w = tx({ assetSymbol: 'USDG', type: 'WITHDRAWAL', amount: 250 });
        expect(findBalanceIssues(existing, [w]).some(i => i.includes('count the swap twice'))).toBe(true);
    });

    it('ignores the linked withdrawal of a MIXED-funded buy', () => {
        const depId = crypto.randomUUID();
        const hype = [tx({ assetSymbol: 'HYPE', amount: 10, pricePerUnit: 40, date: '2026-09-01' }), ...funded];
        const batch = [
            tx({ assetSymbol: 'HYPE', type: 'WITHDRAWAL', amount: 5, linkedTransactionId: depId, subType: 'INTERNAL_SWAP' }),
            tx({ id: depId, assetSymbol: 'UP', amount: 500, pricePerUnit: 0.4, paymentCurrency: 'HYPE', paymentAmount: 5 })
        ];
        expect(findBalanceIssues(hype, batch)).toEqual([]);
    });

    it('ignores the self-paying proceeds DEPOSIT from the sell form', () => {
        const batch = [tx({ assetSymbol: 'USDC', amount: 100, pricePerUnit: 1, paymentCurrency: 'USDC', paymentAmount: 100 })];
        expect(findBalanceIssues([], batch)).toEqual([]);
    });
});

describe('pool close transactions', () => {
    it('retire the LP and credit received tokens', () => {
        const lp = tx({ assetSymbol: 'HYPE-USDC PRJX 9', amount: 2000, pricePerUnit: 1, lpRange: { min: 30, max: 60 }, subType: 'POOL_CREATION', date: '2026-09-01' });
        const closeId = crypto.randomUUID();
        const close = [
            tx({ id: closeId, assetSymbol: lp.assetSymbol, type: 'WITHDRAWAL', amount: 2000, pricePerUnit: 1.05, subType: 'POOL_CLOSE' }),
            tx({ assetSymbol: 'USDC', amount: 1100, pricePerUnit: 1, subType: 'POOL_CLOSE', linkedTransactionId: closeId }),
            tx({ assetSymbol: 'HYPE', amount: 20, pricePerUnit: 50, subType: 'POOL_CLOSE', linkedTransactionId: closeId })
        ];
        expect(findBalanceIssues([lp], close)).toEqual([]);
        const assets = calculateAssets([lp, ...close], {});
        expect(assets.find(a => a.symbol === lp.assetSymbol)).toBeUndefined();
        expect(assets.find(a => a.symbol === 'USDC')?.quantity).toBe(1100);
        expect(assets.find(a => a.symbol === 'HYPE')?.quantity).toBe(20);
    });
});

describe('sale proceeds', () => {
    it('credit the received currency once', () => {
        const hype = tx({ assetSymbol: 'HYPE', amount: 10, pricePerUnit: 40, date: '2026-09-01' });
        const sellId = crypto.randomUUID();
        const sale = [
            tx({ id: sellId, assetSymbol: 'HYPE', type: 'WITHDRAWAL', amount: 4, pricePerUnit: 50, paymentCurrency: 'USDC', paymentAmount: 200 }),
            tx({ assetSymbol: 'USDC', amount: 200, pricePerUnit: 1, subType: 'SALE_PROCEEDS', linkedTransactionId: sellId })
        ];
        expect(findBalanceIssues([hype], sale)).toEqual([]);
        const assets = calculateAssets([hype, ...sale], {});
        expect(assets.find(a => a.symbol === 'HYPE')?.quantity).toBe(6);
        expect(assets.find(a => a.symbol === 'USDC')?.quantity).toBe(200);
    });
});
