import { useState, useEffect, useMemo } from 'react';
import { Asset, Transaction } from '../types';
import { STABLE_SYMBOLS, LOCAL_STORAGE_KEYS } from '../constants';

interface UseDashboardCalculationsProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
}

export const useDashboardCalculations = ({ assets, transactions, prices }: UseDashboardCalculationsProps) => {
    // --- State ---
    const [fundingOffset, setFundingOffset] = useState<number | null>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.FUNDING_OFFSET);
        return saved ? parseFloat(saved) : null;
    });

    const [bucketOverrides, setBucketOverrides] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.BUCKET_OVERRIDES);
        return saved ? JSON.parse(saved) : {};
    });

    // --- Effects ---
    // Universal effect for handling potential one-time migrations or corrections
    useEffect(() => {
        // Migration logic removed to prevent hardcoding personal data.
    }, []);

    // --- Calculations ---
    const totalValue = useMemo(() => assets.reduce((sum, a) => sum + (a.currentValue || (a.totalInvested + (a.compoundedPrincipal || 0))), 0), [assets]);

    // 1. Principal Buckets (Cumulative Funding Ledger)
    // This tracks WHERE the money came from, ignoring internal spend/swaps.
    const principalBuckets = useMemo(() => {
        const buckets: Record<string, number> = {};

        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            const symbol = t.assetSymbol.toUpperCase();
            if (!STABLE_SYMBOLS.includes(symbol)) continue;

            if (t.type === 'DEPOSIT') {
                const isFresh = !t.isCompound && (!t.paymentCurrency || STABLE_SYMBOLS.includes(t.paymentCurrency.toUpperCase()));
                if (isFresh) {
                    buckets[symbol] = (buckets[symbol] || 0) + t.amount;
                }
            } else if (t.type === 'WITHDRAWAL') {
                const isExit = !t.linkedTransactionId &&
                    !t.notes?.toLowerCase().includes('buy') &&
                    !t.notes?.toLowerCase().includes('swap');
                if (isExit) {
                    buckets[symbol] = (buckets[symbol] || 0) - t.amount;
                }
            }
        }

        // Initialize with Baseline Offset if set
        if (fundingOffset !== null) {
            buckets['USD'] = (buckets['USD'] || 0) + fundingOffset;
        }

        return buckets;
    }, [transactions, fundingOffset]);

    const groupedBreakdown = useMemo(() => {
        const grouped: Record<string, number> = {};
        const entries = Object.entries(principalBuckets);

        for (let i = 0; i < entries.length; i++) {
            const [currency, amount] = entries[i];
            if (STABLE_SYMBOLS.includes(currency)) {
                grouped['USD Stablecoins'] = (grouped['USD Stablecoins'] || 0) + amount;
            } else {
                grouped[currency] = amount;
            }
        }

        // Apply Correction Deltas
        const overrideEntries = Object.entries(bucketOverrides);
        for (let i = 0; i < overrideEntries.length; i++) {
            const [curr, delta] = overrideEntries[i];
            if (delta !== 0) {
                grouped[curr] = (grouped[curr] || 0) + delta;
            }
        }
        return grouped;
    }, [principalBuckets, bucketOverrides]);

    // 1.5. Compound Buckets (Self-Sustaining Growth)
    const compoundedGrowth = useMemo(() => {
        let sum = 0;
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            if (t.isCompound && t.type === 'DEPOSIT') {
                sum += (t.paymentAmount || (t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0));
            }
        }
        return sum;
    }, [transactions]);

    // 2. Global Principal (Total Invested)
    const totalInvested = useMemo(() => {
        const values = Object.values(groupedBreakdown);
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i];
        }
        return sum;
    }, [groupedBreakdown]);

    // Actions
    const updateGlobalPrincipal = (targetVal: number | null) => {
        if (targetVal === null) {
            updateFundingOffset(null);
            return;
        }
        // Calculate the gap needed to reach targetVal from the current ledger
        const currentTotal = Object.values(groupedBreakdown).reduce((sum, val) => sum + val, 0);
        const currentOffset = fundingOffset || 0;
        const rawLedger = currentTotal - currentOffset; // What the transactions say
        const newOffset = targetVal - rawLedger;
        updateFundingOffset(newOffset);
    };

    const updateFundingOffset = (newOffset: number | null) => {
        setFundingOffset(newOffset);
        if (newOffset !== null) {
            localStorage.setItem(LOCAL_STORAGE_KEYS.FUNDING_OFFSET, newOffset.toString());
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.FUNDING_OFFSET);
        }
    };

    const updateBucketOverride = (currency: string, targetVal: number | null) => {
        if (targetVal === null) {
            const newOverrides = { ...bucketOverrides };
            delete newOverrides[currency];
            setBucketOverrides(newOverrides);
            localStorage.setItem('investment_tracker_bucket_overrides', JSON.stringify(newOverrides));
            return;
        }

        // Calculate the Delta between the current raw value and the target.
        const rawVal = groupedBreakdown[currency] - (bucketOverrides[currency] || 0);
        const delta = targetVal - rawVal;

        const newOverrides = { ...bucketOverrides, [currency]: delta };
        setBucketOverrides(newOverrides);
        localStorage.setItem(LOCAL_STORAGE_KEYS.BUCKET_OVERRIDES, JSON.stringify(newOverrides));
    };

    const resetBaseline = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.FUNDING_OFFSET);
        window.location.reload();
    };

    return {
        totalInvested,
        totalValue,
        compoundedGrowth,
        groupedBreakdown,
        fundingOffset,
        bucketOverrides,
        updateGlobalPrincipal,
        updateFundingOffset,
        updateBucketOverride,
        resetBaseline
    };
};
