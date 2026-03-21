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
    assetOverrides: Record<string, { avgBuyPrice?: number; rewardTokens?: string[] }> = {},
    priceSources: Record<string, string> = {}
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
                pnlPercentage: 0,
                compoundedPrincipal: 0
            };
        }

        const asset = assets[normalizedSymbol];

        if (tx.type === 'DEPOSIT') {
            const txAmount = Number(tx.amount);
            const isStable = ['USDT', 'USDC', 'DAI', 'USDS', 'PYUSD'].includes(normalizedSymbol);
            const effectivePrice = Number(tx.pricePerUnit || (isStable ? 1 : 0));

            // For holdings-funded LP deposits (paymentAmount = 0), use pricePerUnit as cost basis
            // This tracks the LP's value correctly without inflating fresh capital
            const isHoldingsFunded = tx.paymentAmount === 0 && tx.paymentCurrency;
            const cost = tx.paymentAmount ? Number(tx.paymentAmount) : (txAmount * effectivePrice);

            // For LPs: quantity IS the total dollar value (not unit count)
            const isLP = asset.symbol.startsWith('LP') || asset.lpRange;

            if (isLP) {
                asset.quantity += cost; // Quantity = total $ invested for LPs
            } else {
                asset.quantity += txAmount; // Regular assets use actual quantity
            }

            if (tx.isCompound) {
                asset.compoundedPrincipal = (asset.compoundedPrincipal || 0) + cost;
            } else {
                // For holdings-funded LPs, we still track cost basis but mark it separately
                asset.totalInvested += cost;
                if (isHoldingsFunded) {
                    asset.fundedFromHoldings = (asset.fundedFromHoldings || 0) + cost;
                }
            }
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
                const paymentAmount = Number(tx.paymentAmount);
                const avgPrice = paymentAsset.quantity > 0 ? paymentAsset.totalInvested / paymentAsset.quantity : 0;
                paymentAsset.totalInvested -= (paymentAmount * avgPrice);
                paymentAsset.quantity -= paymentAmount;
            }

        } else if (tx.type === 'INTEREST') {
            const txAmount = Number(tx.amount);
            asset.quantity += txAmount;
            asset.earnedQuantity = (asset.earnedQuantity || 0) + txAmount;
        } else if (tx.type === 'WITHDRAWAL') {
            const txAmount = Number(tx.amount);
            const avgPrice = asset.quantity > 0 ? asset.totalInvested / asset.quantity : 0;
            asset.totalInvested -= (txAmount * avgPrice);
            asset.quantity -= txAmount;

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
        } else if (tx.type === 'SELL') {
            // SELL: Reduce the sold asset's quantity and add proceeds to payment currency
            const txAmount = Number(tx.amount);
            const avgPrice = asset.quantity > 0 ? asset.totalInvested / asset.quantity : 0;

            // Calculate realized profit/loss
            const costBasis = txAmount * avgPrice;
            const saleProceeds = tx.paymentAmount ? Number(tx.paymentAmount) : 0;
            const realizedPnL = saleProceeds - costBasis;

            // Reduce the sold asset
            asset.totalInvested -= costBasis;
            asset.quantity -= txAmount;
            asset.realizedPnL = (asset.realizedPnL || 0) + realizedPnL;

            // Sanity check for residuals
            if (asset.quantity <= 0.00000001) {
                asset.quantity = 0;
                asset.totalInvested = 0;
            }
            if (asset.totalInvested < 0.00000001) {
                asset.totalInvested = 0;
            }

            // Add proceeds to payment currency (e.g., USDT)
            if (tx.paymentCurrency && tx.paymentAmount && saleProceeds > 0) {
                const normalizedPaymentSymbol = tx.paymentCurrency.trim().toUpperCase();
                if (!assets[normalizedPaymentSymbol]) {
                    const isStable = ['USDT', 'USDC', 'DAI', 'USDS', 'PYUSD', 'FDUSD'].includes(normalizedPaymentSymbol);
                    assets[normalizedPaymentSymbol] = {
                        symbol: normalizedPaymentSymbol,
                        quantity: 0,
                        totalInvested: 0,
                        averageBuyPrice: isStable ? 1 : 0,
                        currentPrice: 0,
                        currentValue: 0,
                        unrealizedPnL: 0,
                        pnlPercentage: 0
                    };
                }
                const paymentAsset = assets[normalizedPaymentSymbol];
                paymentAsset.quantity += saleProceeds;
                // For stables, value is 1:1
                const isStable = ['USDT', 'USDC', 'DAI', 'USDS', 'PYUSD', 'FDUSD'].includes(normalizedPaymentSymbol);
                if (isStable) {
                    paymentAsset.totalInvested += saleProceeds;
                }
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
        let livePrice = prices[asset.symbol] ?? 0;
        let source: 'SATELLITE' | 'ESCALATION' | 'CACHE' | 'COST_BASIS' = 'SATELLITE';

        // Check if price comes from manual source (Scout) or fetcher (Escalation/Cache)
        const rawSource = priceSources[asset.symbol] || '';
        if (rawSource.includes('CoinGecko') || rawSource.includes('Hyperliquid') || rawSource.includes('Dex') || rawSource.includes('Binance')) {
            source = 'ESCALATION';
        }

        if (livePrice === 404) livePrice = 0; // Recovery: Treat 404 error code as 0 to trigger fallback

        asset.currentPrice = livePrice;
        asset.valuationSource = source;

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

        if (asset.currentPrice <= 0) {
            if (asset.symbol.startsWith('LP') || asset.lpRange) {
                asset.currentValue = asset.totalInvested + (asset.compoundedPrincipal || 0);
                asset.valuationSource = 'COST_BASIS';
            } else {
                // Fallback: Use average buy price if no live price is available
                asset.currentPrice = asset.averageBuyPrice;
                asset.currentValue = asset.quantity * asset.currentPrice;
                asset.valuationSource = 'COST_BASIS';
            }
        } else {
            // For LPs: manual price IS the total value (not per-unit)
            if (asset.symbol.startsWith('LP') || asset.lpRange) {
                asset.currentValue = asset.currentPrice; // Manual override is total value
                asset.valuationSource = 'SATELLITE';
            } else {
                // Regular assets: price × quantity
                asset.currentValue = asset.quantity * asset.currentPrice;
            }
        }

        // Final Source refinement: if it's cached but has no source link, it's CACHE
        if (asset.valuationSource === 'SATELLITE' && !priceSources[asset.symbol]) {
            asset.valuationSource = 'CACHE';
        }
        asset.unrealizedPnL = asset.currentValue - (asset.totalInvested + (asset.compoundedPrincipal || 0));
        // Logic: If total invested is effectively 0 (less than 1 cent), we show 0% PnL to avoid infinity
        // In the future we could show "Earned" or "N/A"
        const denominator = asset.totalInvested + (asset.compoundedPrincipal || 0);
        asset.pnlPercentage = denominator >= 0.01 ? (asset.unrealizedPnL / denominator) * 100 : 0;

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
            const isStable = ['USDT', 'USDC', 'DAI', 'USDS', 'PYUSD'].includes(tx.assetSymbol.toUpperCase());
            const effectivePrice = tx.pricePerUnit || (isStable ? 1 : 0);
            const txValue = tx.paymentAmount || (tx.amount * effectivePrice);

            if (!tx.isCompound) {
                if (tx.type === 'DEPOSIT') currentInvested += txValue;
                else if (tx.type === 'WITHDRAWAL') currentInvested -= txValue;
            }
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
            let price = prices[symbol] ?? 0;
            if (price === 404) price = 0; // Recovery: Prevent spike in history
            dailyEarningsValue += quantity * price;
        });
        earningsHistory.push({ date, value: dailyEarningsValue });
    });

    return { invested: history, earnings: earningsHistory };
};
