import { Asset, Transaction } from '../types';

export interface EarningsBySourceItem {
    source: string;
    sourceSymbols: string[];
    tokens: Record<string, number>;
    totalValue: number;
    transactions: Transaction[];
}

export interface EnhancedEarningsItem extends EarningsBySourceItem {
    roi: number | null;
    apr: number | null;
    totalInvested: number;
    daysActive: number;
}

export const calculateEarningsBySource = (
    assets: Asset[],
    transactions: Transaction[],
    prices: Record<string, number>
): Record<string, EarningsBySourceItem> => {
    return transactions
        .filter(t => {
            if (t.type !== 'INTEREST') return false;
            let sources: string[] = [];
            if (t.relatedAssetSymbols && t.relatedAssetSymbols.length > 0) {
                sources = t.relatedAssetSymbols;
            } else if (t.relatedAssetSymbol) {
                sources = [t.relatedAssetSymbol];
            }

            if (sources.length === 0) return false;

            return sources.some(symbol => {
                const asset = assets.find(a => a.symbol === symbol);
                return (asset && asset.lpRange) ||
                    symbol.toUpperCase().startsWith('LP') ||
                    symbol.includes('/') ||
                    symbol.includes('-') ||
                    symbol.toUpperCase().includes('POOL');
            });
        })
        .reduce((acc, t) => {
            let sourceKey = 'Other';
            let currentSourceSymbols: string[] = [];

            if (t.relatedAssetSymbols && t.relatedAssetSymbols.length > 0) {
                currentSourceSymbols = [...t.relatedAssetSymbols].sort();
                sourceKey = currentSourceSymbols.join(' + ');
            } else if (t.relatedAssetSymbol) {
                currentSourceSymbols = [t.relatedAssetSymbol];
                sourceKey = t.relatedAssetSymbol;
            } else if (t.platform) {
                sourceKey = t.platform;
            }

            if (!acc[sourceKey]) {
                acc[sourceKey] = {
                    source: sourceKey,
                    sourceSymbols: currentSourceSymbols,
                    tokens: {},
                    totalValue: 0,
                    transactions: []
                };
            }

            const symbolKey = t.assetSymbol.trim().toUpperCase();
            if (!acc[sourceKey].tokens[symbolKey]) {
                acc[sourceKey].tokens[symbolKey] = 0;
            }
            acc[sourceKey].tokens[symbolKey] += t.amount;

            const price = prices?.[t.assetSymbol] || 0;
            acc[sourceKey].totalValue += t.amount * price;
            acc[sourceKey].transactions.push(t);

            return acc;
        }, {} as Record<string, EarningsBySourceItem>);
};

export const enhanceEarnings = (
    earningsBySource: Record<string, EarningsBySourceItem>,
    assets: Asset[],
    transactions: Transaction[]
): EnhancedEarningsItem[] => {
    return Object.values(earningsBySource).map(item => {
        let roi = null;
        let apr = null;
        let daysActive = 0;
        let totalInvested = 0;

        const symbolsToCheck = (item.sourceSymbols && item.sourceSymbols.length > 0)
            ? item.sourceSymbols
            : [item.source];

        symbolsToCheck.forEach(symbol => {
            const asset = assets.find(a => a.symbol === symbol);

            if (asset && asset.totalInvested > 0) {
                totalInvested += asset.totalInvested;
            } else {
                const symbolInvested = transactions
                    .filter(t => (t.type === 'DEPOSIT' || t.type === 'BUY') && (t.assetSymbol === symbol))
                    .reduce((sum, t) => {
                        const cost = t.paymentAmount || (t.amount * (t.pricePerUnit || 0));
                        return sum + cost;
                    }, 0);
                totalInvested += symbolInvested;
            }
        });

        if (totalInvested > 0) {
            roi = (item.totalValue / totalInvested) * 100;

            const firstTx = transactions
                .filter(t => {
                    const isDeposit = t.type === 'DEPOSIT' || t.type === 'BUY';
                    if (!isDeposit) return false;

                    return symbolsToCheck.some(s =>
                        t.assetSymbol === s ||
                        t.relatedAssetSymbol === s ||
                        (t.relatedAssetSymbols && t.relatedAssetSymbols.includes(s))
                    );
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (firstTx) {
                const start = new Date(firstTx.date).getTime();
                const now = new Date().getTime();
                const diffTime = Math.abs(now - start);
                daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (daysActive > 0) {
                    apr = (roi / daysActive) * 365;
                }
            }
        }

        return { ...item, roi, apr, totalInvested, daysActive } as EnhancedEarningsItem;
    });
};

export const calculateTotalsByToken = (
    earningsBySource: Record<string, EarningsBySourceItem>,
    prices: Record<string, number>
) => {
    const totals: Record<string, { quantity: number; value: number }> = {};
    Object.values(earningsBySource).forEach(source => {
        Object.entries(source.tokens).forEach(([token, amount]) => {
            if (!totals[token]) totals[token] = { quantity: 0, value: 0 };
            totals[token].quantity += amount;
            totals[token].value += (amount * (prices[token] || 0));
        });
    });
    return Object.entries(totals)
        .sort((a, b) => b[1].value - a[1].value)
        .map(([token, data]) => ({ token, ...data }));
};
