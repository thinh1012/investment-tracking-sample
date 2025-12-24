import { Transaction, Asset } from '../types';

/**
 * Pure function to calculate the current state of assets based on transaction history and current prices.
 * @param transactions List of all transactions
 * @param prices Current price map { symbol: price }
 * @param assetOverrides user defined overrides { symbol: { avgBuyPrice: number } }
 * @returns Array of calculated Assets
 */
export const calculateAssets = (
    transactions: Transaction[],
    prices: Record<string, number>,
    assetOverrides: Record<string, { avgBuyPrice?: number; rewardTokens?: string[] }> = {}
): Asset[] => {
    const assets: Record<string, Asset> = {};

    // Sort transactions by date asc
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTxs.forEach((tx) => {
        if (tx.type === 'TRANSFER') return;

        const normalizedSymbol = tx.assetSymbol.trim().toUpperCase();

        if (!assets[normalizedSymbol]) {
            assets[normalizedSymbol] = {
                symbol: normalizedSymbol,
                quantity: 0,
                totalInvested: 0,
                averageBuyPrice: 0,
                currentPrice: 0,
                currentValue: 0,
                unrealizedPnL: 0,
                pnlPercentage: 0
            };
        }

        const asset = assets[normalizedSymbol];

        if (tx.type === 'DEPOSIT') {
            asset.quantity += tx.amount;
            const cost = tx.amount * (tx.pricePerUnit || 0);
            asset.totalInvested += cost;
            if (tx.lpRange) asset.lpRange = tx.lpRange;
            if (tx.monitorSymbol) asset.monitorSymbol = tx.monitorSymbol;

            if (tx.paymentCurrency && tx.paymentAmount && !['USD'].includes(tx.paymentCurrency.toUpperCase())) {
                const normalizedPaymentSymbol = tx.paymentCurrency.trim().toUpperCase();
                if (!assets[normalizedPaymentSymbol]) {
                    assets[normalizedPaymentSymbol] = {
                        symbol: normalizedPaymentSymbol,
                        quantity: 0,
                        totalInvested: 0,
                        averageBuyPrice: 0,
                        currentPrice: 0,
                        currentValue: 0,
                        unrealizedPnL: 0,
                        pnlPercentage: 0
                    };
                }
                const paymentAsset = assets[normalizedPaymentSymbol];
                const avgPrice = paymentAsset.quantity > 0 ? paymentAsset.totalInvested / paymentAsset.quantity : 0;
                paymentAsset.totalInvested -= (tx.paymentAmount * avgPrice);
                paymentAsset.quantity -= tx.paymentAmount;
            }

        } else if (tx.type === 'INTEREST') {
            asset.quantity += tx.amount;
            asset.earnedQuantity = (asset.earnedQuantity || 0) + tx.amount;
        } else if (tx.type === 'WITHDRAWAL') {
            const avgPrice = asset.quantity > 0 ? asset.totalInvested / asset.quantity : 0;
            asset.totalInvested -= (tx.amount * avgPrice);
            asset.quantity -= tx.amount;

            // Sanity check for residuals
            if (asset.quantity <= 0.00000001) {
                asset.quantity = 0;
                asset.totalInvested = 0;
            }
            if (asset.totalInvested < 0.00000001) {
                asset.totalInvested = 0;
            }

            if (tx.notes && tx.notes.includes('Moved to LP')) {
                asset.lockedInLpQuantity = (asset.lockedInLpQuantity || 0) + tx.amount;
            }
        }

        if (asset.quantity > 0) {
            asset.averageBuyPrice = asset.totalInvested / asset.quantity;
        }

        // Apply Overrides
        if (assetOverrides[asset.symbol]?.avgBuyPrice !== undefined) {
            asset.averageBuyPrice = assetOverrides[asset.symbol].avgBuyPrice!;
            asset.totalInvested = asset.quantity * asset.averageBuyPrice;
        }
        if (assetOverrides[asset.symbol]?.rewardTokens) {
            asset.rewardTokens = assetOverrides[asset.symbol].rewardTokens;
        }
    });

    // Final calculations with current prices
    return Object.values(assets).map(asset => {
        const livePrice = prices[asset.symbol] ?? 0;
        asset.currentPrice = livePrice;

        // LP Monitor Logic
        if (asset.lpRange && asset.monitorSymbol) {
            let monitorPrice = 0;
            if (asset.monitorSymbol.includes('/')) {
                const [symA, symB] = asset.monitorSymbol.split('/');
                const priceA = prices[symA] ?? 0;
                const priceB = prices[symB] ?? 0;
                if (priceB > 0) monitorPrice = priceA / priceB;
            } else {
                monitorPrice = prices[asset.monitorSymbol] ?? 0;
            }
            asset.monitorPrice = monitorPrice;
            if (monitorPrice > 0) {
                asset.inRange = monitorPrice >= asset.lpRange.min && monitorPrice <= asset.lpRange.max;
            }
        }

        if (asset.currentPrice === 0 && (asset.symbol.startsWith('LP') || asset.lpRange)) {
            asset.currentValue = asset.totalInvested;
        } else {
            asset.currentValue = asset.quantity * asset.currentPrice;
        }
        asset.unrealizedPnL = asset.currentValue - asset.totalInvested;
        // Logic: If total invested is effectively 0 (less than 1 cent), we show 0% PnL to avoid infinity
        // In the future we could show "Earned" or "N/A"
        asset.pnlPercentage = asset.totalInvested >= 0.01 ? (asset.unrealizedPnL / asset.totalInvested) * 100 : 0;

        return asset;
    }).filter(a => a.quantity > 0.000001);
};

/**
 * Pure function to calculate portfolio value history and earnings history.
 */
export const calculatePortfolioHistory = (
    transactions: Transaction[],
    prices: Record<string, number>
) => {
    const dates = Array.from(new Set(transactions.map((t) => t.date))).sort();
    if (dates.length === 0) return { invested: [], earnings: [] };

    const today = new Date().toISOString().split('T')[0];
    if (dates[dates.length - 1] !== today) dates.push(today);

    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const history: { date: string; value: number }[] = [];
    let txIndex = 0;
    let currentInvested = 0;

    const earningsHistory: { date: string; value: number }[] = [];
    let earnTxIndex = 0;
    const accumulatedEarnings: Record<string, number> = {};

    dates.forEach((date) => {
        // Invested History
        while (txIndex < sortedTx.length && sortedTx[txIndex].date <= date) {
            const tx = sortedTx[txIndex];
            if (tx.type === 'DEPOSIT') currentInvested += (tx.amount * (tx.pricePerUnit || 0));
            else if (tx.type === 'WITHDRAWAL') currentInvested -= (tx.amount * (tx.pricePerUnit || 0));
            txIndex++;
        }
        history.push({ date, value: currentInvested });

        // Earnings History
        while (earnTxIndex < sortedTx.length && sortedTx[earnTxIndex].date <= date) {
            const tx = sortedTx[earnTxIndex];
            if (tx.type === 'INTEREST') accumulatedEarnings[tx.assetSymbol] = (accumulatedEarnings[tx.assetSymbol] || 0) + tx.amount;
            earnTxIndex++;
        }

        let dailyEarningsValue = 0;
        Object.entries(accumulatedEarnings).forEach(([symbol, quantity]) => {
            const price = prices[symbol] ?? 0;
            dailyEarningsValue += quantity * price;
        });
        earningsHistory.push({ date, value: dailyEarningsValue });
    });

    return { invested: history, earnings: earningsHistory };
};
