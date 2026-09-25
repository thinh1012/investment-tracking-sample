import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Asset } from '../../types';
import { MixedFundingFields } from './MixedFundingFields';

interface StandardFieldsProps {
    symbol: string;
    setSymbol: (s: string) => void;
    amount: string;
    setAmount: (s: string) => void;
    price: string;
    setPrice: (s: string) => void;
    totalSpent: string;
    setTotalSpent: (s: string) => void;
    inputMode: 'QUANTITY' | 'TOTAL' | 'LP';
    paymentMode: 'CASH' | 'ASSET' | 'MIXED';
    setPaymentMode: (m: 'CASH' | 'ASSET' | 'MIXED') => void;
    paymentCurrency: string;
    setPaymentCurrency: (s: string) => void;
    isCalculating: boolean;
    handleCalculate: () => void;
    type: string;
    assets: Asset[];
    lpMode: 'TOTAL' | 'SPLIT';
    lpFundingMode: string;
    date: string;
    lpTokenA: any;
    lpTokenB: any;
    lpTokenASource: string;
    lpTokenBSource: string;

    mixedCashSymbol: string;
    setMixedCashSymbol: (s: string) => void;
    mixedCashAmount: string;
    setMixedCashAmount: (s: string) => void;
    mixedAssetSymbol: string;
    setMixedAssetSymbol: (s: string) => void;
    mixedAssetQty: string;
    setMixedAssetQty: (s: string) => void;
    rewardSplitMode?: boolean;
    isCompound?: boolean;
    setIsCompound?: (val: boolean) => void;
}

