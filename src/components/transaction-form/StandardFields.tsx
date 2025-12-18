import React from 'react';
import { RefreshCw, Calculator } from 'lucide-react';
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
}

export const StandardFields: React.FC<StandardFieldsProps> = (props) => {
    const {
        symbol, setSymbol, amount, setAmount, price, setPrice,
        totalSpent, setTotalSpent, inputMode, paymentMode, setPaymentMode,
        paymentCurrency, setPaymentCurrency, isCalculating, handleCalculate,
        type, assets, lpMode, lpFundingMode,
        mixedCashSymbol, setMixedCashSymbol, mixedCashAmount, setMixedCashAmount,
        mixedAssetSymbol, setMixedAssetSymbol, mixedAssetQty, setMixedAssetQty
    } = props;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Asset Symbol</label>
                <input
                    type="text"
                    required
                    placeholder="e.g. BTC"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 uppercase placeholder:normal-case font-medium tracking-wide bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
            </div>

            <div className="md:col-span-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex gap-4 items-start">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            {inputMode === 'LP' ? (lpFundingMode === 'HOLDINGS' ? 'Cost Basis (Auto)' : 'Implied Unit Price') : 'Price Per Unit'}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="any"
                                required
                                disabled={inputMode === 'LP' && lpFundingMode === 'HOLDINGS'}
                                value={inputMode === 'LP' && lpFundingMode === 'HOLDINGS' ? '' : price}
                                placeholder={inputMode === 'LP' && lpFundingMode === 'HOLDINGS' ? 'Auto-Calculated' : "0.00"}
                                onChange={(e) => {
                                    const p = e.target.value;
                                    setPrice(p);
                                    if (amount && p) setTotalSpent((parseFloat(amount) * parseFloat(p)).toFixed(2));
                                }}
                                className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-all font-medium disabled:opacity-70"
                            />
                            {inputMode !== 'LP' && (
                                <button
                                    type="button"
                                    onClick={handleCalculate}
                                    disabled={isCalculating || !symbol}
                                    className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                                >
                                    {isCalculating ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {inputMode === 'LP' && lpFundingMode === 'CUSTOM' ? 'Fresh Capital' : 'Total Spent'}
                            </label>
                            {(inputMode !== 'LP' || (inputMode === 'LP' && lpMode === 'TOTAL')) && (
                                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                    {(['CASH', 'ASSET', 'MIXED'] as const).map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setPaymentMode(m)}
                                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${paymentMode === m ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {(paymentMode === 'ASSET' || paymentMode === 'CASH') && (inputMode !== 'LP' || (inputMode === 'LP' && lpMode === 'TOTAL')) && (
                                <select
                                    value={paymentCurrency}
                                    onChange={(e) => setPaymentCurrency(e.target.value)}
                                    className="w-1/3 rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold uppercase bg-slate-50 dark:bg-slate-800 dark:text-white"
                                >
                                    {['USDT', 'USDC', 'USD', 'DAI'].map(curr => <option key={curr} value={curr}>{curr}</option>)}
                                    {paymentMode === 'ASSET' && assets.filter(a => !a.lpRange && !['USDT', 'USDC', 'USD', 'DAI'].includes(a.symbol)).map(a => (
                                        <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                                    ))}
                                </select>
                            )}
                            <input
                                type="number"
                                step="any"
                                value={totalSpent}
                                disabled={inputMode === 'LP' && lpFundingMode === 'HOLDINGS'}
                                placeholder={inputMode === 'LP' && lpFundingMode === 'HOLDINGS' ? "(Auto)" : "0.00"}
                                onChange={(e) => {
                                    const t = e.target.value;
                                    setTotalSpent(t);
                                    if (amount && t && parseFloat(amount) > 0) setPrice((parseFloat(t) / parseFloat(amount)).toFixed(8));
                                    else if (price && t && parseFloat(price) > 0) setAmount((parseFloat(t) / parseFloat(price)).toFixed(8));
                                }}
                                className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-all font-medium disabled:opacity-70"
                            />
                        </div>
                    </div>
                </div>

                {paymentMode === 'MIXED' && (inputMode !== 'LP' || (inputMode === 'LP' && lpMode === 'TOTAL')) && (
                    <MixedFundingFields
                        mixedCashSymbol={mixedCashSymbol} setMixedCashSymbol={setMixedCashSymbol}
                        mixedCashAmount={mixedCashAmount} setMixedCashAmount={setMixedCashAmount}
                        mixedAssetSymbol={mixedAssetSymbol} setMixedAssetSymbol={setMixedAssetSymbol}
                        mixedAssetQty={mixedAssetQty} setMixedAssetQty={setMixedAssetQty}
                        assets={assets}
                    />
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quantity</label>
                <input
                    type="number"
                    step="any"
                    required={inputMode !== 'LP'}
                    placeholder={inputMode === 'LP' ? "1 (Default)" : "0.00"}
                    value={amount}
                    onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val);
                        if (price && val) setTotalSpent((parseFloat(val) * parseFloat(price)).toFixed(2));
                    }}
                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                />
            </div>
        </div>
    );
};
