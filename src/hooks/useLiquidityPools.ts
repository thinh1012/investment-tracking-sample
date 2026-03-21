import { useState, useMemo } from 'react';
import { Asset, Transaction } from '../types';

interface UseLiquidityPoolsProps {
    assets: Asset[];
    transactions: Transaction[];
}

export const useLiquidityPools = ({ assets, transactions }: UseLiquidityPoolsProps) => {
    const [lpSortKey, setLpSortKey] = useState<string>('rangeStatus');
    const [lpSortOrder, setLpSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleLpSort = (key: string) => {
        if (lpSortKey === key) {
            setLpSortOrder(lpSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setLpSortKey(key);
            setLpSortOrder('desc');
        }
    };

    const getEarningsValue = (asset: Asset) => {
        const rewards = transactions.filter(t => {
            if (t.type !== 'INTEREST') return false;
            return t.relatedAssetSymbol === asset.symbol || (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(asset.symbol));
        });
        return rewards.reduce((sum, t) => {
            const rewardPrice = assets.find(a => a.symbol === t.assetSymbol.toUpperCase())?.currentPrice || 0;
            return sum + (t.amount * rewardPrice);
        }, 0);
    };

    const lpAssets = useMemo(() => {
        const filtered = assets.filter(a =>
            a.symbol.toUpperCase().startsWith('LP') ||
            a.symbol.includes('/') ||
            a.symbol.includes('-') ||
            a.symbol.toUpperCase().includes('POOL') ||
            (a.lpRange && a.symbol.includes(' '))
        );

        return [...filtered].sort((a, b) => {
            const order = lpSortOrder === 'asc' ? 1 : -1;
            const secondaryOrder = -1; // Always descending value for ties

            let result = 0;
            if (lpSortKey === 'symbol') {
                result = a.symbol.localeCompare(b.symbol) * order;
            } else if (lpSortKey === 'rangeStatus') {
                const statA = a.inRange ? 2 : (a.lpRange ? 1 : 0);
                const statB = b.inRange ? 2 : (b.lpRange ? 1 : 0);
                result = (statA - statB) * order;
            } else if (lpSortKey === 'totalInvested') {
                result = (a.totalInvested - b.totalInvested) * order;
            } else if (lpSortKey === 'earnings') {
                result = (getEarningsValue(a) - getEarningsValue(b)) * order;
            } else if (lpSortKey === 'currentValue') {
                result = ((a.currentValue || 0) - (b.currentValue || 0)) * order;
            }

            // Secondary Sort: Current Value Descending
            if (result === 0) {
                result = ((a.currentValue || 0) - (b.currentValue || 0)) * secondaryOrder;
            }

            return result;
        });
    }, [assets, transactions, lpSortKey, lpSortOrder]);

    const getRewardsForAsset = (asset: Asset) => {
        const rewards = transactions.filter(t => {
            if (t.type !== 'INTEREST') return false;
            return t.relatedAssetSymbol === asset.symbol ||
                (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(asset.symbol));
        });

        const rewardTotals = rewards.reduce((acc, t) => {
            const sym = t.assetSymbol.trim().toUpperCase();
            acc[sym] = (acc[sym] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(rewardTotals).sort().map(sym => ({
            symbol: sym,
            amount: rewardTotals[sym]
        }));
    };

    return {
        lpAssets,
        lpSortKey,
        lpSortOrder,
        handleLpSort,
        getRewardsForAsset
    };
};
