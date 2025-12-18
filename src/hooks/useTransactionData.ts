import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { TransactionService } from '../services/db';
import { useNotification } from '../context/NotificationContext';

const STORAGE_KEY = 'investment_tracker_transactions';

const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
    if (!jsonString) return fallback;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn("Failed to parse JSON:", e);
        return fallback;
    }
};

export const useTransactionData = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load & Migration
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Check if we have data in DB
                let dbData = await TransactionService.getAll();

                // If DB is empty, check localStorage (Migration)
                if (dbData.length === 0) {
                    const localSaved = localStorage.getItem(STORAGE_KEY);
                    if (localSaved) {
                        const localData = safeJsonParse(localSaved, []);
                        if (Array.isArray(localData) && localData.length > 0) {
                            console.log("Migrating data to IndexedDB...", localData.length);
                            await TransactionService.migrateFromLocalStorage(localData);
                            dbData = localData;
                        }
                    }
                }
                setTransactions(dbData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            } catch (e) {
                console.error("Failed to load transactions", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const addTransaction = async (transaction: Transaction) => {
        const newTransaction = { ...transaction, id: crypto.randomUUID() };
        // Optimistic UI Update
        setTransactions((prev) => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        // Persist
        await TransactionService.add(newTransaction);
        return newTransaction;
    };

    const deleteTransaction = async (id: string) => {
        // Find links
        const linkedTxs = transactions.filter(t => t.linkedTransactionId === id);

        // Optimistically update UI (remove main + linked)
        setTransactions((prev) => prev.filter((t) => t.id !== id && t.linkedTransactionId !== id));

        // Delete Main
        await TransactionService.delete(id);

        // Delete Linked
        await Promise.all(linkedTxs.map(t => TransactionService.delete(t.id)));
    };

    const updateTransaction = async (updatedTx: Transaction) => {
        setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        await TransactionService.update(updatedTx);
    };

    const importTransactions = async (newTransactions: Transaction[]) => {
        setTransactions(newTransactions);
        await TransactionService.bulkImport(newTransactions);
    };

    return {
        transactions,
        isLoading,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        importTransactions
    };
};
