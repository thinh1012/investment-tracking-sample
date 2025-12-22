import { useState, useEffect } from 'react';
import { Transaction, TransactionType, InterestType, Asset } from '../types';

export interface DefaultValues {
    assetSymbol?: string;
    relatedAssetSymbol?: string;
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
            if (initialData.relatedAssetSymbol) {
                setRelatedAssetSymbol(initialData.relatedAssetSymbol);
                setRelatedAssetSymbols([initialData.relatedAssetSymbol]);
            }
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
            if (defaultValues.relatedAssetSymbol) {
                setSymbol(defaultValues.relatedAssetSymbol); // Ensure primary symbol is set to the Source LP
                setRelatedAssetSymbol(defaultValues.relatedAssetSymbol);
                setRelatedAssetSymbols([defaultValues.relatedAssetSymbol]);

                // For LP-specific claims, default to FARMING
                if (defaultValues.relatedAssetSymbol.toUpperCase().startsWith('LP') ||
                    defaultValues.relatedAssetSymbol.includes('/') ||
                    defaultValues.relatedAssetSymbol.includes('-')) {
                    setInterestType('FARMING');
                }
            }
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

        if (type === 'INTEREST' && (symbol || relatedAssetSymbol)) {
            const targetSymbol = symbol || relatedAssetSymbol;
            const asset = assets.find(a => a.symbol === targetSymbol.toUpperCase());

            if (asset && asset.rewardTokens && asset.rewardTokens.length > 0) {
                setRewardSplitMode(true);
                setRewards(asset.rewardTokens.map(token => ({ symbol: token, amount: '' })));
            } else if (targetSymbol.toUpperCase().startsWith('LP') || targetSymbol.includes('POOL') || targetSymbol.includes('SWAP') || targetSymbol.includes('/') || targetSymbol.includes('-')) {
                setRewardSplitMode(true);

                // Smart Inference: Try to guess tokens from symbol if no config found
                const parts = targetSymbol.split(/[\s\-\/]+/);
                const tokens = parts.filter(p =>
                    p.length >= 3 &&
                    !['LP', 'SWAP', 'POOL', 'PRJX', 'V3', 'V2'].includes(p.toUpperCase()) &&
                    isNaN(Number(p))
                );

                if (tokens.length > 0) {
                    setRewards(tokens.map(t => ({ symbol: t.toUpperCase(), amount: '' })));
                }
            } else {
                setRewardSplitMode(false);
            }
        } else {
            setRewardSplitMode(false);
        }
    }, [symbol, relatedAssetSymbol, type, assets, isOpen]);

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