export const StandardFields: React.FC<StandardFieldsProps> = (props) => {
    const {
        symbol, setSymbol, amount, setAmount, price, setPrice,
        totalSpent, setTotalSpent, inputMode, paymentMode, setPaymentMode,
        paymentCurrency, setPaymentCurrency, isCalculating, handleCalculate,
        type, assets, lpMode, lpFundingMode,
        mixedCashSymbol, setMixedCashSymbol, mixedCashAmount, setMixedCashAmount,
        mixedAssetSymbol, setMixedAssetSymbol, mixedAssetQty, setMixedAssetQty,
        rewardSplitMode, isCompound, setIsCompound
    } = props;

    const isLp = inputMode === 'LP';
    const priceAuto = isLp && lpFundingMode === 'HOLDINGS';
    const isSell = type === 'WITHDRAWAL' || type === 'SELL';
    const showPaymentModes = type !== 'INTEREST' && !isSell && (!isLp || lpMode === 'TOTAL');
    const showCurrency = type !== 'INTEREST' && (paymentMode !== 'MIXED' || isSell) && (!isLp || lpMode === 'TOTAL');
    const sellOptions = ['USDT', 'USDC', 'USDG', 'DAI', 'USD'];
    const stables = ['USDT', 'USDC', 'USDG', 'DAI', 'USDS', 'USDE', 'USDT0', 'USDH', 'PYUSD', 'FDUSD'];
    // Buys are paid from holdings (stables first, then by value); USD = new money from outside.
    const holdingOptions = assets
        .filter(a => !a.lpRange && a.quantity > 0 && a.symbol !== 'USD')
        .sort((a, b) => Number(stables.includes(b.symbol)) - Number(stables.includes(a.symbol)) || (b.currentValue || 0) - (a.currentValue || 0))
        .map(a => a.symbol);
    const baseOptions = isSell ? sellOptions : [...holdingOptions, 'USD'];
    // Keep an existing value (e.g. editing an old tx) selectable instead of silently switching it.
    const payOptions = paymentCurrency && !baseOptions.includes(paymentCurrency) ? [paymentCurrency, ...baseOptions] : baseOptions;

    useEffect(() => {
        if (showCurrency && !paymentCurrency) setPaymentCurrency(baseOptions[0]);
    }, [showCurrency, paymentCurrency, baseOptions.join(',')]);
    const inputCls = 'block w-full min-w-0 rounded-lg border-slate-200 dark:border-slate-700 py-2 px-3 text-sm bg-white dark:bg-slate-800 dark:text-white disabled:opacity-60';
    const colLabel = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';

    const onAmount = (val: string) => {
        setAmount(val);
        if (price && val) setTotalSpent((parseFloat(val) * parseFloat(price)).toFixed(2));
    };
    const onPrice = (p: string) => {
        setPrice(p);
        if (amount && p) setTotalSpent((parseFloat(amount) * parseFloat(p)).toFixed(2));
    };
    const onTotal = (t: string) => {
        setTotalSpent(t);
        if (amount && t && parseFloat(amount) > 0) setPrice((parseFloat(t) / parseFloat(amount)).toFixed(8));
        else if (price && t && parseFloat(price) > 0) setAmount((parseFloat(t) / parseFloat(price)).toFixed(8));
    };

    const totalLabel = type === 'INTEREST'
        ? 'Earned value (USD)'
        : isLp && lpFundingMode === 'CUSTOM' ? 'Fresh capital' : isSell ? 'Received' : 'Paid with';

    return (
        <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <div className={`grid gap-2 ${type === 'INTEREST' && rewardSplitMode ? 'grid-cols-1' : 'grid-cols-[1.3fr_1fr_1.3fr]'}`}>
                    <div>
                        <label className={colLabel}>{type === 'INTEREST' ? 'Source asset / LP' : 'Symbol'}</label>
                        <input
                            type="text"
                            required
                            placeholder="BTC"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            className={`${inputCls} uppercase placeholder:normal-case font-medium`}
                        />
                    </div>
                    {!(type === 'INTEREST' && rewardSplitMode) && (
                        <>
                            <div>
                                <label className={colLabel}>Qty</label>
                                <input
                                    type="number"
                                    step="any"
                                    required={!isLp}
                                    placeholder={isLp ? '1' : '0.00'}
                                    value={amount}
                                    onChange={(e) => onAmount(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label className={colLabel}>
                                    {type === 'INTEREST' ? 'Market price' : isLp ? (priceAuto ? 'Cost basis' : 'Unit price') : 'Price'}
                                </label>
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        disabled={priceAuto}
                                        value={priceAuto ? '' : price}
                                        placeholder={priceAuto ? 'Auto' : '0.00'}
                                        onChange={(e) => onPrice(e.target.value)}
                                        className={inputCls}
                                    />
                                    {!isLp && (
                                        <button
                                            type="button"
                                            onClick={handleCalculate}
                                            disabled={isCalculating || !symbol}
                                            title="Fetch current price"
                                            className="px-2 shrink-0 text-slate-500 hover:text-indigo-500 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
                                        >
                                            <RefreshCw className={isCalculating ? 'animate-spin' : ''} size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {!(type === 'INTEREST' && rewardSplitMode) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{totalLabel}</span>
                        {showPaymentModes && (
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0">
                                {(['ASSET', 'MIXED'] as const).map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => { setPaymentMode(m); setIsCompound?.(false); }}
                                        className={`px-2 py-0.5 text-[10px] font-bold ${paymentMode === m ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {paymentMode === 'MIXED' && showPaymentModes ? (
                        <MixedFundingFields
                            mixedCashSymbol={mixedCashSymbol} setMixedCashSymbol={setMixedCashSymbol}
                            mixedCashAmount={mixedCashAmount} setMixedCashAmount={setMixedCashAmount}
                            mixedAssetSymbol={mixedAssetSymbol} setMixedAssetSymbol={setMixedAssetSymbol}
                            mixedAssetQty={mixedAssetQty} setMixedAssetQty={setMixedAssetQty}
                            assets={assets}
                        />
                    ) : (
                        <div className="flex gap-2">
                            {showCurrency && (
                                <select
                                    value={paymentCurrency}
                                    onChange={(e) => { setPaymentCurrency(e.target.value); if (e.target.value !== 'USD') setIsCompound?.(false); }}
                                    className="shrink-0 w-auto rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold uppercase bg-white dark:bg-slate-800 dark:text-white py-2 px-2"
                                >
                                    {payOptions.map(curr => <option key={curr} value={curr}>{curr === 'USD' ? (isSell ? 'USD (fiat)' : 'USD (new money)') : curr}</option>)}
                                </select>
                            )}
                            <input
                                type="number"
                                step="any"
                                value={totalSpent}
                                disabled={priceAuto}
                                placeholder={priceAuto ? 'Auto' : 'Total 0.00'}
                                onChange={(e) => onTotal(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    )}

                    {isSell && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {paymentCurrency === 'USD' ? 'Cashed out to fiat: no token balance is credited.' : `Credits your ${paymentCurrency} balance.`}
                        </p>
                    )}

                    {type === 'DEPOSIT' && setIsCompound && paymentMode !== 'MIXED' && paymentCurrency === 'USD' && !isLp && (
                        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!isCompound}
                                onChange={(e) => setIsCompound(e.target.checked)}
                                className="border-slate-300 dark:border-slate-600"
                            />
                            Paid with claimed rewards (not new money)
                        </label>
                    )}
                </div>
            )}
        </div>
    );
};
