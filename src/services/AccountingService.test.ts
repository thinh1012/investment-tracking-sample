import { describe, it, expect } from 'vitest';
import {
    getAccountType,
    getJournalEntries,
    getLedgerBalances,
    type JournalEntry
} from './AccountingService';
import { Transaction } from '../types';

// ============================================================
// TEST SUITE: AccountingService
// ============================================================
// These tests verify the core accounting logic works correctly.
// Run with: npm run test
// ============================================================

describe('getAccountType', () => {
    it('should classify CAPITAL_FUNDING as EQUITY', () => {
        expect(getAccountType('CAPITAL_FUNDING')).toBe('EQUITY');
    });

    it('should classify EXTERNAL_OUTFLOW as EQUITY', () => {
        expect(getAccountType('EXTERNAL_OUTFLOW')).toBe('EQUITY');
    });

    it('should classify EARNED_REWARDS as REVENUE', () => {
        expect(getAccountType('EARNED_REWARDS')).toBe('REVENUE');
    });

    it('should classify EXPENSE_FEES as EXPENSE', () => {
        expect(getAccountType('EXPENSE_FEES')).toBe('EXPENSE');
    });

    it('should classify any crypto symbol as ASSET', () => {
        expect(getAccountType('BTC')).toBe('ASSET');
        expect(getAccountType('ETH')).toBe('ASSET');
        expect(getAccountType('USDT')).toBe('ASSET');
    });

    it('should be case-insensitive', () => {
        expect(getAccountType('capital_funding')).toBe('EQUITY');
        expect(getAccountType('Capital_Funding')).toBe('EQUITY');
    });
});

describe('getJournalEntries', () => {
    describe('DEPOSIT transactions', () => {
        it('should create 2 entries for external deposit: Asset + Capital Funding', () => {
            const tx: Transaction = {
                id: 'tx-1',
                date: '2026-01-17',
                type: 'DEPOSIT',
                assetSymbol: 'BTC',
                amount: 1,
                pricePerUnit: 100000,
            };

            const entries = getJournalEntries([tx]);

            // Should have 2 entries: Debit BTC, Credit CAPITAL_FUNDING
            expect(entries).toHaveLength(2);

            const btcEntry = entries.find(e => e.account === 'BTC');
            const capitalEntry = entries.find(e => e.account === 'CAPITAL_FUNDING');

            expect(btcEntry?.debit).toBe(1);
            expect(btcEntry?.credit).toBe(0);
            expect(capitalEntry?.debit).toBe(0);
            expect(capitalEntry?.credit).toBe(100000); // 1 BTC * $100k
        });

        it('should handle internal buy (swap): Asset + Payment Currency', () => {
            const tx: Transaction = {
                id: 'tx-2',
                date: '2026-01-17',
                type: 'DEPOSIT',
                assetSymbol: 'ETH',
                amount: 10,
                pricePerUnit: 3500,
                paymentCurrency: 'USDT',
                paymentAmount: 35000,
            };

            const entries = getJournalEntries([tx]);

            expect(entries).toHaveLength(2);

            const ethEntry = entries.find(e => e.account === 'ETH');
            const usdtEntry = entries.find(e => e.account === 'USDT');

            expect(ethEntry?.debit).toBe(10);
            expect(usdtEntry?.credit).toBe(35000);
        });
    });

    describe('INTEREST transactions', () => {
        it('should credit EARNED_REWARDS for staking rewards', () => {
            const tx: Transaction = {
                id: 'tx-3',
                date: '2026-01-17',
                type: 'INTEREST',
                assetSymbol: 'HYPE',
                amount: 50,
                interestType: 'STAKING',
            };

            const entries = getJournalEntries([tx]);

            expect(entries).toHaveLength(2);

            const assetEntry = entries.find(e => e.account === 'HYPE');
            const revenueEntry = entries.find(e => e.account === 'EARNED_REWARDS');

            expect(assetEntry?.debit).toBe(50);
            expect(revenueEntry?.credit).toBe(50);
        });
    });

    describe('WITHDRAWAL transactions', () => {
        it('should credit asset and debit EXTERNAL_OUTFLOW for external withdrawal', () => {
            const tx: Transaction = {
                id: 'tx-4',
                date: '2026-01-17',
                type: 'WITHDRAWAL',
                assetSymbol: 'ETH',
                amount: 5,
            };

            const entries = getJournalEntries([tx]);

            expect(entries).toHaveLength(2);

            const externalEntry = entries.find(e => e.account === 'EXTERNAL_OUTFLOW');
            const assetEntry = entries.find(e => e.account === 'ETH');

            expect(externalEntry?.debit).toBe(5);
            expect(assetEntry?.credit).toBe(5);
        });

        it('should handle internal swap (sell for another asset)', () => {
            const tx: Transaction = {
                id: 'tx-5',
                date: '2026-01-17',
                type: 'WITHDRAWAL',
                assetSymbol: 'MET',
                amount: 1000,
                notes: 'Used to buy USDT',
            };

            const entries = getJournalEntries([tx]);

            // Internal swap only credits the asset (DEPOSIT handles the debit)
            expect(entries).toHaveLength(1);
            expect(entries[0].account).toBe('MET');
            expect(entries[0].credit).toBe(1000);
        });
    });

    describe('Fee handling', () => {
        it('should record fees as EXPENSE_FEES', () => {
            const tx: Transaction = {
                id: 'tx-6',
                date: '2026-01-17',
                type: 'DEPOSIT',
                assetSymbol: 'SOL',
                amount: 100,
                pricePerUnit: 200,
                fee: 0.5,
                feeCurrency: 'SOL',
            };

            const entries = getJournalEntries([tx]);

            const feeEntry = entries.find(e => e.account === 'EXPENSE_FEES');
            expect(feeEntry).toBeDefined();
            expect(feeEntry?.debit).toBe(0.5);
        });
    });
});

