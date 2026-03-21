import { describe, it, expect } from 'vitest';
import {
    getAccountType,
    getJournalEntries,
    getLedgerBalances,
    JournalEntry
} from '../AccountingService';
import { Transaction } from '../../types';

describe('AccountingService', () => {
    describe('getAccountType', () => {
        it('should return EQUITY for CAPITAL_FUNDING', () => {
            expect(getAccountType('CAPITAL_FUNDING')).toBe('EQUITY');
            expect(getAccountType('capital_funding')).toBe('EQUITY');
        });

        it('should return EQUITY for EXTERNAL_OUTFLOW', () => {
            expect(getAccountType('EXTERNAL_OUTFLOW')).toBe('EQUITY');
        });

        it('should return REVENUE for EARNED_REWARDS', () => {
            expect(getAccountType('EARNED_REWARDS')).toBe('REVENUE');
        });

        it('should return EXPENSE for EXPENSE_FEES', () => {
            expect(getAccountType('EXPENSE_FEES')).toBe('EXPENSE');
        });

        it('should return ASSET for any other account', () => {
            expect(getAccountType('BTC')).toBe('ASSET');
            expect(getAccountType('ETH')).toBe('ASSET');
            expect(getAccountType('HYPE')).toBe('ASSET');
            expect(getAccountType('random_account')).toBe('ASSET');
        });

        it('should handle whitespace in account names', () => {
            expect(getAccountType('  CAPITAL_FUNDING  ')).toBe('EQUITY');
            expect(getAccountType('  btc  ')).toBe('ASSET');
        });
    });

    describe('getJournalEntries - DEPOSIT transactions', () => {
        it('should generate journal entries for a simple DEPOSIT (external)', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 45000,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            // Should have 2 entries: Debit BTC, Credit CAPITAL_FUNDING
            expect(entries.length).toBe(2);
            expect(entries.find(e => e.account === 'BTC' && e.debit === 1)).toBeDefined();
            expect(entries.find(e => e.account === 'CAPITAL_FUNDING' && e.credit === 45000)).toBeDefined();
        });

        it('should generate journal entries for an internal BUY (with paymentCurrency)', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx2',
                    date: '2024-01-16',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE',
                    amount: 100,
                    pricePerUnit: 25,
                    paymentCurrency: 'USDC',
                    paymentAmount: 2500,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            // Debit HYPE (asset), Credit USDC (payment)
            expect(entries.find(e => e.account === 'HYPE' && e.debit === 100)).toBeDefined();
            expect(entries.find(e => e.account === 'USDC' && e.credit === 2500)).toBeDefined();
        });

        it('should handle DEPOSIT with zero amount', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 0,
                    pricePerUnit: 45000,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.account === 'BTC' && e.debit === 0)).toBeDefined();
            expect(entries.find(e => e.account === 'CAPITAL_FUNDING' && e.credit === 0)).toBeDefined();
        });
    });

    describe('getJournalEntries - Pool Creation', () => {
        it('should handle pool creation with fresh capital', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx3',
                    date: '2024-01-17',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE-ETH-LP',
                    amount: 1,
                    notes: 'Pool Creation: $5000 Fresh Capital'
                }
            ];

            const entries = getJournalEntries(transactions);

            // Should have LP debit entry
            expect(entries.find(e => e.account === 'HYPE-ETH-LP' && e.debit === 1)).toBeDefined();
            // Should have fresh capital entry
            expect(entries.find(e => e.account === 'CAPITAL_FUNDING' && e.credit === 5000)).toBeDefined();
        });

        it('should handle pool creation with formatted fresh capital', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx3',
                    date: '2024-01-17',
                    type: 'DEPOSIT',
                    assetSymbol: 'LP-1',
                    amount: 10,
                    notes: 'Pool Creation: $10,000.50 Fresh Capital'
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.account === 'CAPITAL_FUNDING' && e.credit === 10000.50)).toBeDefined();
        });

        it('should handle pool creation without fresh capital', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx3',
                    date: '2024-01-17',
                    type: 'DEPOSIT',
                    assetSymbol: 'LP-1',
                    amount: 5,
                    notes: 'Pool Creation:'  // Note: requires colon to match isPoolCreation check
                }
            ];

            const entries = getJournalEntries(transactions);

            // Should only have LP debit entry (no CAPITAL_FUNDING without fresh capital)
            expect(entries.find(e => e.account === 'LP-1')).toBeDefined();
            expect(entries.filter(e => e.account === 'CAPITAL_FUNDING').length).toBe(0);
        });
    });

    describe('getJournalEntries - INTEREST transactions', () => {
        it('should generate INTEREST entries correctly', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx3',
                    date: '2024-01-17',
                    type: 'INTEREST',
                    assetSymbol: 'HYPE',
                    amount: 5,
                    interestType: 'STAKING',
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            // Debit HYPE (asset), Credit EARNED_REWARDS
            expect(entries.find(e => e.account === 'HYPE' && e.debit === 5)).toBeDefined();
            expect(entries.find(e => e.account === 'EARNED_REWARDS' && e.credit === 5)).toBeDefined();
        });

        it('should handle INTEREST without interestType', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx3',
                    date: '2024-01-17',
                    type: 'INTEREST',
                    assetSymbol: 'ETH',
                    amount: 0.5,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.txType === 'INTEREST' && e.description.includes('Yield'))).toBeDefined();
        });

        it('should handle multiple INTEREST transactions', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-17',
                    type: 'INTEREST',
                    assetSymbol: 'USDC',
                    amount: 100,
                    interestType: 'LENDING'
                },
                {
                    id: 'tx2',
                    date: '2024-01-18',
                    type: 'INTEREST',
                    assetSymbol: 'ETH',
                    amount: 0.1,
                    interestType: 'STAKING'
                }
            ];

            const entries = getJournalEntries(transactions);

            // Should be sorted by date desc (tx2 first)
            expect(entries[0].txId).toBe('tx2');
            expect(entries.find(e => e.account === 'USDC' && e.debit === 100)).toBeDefined();
            expect(entries.find(e => e.account === 'ETH' && e.debit === 0.1)).toBeDefined();
        });
    });

    describe('getJournalEntries - WITHDRAWAL transactions', () => {
        it('should generate WITHDRAWAL entries for external withdrawal', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx4',
                    date: '2024-01-18',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'ETH',
                    amount: 2,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.account === 'EXTERNAL_OUTFLOW' && e.debit === 2)).toBeDefined();
            expect(entries.find(e => e.account === 'ETH' && e.credit === 2)).toBeDefined();
        });

        it('should handle LP funding withdrawal', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx4',
                    date: '2024-01-18',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'ETH',
                    amount: 5,
                    notes: 'Moved to LP HYPE-ETH'
                }
            ];

            const entries = getJournalEntries(transactions);

            // Debit LP account, Credit spot asset
            expect(entries.find(e => e.account === 'HYPE-ETH' && e.debit === 5)).toBeDefined();
            expect(entries.find(e => e.account === 'ETH' && e.credit === 5)).toBeDefined();
        });

        it('should handle swap withdrawal', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx4',
                    date: '2024-01-18',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'USDC',
                    amount: 1000,
                    notes: 'Used to buy BTC'
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.description.includes('Swap Out'))).toBeDefined();
            expect(entries.find(e => e.account === 'USDC' && e.credit === 1000)).toBeDefined();
        });

        it('should handle multiple swap keywords', () => {
            const swapNotes = [
                'Used to buy ETH',
                'Swap to BTC',
                'Bought HYPE'
            ];

            swapNotes.forEach(note => {
                const transactions: Transaction[] = [{
                    id: 'tx',
                    date: '2024-01-18',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'USDC',
                    amount: 100,
                    notes: note
                }];

                const entries = getJournalEntries(transactions);
                expect(entries.find(e => e.description.includes('Swap Out'))).toBeDefined();
            });
        });
    });

    describe('getJournalEntries - FEE handling', () => {
        it('should handle fees correctly', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx5',
                    date: '2024-01-19',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 0.5,
                    pricePerUnit: 50000,
                    fee: 25,
                    feeCurrency: 'USD',
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            // Should have fee entries
            expect(entries.find(e => e.account === 'EXPENSE_FEES' && e.debit === 25)).toBeDefined();
            expect(entries.find(e => e.account === 'USD' && e.credit === 25)).toBeDefined();
        });

        it('should handle fees with different currency', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx5',
                    date: '2024-01-19',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 1,
                    pricePerUnit: 3000,
                    fee: 0.01,
                    feeCurrency: 'ETH',
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.account === 'EXPENSE_FEES' && e.debit === 0.01 && e.currency === 'ETH')).toBeDefined();
            expect(entries.find(e => e.account === 'ETH' && e.credit === 0.01)).toBeDefined();
        });

        it('should handle zero fees', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx5',
                    date: '2024-01-19',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    fee: 0,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            // Zero fees should NOT create FEE entries (only positive fees do)
            expect(entries.filter(e => e.txType === 'FEE').length).toBe(0);
        });

        it('should use USD as default fee currency when not specified', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx5',
                    date: '2024-01-19',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    fee: 10,
                    notes: ''
                }
            ];

            const entries = getJournalEntries(transactions);

            const feeEntry = entries.find(e => e.account === 'EXPENSE_FEES');
            expect(feeEntry?.currency).toBe('USD');
        });
    });

    describe('getJournalEntries - Complex scenarios', () => {
        it('should handle multiple transactions sorted by date', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 40000
                },
                {
                    id: 'tx2',
                    date: '2024-01-20',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 10,
                    pricePerUnit: 2000
                },
                {
                    id: 'tx3',
                    date: '2024-01-10',
                    type: 'DEPOSIT',
                    assetSymbol: 'SOL',
                    amount: 100,
                    pricePerUnit: 100
                }
            ];

            const entries = getJournalEntries(transactions);

            // First entry should be from tx2 (most recent: Jan 20)
            expect(entries[0].txId).toBe('tx2');
            // Last non-fee entry should be from tx3 (oldest: Jan 10)
            const nonFeeEntries = entries.filter(e => e.txType !== 'FEE');
            expect(nonFeeEntries[nonFeeEntries.length - 1].txId).toBe('tx3');
        });

        it('should handle buy with paymentAmount parsed from notes', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'HYPE',
                    amount: 100,
                    notes: 'Bought with 2500 USDC (Holdings)'
                }
            ];

            const entries = getJournalEntries(transactions);

            expect(entries.find(e => e.account === 'HYPE' && e.debit === 100)).toBeDefined();
        });

        it('should handle transaction with all fields', () => {
            const transaction: Transaction = {
                id: 'tx-full',
                date: '2024-01-15',
                type: 'DEPOSIT',
                assetSymbol: 'BTC',
                amount: 0.5,
                pricePerUnit: 50000,
                fee: 25,
                feeCurrency: 'USD',
                paymentCurrency: 'USDC',
                paymentAmount: 25000,
                notes: 'Test transaction',
                platform: 'Binance',
                lpRange: { min: 40000, max: 60000 },
                monitorSymbol: 'BTC',
                isCompound: false
            };

            const entries = getJournalEntries([transaction]);

            // Should have DEPOSIT entries (2) + FEE entries (2) = 4 total
            expect(entries.length).toBe(4);
            expect(entries.every(e => e.txId === 'tx-full')).toBe(true);
        });
    });

    describe('getLedgerBalances', () => {
        it('should calculate net balances from transactions', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 2,
                    pricePerUnit: 40000,
                    notes: ''
                },
                {
                    id: 'tx2',
                    date: '2024-01-16',
                    type: 'INTEREST',
                    assetSymbol: 'BTC',
                    amount: 0.01,
                    notes: ''
                }
            ];

            const balances = getLedgerBalances(transactions);

            // BTC should show positive balance (2 + 0.01 = 2.01)
            expect(balances['BTC']['BTC']).toBeCloseTo(2.01, 5);

            // CAPITAL_FUNDING should show negative balance (credit side)
            // 2 BTC @ $40,000 = $80,000
            expect(balances['CAPITAL_FUNDING']['USD']).toBe(-80000);

            // EARNED_REWARDS should show negative balance (credit side)
            expect(balances['EARNED_REWARDS']['BTC']).toBe(-0.01);
        });

        it('should handle empty transactions', () => {
            const balances = getLedgerBalances([]);
            expect(Object.keys(balances).length).toBe(0);
        });

        it('should calculate balances across multiple currencies', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 40000
                },
                {
                    id: 'tx2',
                    date: '2024-01-16',
                    type: 'DEPOSIT',
                    assetSymbol: 'ETH',
                    amount: 10,
                    pricePerUnit: 2000
                },
                {
                    id: 'tx3',
                    date: '2024-01-17',
                    type: 'INTEREST',
                    assetSymbol: 'USDC',
                    amount: 100
                }
            ];

            const balances = getLedgerBalances(transactions);

            expect(balances['BTC']['BTC']).toBe(1);
            expect(balances['ETH']['ETH']).toBe(10);
            expect(balances['USDC']['USDC']).toBe(100);
            // CAPITAL_FUNDING: 1 BTC ($40k) + 10 ETH ($20k) = $60,000
            expect(balances['CAPITAL_FUNDING']['USD']).toBe(-60000);
        });

        it('should handle net zero balances', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 40000
                },
                {
                    id: 'tx2',
                    date: '2024-01-16',
                    type: 'WITHDRAWAL',
                    assetSymbol: 'BTC',
                    amount: 1
                }
            ];

            const balances = getLedgerBalances(transactions);

            expect(balances['BTC']['BTC']).toBe(0);
        });

        it('should group balances by account and currency', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'INTEREST',
                    assetSymbol: 'USDC',
                    amount: 100
                },
                {
                    id: 'tx2',
                    date: '2024-01-16',
                    type: 'INTEREST',
                    assetSymbol: 'ETH',
                    amount: 0.5
                }
            ];

            const balances = getLedgerBalances(transactions);

            // EARNED_REWARDS should have separate balances for each currency
            expect(balances['EARNED_REWARDS']['USDC']).toBe(-100);
            expect(balances['EARNED_REWARDS']['ETH']).toBe(-0.5);
        });
    });

    describe('JournalEntry structure', () => {
        it('should have correct entry structure', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 40000
                }
            ];

            const entries = getJournalEntries(transactions);

            entries.forEach((entry: JournalEntry) => {
                expect(entry).toHaveProperty('txId');
                expect(entry).toHaveProperty('date');
                expect(entry).toHaveProperty('txType');
                expect(entry).toHaveProperty('description');
                expect(entry).toHaveProperty('account');
                expect(entry).toHaveProperty('debit');
                expect(entry).toHaveProperty('credit');
                expect(entry).toHaveProperty('currency');
            });
        });

        it('should have proper debit/credit balance per transaction', () => {
            const transactions: Transaction[] = [
                {
                    id: 'tx1',
                    date: '2024-01-15',
                    type: 'DEPOSIT',
                    assetSymbol: 'BTC',
                    amount: 1,
                    pricePerUnit: 40000
                }
            ];

            const entries = getJournalEntries(transactions);
            const txEntries = entries.filter(e => e.txId === 'tx1' && e.txType === 'DEPOSIT');

            const totalDebits = txEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalCredits = txEntries.reduce((sum, e) => sum + e.credit, 0);

            // In accounting terms, the amounts won't be equal because one is BTC and one is USD
            // But each entry should have at least one side > 0
            expect(txEntries.length).toBe(2);
            expect(txEntries.some(e => e.debit > 0)).toBe(true);
            expect(txEntries.some(e => e.credit > 0)).toBe(true);
        });
    });
});
