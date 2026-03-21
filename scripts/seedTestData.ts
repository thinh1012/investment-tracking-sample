/**
 * SEED TEST DATA - Auto-populate Development Database
 * 
 * Usage: npm run seed-test-data
 * 
 * This script creates realistic test transactions so you don't lose data
 * during development. Run this before testing new features!
 */

import { openDB } from 'idb';

interface Transaction {
    id: string;
    assetSymbol: string;
    amount: number;
    date: string;
    type: 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST';
    pricePerUnit?: number;
    paymentCurrency?: string;
    paymentAmount?: number;
    notes?: string;
}

const TEST_TRANSACTIONS: Transaction[] = [
    // Initial Deposits
    {
        id: 'test-001',
        assetSymbol: 'BTC',
        amount: 0.5,
        date: '2024-01-15',
        type: 'DEPOSIT',
        pricePerUnit: 45000,
        paymentCurrency: 'USDT',
        paymentAmount: 22500,
        notes: '[TEST DATA] Initial BTC purchase'
    },
    {
        id: 'test-002',
        assetSymbol: 'ETH',
        amount: 10,
        date: '2024-01-16',
        type: 'DEPOSIT',
        pricePerUnit: 2500,
        paymentCurrency: 'USDT',
        paymentAmount: 25000,
        notes: '[TEST DATA] ETH accumulation'
    },
    {
        id: 'test-003',
        assetSymbol: 'SOL',
        amount: 100,
        date: '2024-01-20',
        type: 'DEPOSIT',
        pricePerUnit: 95,
        paymentCurrency: 'USDT',
        paymentAmount: 9500,
        notes: '[TEST DATA] SOL position'
    },

    // Interest/Staking Rewards
    {
        id: 'test-004',
        assetSymbol: 'ETH',
        amount: 0.5,
        date: '2024-02-01',
        type: 'INTEREST',
        notes: '[TEST DATA] Staking rewards'
    },
    {
        id: 'test-005',
        assetSymbol: 'SOL',
        amount: 2.5,
        date: '2024-02-05',
        type: 'INTEREST',
        notes: '[TEST DATA] Validator rewards'
    },

    // Recent Activity
    {
        id: 'test-006',
        assetSymbol: 'HYPE',
        amount: 50,
        date: '2024-02-10',
        type: 'DEPOSIT',
        pricePerUnit: 30,
        paymentCurrency: 'USDT',
        paymentAmount: 1500,
        notes: '[TEST DATA] New altcoin allocation'
    },
    {
        id: 'test-007',
        assetSymbol: 'PUMP',
        amount: 10000,
        date: '2024-02-12',
        type: 'DEPOSIT',
        pricePerUnit: 0.005,
        paymentCurrency: 'USDT',
        paymentAmount: 50,
        notes: '[TEST DATA] Speculative microcap'
    }
];

async function seedTestData() {
    console.log('🌱 [SEED] Starting test data population...');

    try {
        // Open IndexedDB
        const db = await openDB('investment-tracker', undefined, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('transactions')) {
                    db.createObjectStore('transactions', { keyPath: 'id' });
                }
            }
        });

        // Check if test data already exists
        const existingTx = await db.get('transactions', 'test-001');
        if (existingTx) {
            console.log('⚠️  [SEED] Test data already exists!');
            const confirm = window.confirm(
                'Test data already exists. Do you want to REPLACE it?\n\n' +
                'Click OK to replace, Cancel to keep existing data.'
            );
            if (!confirm) {
                console.log('✋ [SEED] Keeping existing test data');
                return;
            }
            // Clear all test transactions
            const allKeys = await db.getAllKeys('transactions');
            const testKeys = allKeys.filter(key => String(key).startsWith('test-'));
            for (const key of testKeys) {
                await db.delete('transactions', key);
            }
            console.log(`🗑️  [SEED] Cleared ${testKeys.length} old test transactions`);
        }

        // Insert test transactions
        const tx = db.transaction('transactions', 'readwrite');
        for (const transaction of TEST_TRANSACTIONS) {
            await tx.store.put(transaction);
        }
        await tx.done;

        console.log(`✅ [SEED] Successfully added ${TEST_TRANSACTIONS.length} test transactions!`);
        console.log('📊 [SEED] Test Portfolio Summary:');
        console.log('   - BTC: 0.5');
        console.log('   - ETH: 10.5 (including staking rewards)');
        console.log('   - SOL: 102.5 (including validator rewards)');
        console.log('   - HYPE: 50');
        console.log('   - PUMP: 10,000');
        console.log('');
        console.log('🔄 [SEED] Reload the page to see your test data!');

        alert('✅ Test data seeded! Reload the page (F5) to see it.');

    } catch (error) {
        console.error('❌ [SEED] Failed to seed test data:', error);
        alert(`❌ Seed failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Auto-run when script is loaded (for dev tools)
if (typeof window !== 'undefined') {
    (window as any).seedTestData = seedTestData;
    console.log('💡 Run: seedTestData() to populate test transactions');
}

export { seedTestData, TEST_TRANSACTIONS };