describe('getLedgerBalances', () => {
    it('should calculate net balance for simple deposit', () => {
        const txs: Transaction[] = [
            {
                id: 'tx-1',
                date: '2026-01-17',
                type: 'DEPOSIT',
                assetSymbol: 'BTC',
                amount: 2,
                pricePerUnit: 50000,
            },
        ];

        const balances = getLedgerBalances(txs);

        expect(balances['BTC']['BTC']).toBe(2);
        expect(balances['CAPITAL_FUNDING']['USD']).toBe(-100000); // Credited = negative
    });

    it('should calculate net balance after buy + sell', () => {
        const txs: Transaction[] = [
            {
                id: 'tx-1',
                date: '2026-01-17',
                type: 'DEPOSIT',
                assetSymbol: 'USDT',
                amount: 10000,
                pricePerUnit: 1,
            },
            {
                id: 'tx-2',
                date: '2026-01-17',
                type: 'DEPOSIT',
                assetSymbol: 'ETH',
                amount: 3,
                paymentCurrency: 'USDT',
                paymentAmount: 9000,
            },
        ];

        const balances = getLedgerBalances(txs);

        // Started with 10000 USDT, spent 9000 on ETH
        expect(balances['USDT']['USDT']).toBe(10000 - 9000); // 1000 remaining
        expect(balances['ETH']['ETH']).toBe(3);
    });

    it('should track rewards separately from capital', () => {
        const txs: Transaction[] = [
            {
                id: 'tx-1',
                date: '2026-01-17',
                type: 'INTEREST',
                assetSymbol: 'HYPE',
                amount: 100,
                interestType: 'STAKING',
            },
        ];

        const balances = getLedgerBalances(txs);

        expect(balances['HYPE']['HYPE']).toBe(100);
        expect(balances['EARNED_REWARDS']['HYPE']).toBe(-100); // Credited
    });
});
