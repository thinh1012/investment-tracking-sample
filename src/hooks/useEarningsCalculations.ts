import { useMemo } from 'react';
import { Asset, Transaction } from '../types';
import {
    calculateEarningsBySource,
    enhanceEarnings,
    calculateTotalsByToken
} from '../utils/lpEarningsCalculator';

export const useEarningsCalculations = (
    assets: Asset[],
    transactions: Transaction[],
    prices: Record<string, number>
) => {
    const earningsBySource = useMemo(() => {
        return calculateEarningsBySource(assets, transactions, prices);
    }, [transactions, assets, prices]);

    const enhancedEarnings = useMemo(() => {
        return enhanceEarnings(earningsBySource, assets, transactions);
    }, [earningsBySource, assets, transactions]);

    const totalEarningsByToken = useMemo(() => {
        return calculateTotalsByToken(earningsBySource, prices);
    }, [earningsBySource, prices]);

    const totalEarningsUSD = useMemo(() => {
        return totalEarningsByToken.reduce((sum, item) => sum + item.value, 0);
    }, [totalEarningsByToken]);

    return {
        enhancedEarnings,
        totalEarningsByToken,
        totalEarningsUSD
    };
};
