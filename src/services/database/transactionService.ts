import { initDB } from './core';
import { Transaction } from '../../types';

export const TransactionService = {
    async getAll(): Promise<Transaction[]> {
        const db = await initDB();
        return db.getAll('transactions');
    },

    async add(transaction: Transaction) {
        const db = await initDB();
        return db.put('transactions', transaction);
    },

    async update(transaction: Transaction) {
        const db = await initDB();
        return db.put('transactions', transaction);
    },

    async delete(id: string) {
        const db = await initDB();
        return db.delete('transactions', id);
    },

    async migrateFromLocalStorage(transactions: Transaction[]) {
        const db = await initDB();
        const tx = db.transaction('transactions', 'readwrite');
        await Promise.all(transactions.map(t => tx.store.put(t)));
        await tx.done;
    },

    async clearAll() {
        const db = await initDB();
        await db.clear('transactions');
    },

    async bulkImport(transactions: Transaction[]) {
        const db = await initDB();
        const tx = db.transaction('transactions', 'readwrite');
        await tx.store.clear();
        await Promise.all(transactions.map(t => tx.store.put(t)));
        await tx.done;
    }
};
