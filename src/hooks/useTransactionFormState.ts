import { useState, useEffect } from 'react';
import { Transaction, TransactionType, InterestType, Asset } from '../types';

export interface DefaultValues {
    assetSymbol?: string;
    inputMode?: 'QUANTITY' | 'TOTAL' | 'LP';
    type?: TransactionType;
}

export interface BatchItem {
    symbol: string;
    amount: string;
    price: string;
}

export const useTransactionFormState = (params: {
    initialData?: Transaction | null;
    defaultValues?: DefaultValues | null;
    assets: Asset[];
    isOpen: boolean;
}) => {
    const { initialData, defaultValues, assets, isOpen } = params;

    const [mode, setMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
    const [type, setType] = useState<TransactionType>('DEPOSIT');

    // Single Mode State
    const [symbol, setSymbol] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');

    // Auto-Calculation State
    const [inputMode, setInputMode] = useState<'QUANTITY' | 'TOTAL' | 'LP'>('QUANTITY');
    const [totalSpent, setTotalSpent] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);

    // Batch Mode State
    const [batchItems, setBatchItems] = useState<BatchItem[]>([{ symbol: '', amount: '', price: '' }]);

    // Shared State
    const [interestType, setInterestType] = useState<InterestType>('STAKING');
    const [platform, setPlatform] = useState('');
    const [source, setSource] = useState('');
    const [relatedAssetSymbol, setRelatedAssetSymbol] = useState('');
    const [relatedAssetSymbols, setRelatedAssetSymbols] = useState<string[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentCurrency, setPaymentCurrency] = useState<string>('USDT');
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'ASSET' | 'MIXED'>('CASH');
    const [mixedCashAmount, setMixedCashAmount] = useState('');
    const [mixedCashSymbol, setMixedCashSymbol] = useState('USDT');
    const [mixedAssetSymbol, setMixedAssetSymbol] = useState('');
    const [mixedAssetQty, setMixedAssetQty] = useState('');

    // LP Rewards State
    const [rewardSplitMode, setRewardSplitMode] = useState(false);
    const [rewards, setRewards] = useState<{ symbol: string; amount: string }[]>([
        { symbol: '', amount: '' },
        { symbol: '', amount: '' }
    ]);

    // LP Split State
    const [lpMode, setLpMode] = useState<'TOTAL' | 'SPLIT'>('TOTAL');
    const [lpTokenASource, setLpTokenASource] = useState<'FRESH' | 'HOLDINGS'>('FRESH');
    const [lpTokenBSource, setLpTokenBSource] = useState<'FRESH' | 'HOLDINGS'>('FRESH');
    const [fundingSourceA, setFundingSourceA] = useState('');
    const [fundingSourceB, setFundingSourceB] = useState('');
    const [lpTokenA, setLpTokenA] = useState({ symbol: '', amount: '' });
    const [lpTokenB, setLpTokenB] = useState({ symbol: '', amount: '' });
    const [lpRangeMin, setLpRangeMin] = useState('');
    const [lpRangeMax, setLpRangeMax] = useState('');
    const [monitorSymbol, setMonitorSymbol] = useState('');
    const [notes, setNotes] = useState('');

    // Date Display State (dd/mm/yyyy)
    const [displayDate, setDisplayDate] = useState(() => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    });

    // Populate Initial Data or Default Values
    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setMode('SINGLE');
            setType(initialData.type);
            setSymbol(initialData.assetSymbol);
            setAmount(initialData.amount.toString());
            setPrice(initialData.pricePerUnit ? initialData.pricePerUnit.toString() : '');
            if (initialData.interestType) setInterestType(initialData.interestType);
            if (initialData.platform) setPlatform(initialData.platform);
            if (initialData.source) setSource(initialData.source);
            if (initialData.relatedAssetSymbol) setRelatedAssetSymbol(initialData.relatedAssetSymbol);
            if (initialData.notes) setNotes(initialData.notes);
            if (initialData.lpRange) {
                setLpRangeMin(initialData.lpRange.min.toString());
                setLpRangeMax(initialData.lpRange.max.toString());
            }
            if (initialData.monitorSymbol) setMonitorSymbol(initialData.monitorSymbol);
            if (initialData.paymentCurrency) setPaymentCurrency(initialData.paymentCurrency);

            setDate(initialData.date);
            const [y, m, d] = initialData.date.split('-');
            setDisplayDate(`${d}/${m}/${y}`);
        } else if (defaultValues) {
            if (defaultValues.assetSymbol) setSymbol(defaultValues.assetSymbol);
            if (defaultValues.inputMode) setInputMode(defaultValues.inputMode);
            if (defaultValues.type) setType(defaultValues.type);
        } else {
            // Reset for new entry
            setSymbol('');
            setAmount('');
            setPrice('');
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            setDisplayDate(`${dd}/${mm}/${yyyy}`);
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [initialData, defaultValues, isOpen]);

    // Auto-Populate Reward Tokens from Asset Config
    useEffect(() => {
        if (!isOpen) return;

        if (type === 'INTEREST' && symbol) {
            const asset = assets.find(a => a.symbol === symbol.toUpperCase());
            if (asset && asset.rewardTokens && asset.rewardTokens.length > 0) {
                setRewardSplitMode(true);
                setRewards(prev => {
                    const newRewards = [...prev];
                    while (newRewards.length < asset.rewardTokens!.length) {
                        newRewards.push({ symbol: '', amount: '' });
                    }
                    asset.rewardTokens!.forEach((token, idx) => {
                        newRewards[idx] = { ...newRewards[idx], symbol: token };
                    });
                    return newRewards;
                });
            } else if (symbol.toUpperCase().startsWith('LP') || symbol.includes('POOL')) {
                setRewardSplitMode(true);
            } else {
                setRewardSplitMode(false);
            }
        } else {
            setRewardSplitMode(false);
        }
    }, [symbol, type, assets, isOpen]);

    // Auto-calc LP total from stablecoin side
    useEffect(() => {
        if (inputMode === 'LP' && lpMode === 'SPLIT') {
            const isStable = (s: string) => ['USDT', 'USDC', 'DAI', 'BUSD'].includes(s.toUpperCase());
            let stableVal = 0;

            if (isStable(lpTokenA.symbol) && lpTokenA.amount) stableVal = parseFloat(lpTokenA.amount);
            else if (isStable(lpTokenB.symbol) && lpTokenB.amount) stableVal = parseFloat(lpTokenB.amount);

            if (stableVal > 0) {
                setTotalSpent((stableVal * 2).toString());
            }
        }
    }, [lpTokenA, lpTokenB, inputMode, lpMode]);

    return {
        // Mode & Type
        mode, setMode,
        type, setType,

        // Single Mode
        symbol, setSymbol,
        amount, setAmount,
        price, setPrice,

        // Auto-Calculation
        inputMode, setInputMode,
        totalSpent, setTotalSpent,
        isCalculating, setIsCalculating,

        // Batch Mode
        batchItems, setBatchItems,

        // Shared/Common
        interestType, setInterestType,
        platform, setPlatform,
        source, setSource,
        relatedAssetSymbol, setRelatedAssetSymbol,
        relatedAssetSymbols, setRelatedAssetSymbols,
        date, setDate,
        displayDate, setDisplayDate,
        paymentCurrency, setPaymentCurrency,
        paymentMode, setPaymentMode,
        notes, setNotes,

        // Mixed Mode
        mixedCashAmount, setMixedCashAmount,
        mixedCashSymbol, setMixedCashSymbol,
        mixedAssetSymbol, setMixedAssetSymbol,
        mixedAssetQty, setMixedAssetQty,

        // Rewards
        rewardSplitMode, setRewardSplitMode,
        rewards, setRewards,

        // LP Token Split
        lpMode, setLpMode,
        lpTokenASource, setLpTokenASource,
        lpTokenBSource, setLpTokenBSource,
        fundingSourceA, setFundingSourceA,
        fundingSourceB, setFundingSourceB,
        lpTokenA, setLpTokenA,
        lpTokenB, setLpTokenB,
        lpRangeMin, setLpRangeMin,
        lpRangeMax, setLpRangeMax,
        monitorSymbol, setMonitorSymbol
    };
};
