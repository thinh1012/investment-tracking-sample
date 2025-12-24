import { Transaction, Asset } from '../types';

export interface LpToken {
    symbol: string;
    amount: string;
}

export interface LpProcessingResult {
    transactions: Transaction[];
    description: string;
    finalCostBasis: number;
}

export const TransactionProcessingService = {
    /**
     * Processes LP token funding logic and calculates the final cost basis.
     * Logic: Final Basis = (Sum of Basis from Holdings) + (Sum of Cost of Fresh Parts)
     */
    processLpFunding(params: {
        date: string;
        lpSymbol: string;
        tokenA: LpToken;
        sourceA: 'FRESH' | 'HOLDINGS';
        fundingSourceA: string;
        tokenB: LpToken;
        sourceB: 'FRESH' | 'HOLDINGS';
        fundingSourceB: string;
        assets: Asset[];
        freshCapitalAmount: number;
        lpTransactionId: string;
    }): LpProcessingResult {
        const {
            date, lpSymbol, tokenA, sourceA, fundingSourceA,
            tokenB, sourceB, fundingSourceB, assets,
            freshCapitalAmount, lpTransactionId
        } = params;

        let totalMovedCostBasis = 0;
        let descriptionParts: string[] = [];
        const withdrawals: Transaction[] = [];

        const processToken = (token: LpToken, source: 'FRESH' | 'HOLDINGS', fundingAssetSymbol: string) => {
            if (!token.amount || parseFloat(token.amount) <= 0) return;

            if (source === 'HOLDINGS') {
                const asset = assets.find(a => a.symbol === fundingAssetSymbol);
                if (asset) {
                    const qty = parseFloat(token.amount);
                    const costBasis = qty * asset.averageBuyPrice;
                    totalMovedCostBasis += costBasis;
                    descriptionParts.push(`${qty} ${fundingAssetSymbol} (Holdings)`);

                    // Generate Withdrawal
                    withdrawals.push({
                        id: crypto.randomUUID(),
                        date,
                        type: 'WITHDRAWAL',
                        assetSymbol: fundingAssetSymbol,
                        amount: qty,
                        pricePerUnit: asset.averageBuyPrice, // Zero Realized PnL
                        notes: `Moved to LP ${lpSymbol}`,
                        linkedTransactionId: lpTransactionId,
                    });
                }
            } else {
                descriptionParts.push(`${token.amount} ${token.symbol} (Fresh)`);
            }
        };

        processToken(tokenA, sourceA, fundingSourceA);
        processToken(tokenB, sourceB, fundingSourceB);

        // Add note about fresh capital if it wasn't tracked via tokenA/B (e.g. Total mode logic)
        if (freshCapitalAmount > 0) {
            // In some cases we don't have token symbols for fresh capital if using Total Mode
            // but if we are in Split mode, the tokens above cover it.
            // We only add this to description if it's not already covered
            const alreadyCovered = descriptionParts.some(d => d.includes('(Fresh)'));
            if (!alreadyCovered) {
                descriptionParts.push(`$${freshCapitalAmount} Fresh Capital`);
            }
        }

        const finalTotalInvested = totalMovedCostBasis + freshCapitalAmount;

        return {
            transactions: withdrawals,
            description: descriptionParts.join(' + '),
            finalCostBasis: finalTotalInvested
        };
    },

    /**
     * Processes LP funding for Total mode where a single source (asset or cash) is used.
     */
    processLpTotalFunding(params: {
        date: string;
        lpSymbol: string;
        source: 'FRESH' | 'HOLDINGS';
        fundingAssetSymbol: string;
        amount: number;
        assets: Asset[];
        lpTransactionId: string;
    }): LpProcessingResult {
        const { date, lpSymbol, source, fundingAssetSymbol, amount, assets, lpTransactionId } = params;
        const withdrawals: Transaction[] = [];
        let finalCostBasis = amount;
        let description = '';

        if (source === 'HOLDINGS') {
            const asset = assets.find(a => a.symbol === fundingAssetSymbol);
            if (asset) {
                // If we move the whole amount from holdings, the cost basis is the historical cost
                // amount here represents the VALUE we are moving.
                // However, usually the user knows HOW MANY tokens they moved.
                // Let's assume 'amount' is the quantity of the funding asset.
                const qty = amount;
                finalCostBasis = qty * asset.averageBuyPrice;
                description = `${qty} ${fundingAssetSymbol} (Holdings)`;

                withdrawals.push({
                    id: crypto.randomUUID(),
                    date,
                    type: 'WITHDRAWAL',
                    assetSymbol: fundingAssetSymbol,
                    amount: qty,
                    pricePerUnit: asset.averageBuyPrice,
                    notes: `Moved to LP ${lpSymbol}`,
                    linkedTransactionId: lpTransactionId
                });
            }
        } else {
            description = `$${amount} Fresh Capital`;
        }

        return {
            transactions: withdrawals,
            description,
            finalCostBasis
        };
    },

    /**
     * Formats batch transactions from raw input
     */
    processBatchItems(items: Array<{ symbol: string, amount: string, price: string }>, commonData: Partial<Transaction>): Transaction[] {
        return items
            .filter(item => item.symbol && item.amount && parseFloat(item.amount) > 0)
            .map(item => ({
                id: crypto.randomUUID(),
                assetSymbol: item.symbol.toUpperCase(),
                amount: parseFloat(item.amount),
                pricePerUnit: (commonData.type === 'DEPOSIT' && item.price) ? parseFloat(item.price) : undefined,
                ...commonData as any
            }));
    }
};
