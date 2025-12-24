import { useState, useEffect, useMemo } from 'react';
import { Asset, Transaction } from '../types';

interface UseDashboardCalculationsProps {
    assets: Asset[];
    transactions: Transaction[];
    prices: Record<string, number>;
}

export const useDashboardCalculations = ({ assets, transactions, prices }: UseDashboardCalculationsProps) => {
    // --- State ---
    const [manualPrincipal, setManualPrincipal] = useState<number | null>(() => {
        const saved = localStorage.getItem('investment_tracker_manual_principal');
        return saved ? parseFloat(saved) : null;
    });

    const [fundingOffset, setFundingOffset] = useState<number | null>(() => {
        const saved = localStorage.getItem('investment_tracker_funding_offset');
        return saved ? parseFloat(saved) : null;
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
            localStorage.removeItem('investment_tracker_manual_principal'); // Clear override
            setManualPrincipal(null);
            localStorage.removeItem('investment_tracker_manual_funding');
        }
    }, [transactions]);

    // --- Calculations ---
    const totalValue = useMemo(() => assets.reduce((sum, a) => sum + (a.currentValue || a.totalInvested), 0), [assets]);

    // Funding Breakdown
    const fundingBreakdown = useMemo(() => {
        return transactions.reduce((acc, t) => {
            let amount = 0;
            let currency = 'USD';

            if (t.type === 'DEPOSIT') {
                if (t.paymentCurrency) {
                    currency = t.paymentCurrency;
                    amount = t.paymentAmount || (t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0);
                } else {
                    amount = t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0;
                }
            } else if (t.type === 'WITHDRAWAL') {
                if (t.linkedTransactionId) {
                    const parent = transactions.find(Lx => Lx.id === t.linkedTransactionId);
                    if (parent && parent.paymentAmount) {
                        return acc;
                    }
                }
                amount = -(t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0);
            } else {
                return acc;
            }

            if (amount !== 0) {
                acc[currency] = (acc[currency] || 0) + amount;
            }
            return acc;
        }, {} as Record<string, number>);
    }, [transactions]);

    const groupedBreakdown = useMemo(() => {
        const grouped: Record<string, number> = {};
        Object.entries(fundingBreakdown).forEach(([currency, amount]) => {
            if (['USDT', 'USDC', 'USD', 'DAI'].includes(currency)) {
                grouped['USD Stablecoins'] = (grouped['USD Stablecoins'] || 0) + amount;
            } else {
                grouped[currency] = amount;
            }
        });

        // Apply Offset
        if (grouped['USD Stablecoins'] !== undefined) {
            grouped['USD Stablecoins'] += (fundingOffset || 0);
        } else if (fundingOffset !== null) {
            grouped['USD Stablecoins'] = fundingOffset;
        }
        return grouped;
    }, [fundingBreakdown, fundingOffset]);

    const totalPrincipal = useMemo(() => Object.values(groupedBreakdown).reduce((sum, val) => sum + val, 0), [groupedBreakdown]);
    const totalInvested = manualPrincipal !== null ? manualPrincipal : totalPrincipal;

    // Actions
    const updateManualPrincipal = (val: number | null) => {
        setManualPrincipal(val);
        if (val !== null) {
            localStorage.setItem('investment_tracker_manual_principal', val.toString());
        } else {
            localStorage.removeItem('investment_tracker_manual_principal');
        }
    };

    const updateFundingOffset = (newOffset: number | null) => {
        setFundingOffset(newOffset);
        if (newOffset !== null) {
            localStorage.setItem('investment_tracker_funding_offset', newOffset.toString());
        } else {
            localStorage.removeItem('investment_tracker_funding_offset');
        }
    };

    const resetBaseline = () => {
        localStorage.removeItem('investment_tracker_base_fix_16008_applied');
        window.location.reload();
    };

    return {
        totalInvested,
        totalValue,
        groupedBreakdown,
        manualPrincipal,
        fundingOffset,
        updateManualPrincipal,
        updateFundingOffset,
        resetBaseline
    };
};
