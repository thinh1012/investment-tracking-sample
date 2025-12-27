import { useState, useEffect, useMemo } from 'react';
import { Asset, Transaction } from '../types';

interface UseDashboardCalculationsProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
}

export const useDashboardCalculations = ({ assets, transactions, prices }: UseDashboardCalculationsProps) => {
    // --- State ---
    const [fundingOffset, setFundingOffset] = useState<number | null>(() => {
        const saved = localStorage.getItem('investment_tracker_funding_offset');
        return saved ? parseFloat(saved) : null;
    });

    const [bucketOverrides, setBucketOverrides] = useState<Record<string, number>>(() => {
        const saved = localStorage.getItem('investment_tracker_bucket_overrides');
        return saved ? JSON.parse(saved) : {};
    });

    // --- Effects ---
    // Migration / Correction Effect for 16008 baseline
    useEffect(() => {
        if (transactions.length === 0) return;

        const hasFixed = localStorage.getItem('investment_tracker_base_fix_16008_applied');

        if (!hasFixed) {
            const target = 16008;
            const actualSum = transactions.reduce((sum, t) => {
                let amt = 0;
                if (t.type === 'DEPOSIT') {
                    amt = Number(t.paymentAmount || (t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0));
                } else if (t.type === 'WITHDRAWAL') {
                    if (t.linkedTransactionId) {
                        const parent = transactions.find(Lx => Lx.id === t.linkedTransactionId);
                        if (parent && parent.paymentAmount) return sum;
                    }
                    amt = -Number(t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0);
                }
                return sum + amt;
            }, 0);

            const newOffset = target - actualSum;
            setFundingOffset(newOffset);
            localStorage.setItem('investment_tracker_funding_offset', newOffset.toString());
            localStorage.setItem('investment_tracker_base_fix_16008_applied', 'true');
            if (localStorage.getItem('investment_tracker_manual_principal')) {
                localStorage.removeItem('investment_tracker_manual_principal');
            }
            localStorage.removeItem('investment_tracker_manual_funding');
        }
    }, [transactions]);

    // --- Calculations ---
    const totalValue = useMemo(() => assets.reduce((sum, a) => sum + (a.currentValue || a.totalInvested), 0), [assets]);

    // 1. Principal Buckets (Cumulative Funding Ledger)
    // This tracks WHERE the money came from, ignoring internal spend/swaps.
    const principalBuckets = useMemo(() => {
        const stableSymbols = ['USD', 'USDT', 'USDC', 'DAI', 'BUSD'];
        const buckets = transactions.reduce((acc, t) => {
            const symbol = t.assetSymbol.toUpperCase();
            if (!stableSymbols.includes(symbol)) return acc;

            if (t.type === 'DEPOSIT') {
                // RULE: Only External Injections count towards Principal.
                const isFresh = !t.paymentCurrency || stableSymbols.includes(t.paymentCurrency.toUpperCase());
                if (isFresh) {
                    acc[symbol] = (acc[symbol] || 0) + t.amount;
                }
            } else if (t.type === 'WITHDRAWAL') {
                // RULE: Only True System Exits (No buy/swap notes) reduce Principal.
                const isExit = !t.linkedTransactionId &&
                    !t.notes?.toLowerCase().includes('buy') &&
                    !t.notes?.toLowerCase().includes('swap');
                if (isExit) {
                    acc[symbol] = (acc[symbol] || 0) - t.amount;
                }
            }
            return acc;
        }, {} as Record<string, number>);

        // Initialize with Baseline Offset if set
        if (fundingOffset !== null) {
            buckets['USD'] = (buckets['USD'] || 0) + fundingOffset;
        }

        return buckets;
    }, [transactions, fundingOffset]);

    const groupedBreakdown = useMemo(() => {
        const grouped: Record<string, number> = {};
        Object.entries(principalBuckets).forEach(([currency, amount]) => {
            if (['USDT', 'USDC', 'USD', 'DAI'].includes(currency)) {
                grouped['USD Stablecoins'] = (grouped['USD Stablecoins'] || 0) + amount;
            } else {
                grouped[currency] = amount;
            }
        });

        // Apply Correction Deltas
        // bucketOverrides now store the "Adjustment" needed to reach the target.
        Object.entries(bucketOverrides).forEach(([curr, delta]) => {
            if (delta !== 0) {
                grouped[curr] = (grouped[curr] || 0) + delta;
            }
        });
        return grouped;
    }, [principalBuckets, bucketOverrides]);

    // 2. Global Principal (Total Invested)
    const totalInvested = useMemo(() => {
        // Total Invested is ALWAYS the sum of all principal buckets.
        // This ensures the Summary Card and the Buckets section are in sync.
        return Object.values(groupedBreakdown).reduce((sum, val) => sum + val, 0);
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
            localStorage.setItem('investment_tracker_funding_offset', newOffset.toString());
        } else {
            localStorage.removeItem('investment_tracker_funding_offset');
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
        localStorage.setItem('investment_tracker_bucket_overrides', JSON.stringify(newOverrides));
    };

    const resetBaseline = () => {
        localStorage.removeItem('investment_tracker_base_fix_16008_applied');
        window.location.reload();
    };

    return {
        totalInvested,
        totalValue,
        groupedBreakdown,
        fundingOffset,
        bucketOverrides,
        updateGlobalPrincipal,
        updateFundingOffset,
        updateBucketOverride,
        resetBaseline
    };
};
