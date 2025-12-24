import { TransactionProcessingService } from '../services/TransactionProcessingService';
import { getHistoricalPrice } from '../services/priceService';
import { Asset, Transaction } from '../types';

export const useTransactionFormHandlers = (state: any, props: any) => {
    const {
        symbol, setSymbol,
        amount, setAmount,
        price, setPrice,
        date, setDate,
        displayDate, setDisplayDate,
        totalSpent, setTotalSpent,
        setIsCalculating,
        type,
        mode,
        rewardSplitMode, rewards,
        inputMode, lpMode,
        lpTokenA, lpTokenB,
        lpTokenASource, lpTokenBSource,
        fundingSourceA, fundingSourceB,
        interestType, platform, source,
        relatedAssetSymbol, relatedAssetSymbols,
        notes, paymentMode, paymentCurrency, paymentAmount,
        lpRangeMin, lpRangeMax, monitorSymbol,
        mixedCashSymbol, mixedCashAmount, mixedAssetSymbol, mixedAssetQty,
        batchItems, setBatchItems
    } = state;

    const { onSave, onClose, assets, onUpdateAssetConfig, initialData } = props;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/[^0-9/.]/.test(val)) return;

        setDisplayDate(val);

        const match = val.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})$/);

        if (match) {
            const parts = val.split(/[/.]/);
            if (parts.length === 3) {
                const d = parts[0].padStart(2, '0');
                const m = parts[1].padStart(2, '0');
                let y = parts[2];

                if (y.length === 2) {
                    y = '20' + y;
                }

                if (y.length === 4) {
                    setDate(`${y}-${m}-${d}`);
                }
            }
        }
    };

    const handleCalculate = async () => {
        if (!symbol || !date) {
            alert("Please enter Symbol and Date.");
            return;
        }

        setIsCalculating(true);
        const historicalPrice = await getHistoricalPrice(symbol, date, 'CLOSE');
        setIsCalculating(false);

        if (historicalPrice) {
            setPrice(historicalPrice.toString());

            if (amount && parseFloat(amount) > 0) {
                setTotalSpent((parseFloat(amount) * historicalPrice).toFixed(2));
            } else if (totalSpent && parseFloat(totalSpent) > 0) {
                const calculatedAmount = parseFloat(totalSpent) / historicalPrice;
                setAmount(calculatedAmount.toFixed(8));
            }
        } else {
            alert(`Could not fetch historical price for ${symbol} on ${date}. Please enter manually.`);
        }
    };

    const addBatchItem = () => {
        setBatchItems([...batchItems, { symbol: '', amount: '', price: '' }]);
    };

    const removeBatchItem = (index: number) => {
        if (batchItems.length > 1) {
            setBatchItems(batchItems.filter((_: any, i: number) => i !== index));
        }
    };

    const updateBatchItem = (index: number, field: string, value: string) => {
        const newItems = [...batchItems];
        (newItems[index] as any)[field] = value;
        setBatchItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Handle LP Rewards Split
        if (type === 'INTEREST' && rewardSplitMode) {
            const validRewards = rewards.filter((r: any) => r.symbol && r.amount && parseFloat(r.amount) > 0);
            if (validRewards.length === 0) {
                alert("Please enter at least one reward amount.");
                return;
            }

            // Save Config if changed
            const enteredSymbols = rewards.map((r: any) => r.symbol.toUpperCase()).filter((s: string) => s);
            const targetAssetSymbol = (relatedAssetSymbol || symbol || '').toUpperCase();

            if (enteredSymbols.length > 0 && onUpdateAssetConfig && targetAssetSymbol) {
                const asset = assets.find((a: Asset) => a.symbol === targetAssetSymbol);
                const currentConfig = asset?.rewardTokens || [];
                const isDifferent = JSON.stringify(enteredSymbols.sort()) !== JSON.stringify([...currentConfig].sort());
                if (isDifferent) {
                    onUpdateAssetConfig(targetAssetSymbol, { rewardTokens: enteredSymbols });
                }
            }

            validRewards.forEach((reward: any) => {
                onSave({
                    id: crypto.randomUUID(),
                    date,
                    type: 'INTEREST',
                    assetSymbol: reward.symbol.toUpperCase(),
                    amount: parseFloat(reward.amount),
                    interestType,
                    platform,
                    relatedAssetSymbol: targetAssetSymbol,
                    notes: `Reward from ${targetAssetSymbol}`
                });
            });
            onClose();
            return;
        }

        const commonData = {
            date,
            type,
            interestType: type === 'INTEREST' ? interestType : undefined,
            platform: (type === 'INTEREST' || type === 'TRANSFER') ? platform : undefined,
            source: type === 'TRANSFER' ? source : undefined,
            relatedAssetSymbol: (type === 'INTEREST' && relatedAssetSymbols.length === 0 && relatedAssetSymbol) ? relatedAssetSymbol : undefined,
            relatedAssetSymbols: (type === 'INTEREST' && relatedAssetSymbols.length > 0) ? relatedAssetSymbols : undefined,
            notes: (inputMode === 'LP' && lpMode === 'SPLIT')
                ? `LP Composition: ${lpTokenA.amount} ${lpTokenA.symbol} + ${lpTokenB.amount} ${lpTokenB.symbol}`
                : notes,
            paymentCurrency: (paymentMode === 'ASSET' || paymentMode === 'CASH') ? paymentCurrency : (paymentMode === 'MIXED' ? mixedCashSymbol : undefined),
            paymentAmount: (paymentMode === 'ASSET' && totalSpent) ? parseFloat(totalSpent) : ((paymentMode === 'CASH' && totalSpent) ? parseFloat(totalSpent) : (paymentMode === 'MIXED' && mixedCashAmount ? parseFloat(mixedCashAmount) : undefined)),
            lpRange: (inputMode === 'LP' && lpRangeMin && lpRangeMax) ? { min: parseFloat(lpRangeMin), max: parseFloat(lpRangeMax) } : undefined,
            monitorSymbol: (inputMode === 'LP' && monitorSymbol) ? monitorSymbol.toUpperCase() : undefined,
        };

        if (mode === 'SINGLE') {
            if (inputMode === 'LP') {
                const newLpTransactionId = crypto.randomUUID();

                // Use Service for LP calculation
                const result = lpMode === 'SPLIT'
                    ? TransactionProcessingService.processLpFunding({
                        date,
                        lpSymbol: symbol.toUpperCase(),
                        tokenA: lpTokenA,
                        sourceA: lpTokenASource,
                        fundingSourceA,
                        tokenB: lpTokenB,
                        sourceB: lpTokenBSource,
                        fundingSourceB,
                        assets,
                        freshCapitalAmount: parseFloat(totalSpent) || 0,
                        lpTransactionId: newLpTransactionId
                    })
                    : TransactionProcessingService.processLpTotalFunding({
                        date,
                        lpSymbol: symbol.toUpperCase(),
                        source: lpTokenASource,
                        fundingAssetSymbol: fundingSourceA,
                        amount: lpTokenASource === 'HOLDINGS' ? (assets.find((a: Asset) => a.symbol === fundingSourceA)?.quantity || 0) : (parseFloat(totalSpent) || 0),
                        assets,
                        lpTransactionId: newLpTransactionId
                    });

                // Handle additional mixed funding for TOTAL mode if needed (withdrawals)
                if (lpMode === 'TOTAL' && paymentMode === 'MIXED' && mixedAssetSymbol && mixedAssetQty) {
                    const asset = assets.find((a: Asset) => a.symbol === mixedAssetSymbol);
                    if (asset) {
                        const qty = parseFloat(mixedAssetQty);
                        onSave({
                            id: crypto.randomUUID(),
                            date,
                            type: 'WITHDRAWAL',
                            assetSymbol: mixedAssetSymbol,
                            amount: qty,
                            pricePerUnit: asset.averageBuyPrice,
                            notes: `Moved to LP ${symbol}`,
                            linkedTransactionId: newLpTransactionId
                        });
                    }
                }

                // Save withdrawals from service
                result.transactions.forEach(tx => onSave(tx));

                // Save LP Deposit
                onSave({
                    id: newLpTransactionId,
                    ...commonData,
                    // If we already generated a withdrawal (HOLDINGS), don't subtract again via paymentAmount
                    paymentAmount: (lpTokenASource === 'HOLDINGS' || lpTokenBSource === 'HOLDINGS') ? 0 : commonData.paymentAmount,
                    type: 'DEPOSIT',
                    assetSymbol: symbol.toUpperCase(),
                    amount: 1, // Traditional representation for LP position unit
                    pricePerUnit: result.finalCostBasis,
                    notes: `Pool Creation: ${result.description}`,
                    lpRange: commonData.lpRange || undefined,
                    monitorSymbol: commonData.monitorSymbol || undefined
                });
                onClose();
                return;
            }

            // Standard Single Mode
            if (type === 'DEPOSIT' && paymentMode === 'MIXED') {
                const newTxId = crypto.randomUUID();
                let assetCostBasis = 0;
                let notesToAdd = '';

                if (mixedAssetSymbol && mixedAssetQty) {
                    const asset = assets.find((a: Asset) => a.symbol === mixedAssetSymbol);
                    if (asset) {
                        const qty = parseFloat(mixedAssetQty);
                        assetCostBasis = qty * asset.averageBuyPrice;
                        notesToAdd = `Funded with ${qty} ${mixedAssetSymbol} (Holdings)`;
                        onSave({
                            id: crypto.randomUUID(),
                            date,
                            type: 'WITHDRAWAL',
                            assetSymbol: mixedAssetSymbol,
                            amount: qty,
                            pricePerUnit: asset.averageBuyPrice,
                            notes: `Used to buy ${symbol}`,
                            linkedTransactionId: newTxId
                        });
                    }
                }

                const fresh = parseFloat(mixedCashAmount) || 0;
                if (fresh > 0) {
                    notesToAdd += (notesToAdd ? ' + ' : 'Funded with ') + `${fresh} ${mixedCashSymbol} (Fresh)`;
                }

                const finalAmount = parseFloat(amount) || 0;
                onSave({
                    id: newTxId,
                    ...commonData,
                    type: 'DEPOSIT',
                    assetSymbol: symbol.toUpperCase(),
                    amount: finalAmount,
                    pricePerUnit: (assetCostBasis + fresh) / finalAmount,
                    notes: `${notesToAdd}. ${commonData.notes || ''}`
                });
                onClose();
                return;
            }

            onSave({
                id: initialData ? initialData.id : crypto.randomUUID(),
                assetSymbol: symbol.toUpperCase(),
                amount: parseFloat(amount) || 0,
                pricePerUnit: type === 'DEPOSIT' ? (parseFloat(price) || undefined) : undefined,
                ...commonData
            });
        } else {
            // Batch Mode
            const batchTxs = TransactionProcessingService.processBatchItems(batchItems, commonData);
            batchTxs.forEach(tx => onSave(tx));
        }

        onClose();
    };

    return {
        handleDateChange,
        handleCalculate,
        handleSubmit,
        addBatchItem,
        removeBatchItem,
        updateBatchItem
    };
};
