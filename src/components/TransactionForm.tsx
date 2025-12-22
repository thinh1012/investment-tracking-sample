import React from 'react';
import { createPortal } from 'react-dom';
import { FileText, ListChecks } from 'lucide-react';

// Hooks
import { useTransactionFormState } from '../hooks/useTransactionFormState';
import { useTransactionFormHandlers } from '../hooks/useTransactionFormHandlers';

// Components
import { FormHeader } from './transaction-form/FormHeader';
import { TypeSelector } from './transaction-form/TypeSelector';
import { StandardFields } from './transaction-form/StandardFields';
import { RewardSplitFields } from './transaction-form/RewardSplitFields';
import { LPSplitFields } from './transaction-form/LPSplitFields';
import { BatchModeFields } from './transaction-form/BatchModeFields';
import { AdditionalFields } from './transaction-form/AdditionalFields';

// Types
import { Transaction, Asset } from '../types';
import { DefaultValues } from './transaction-form/types';

interface Props {
    onClose: () => void;
    onSave: (t: Transaction) => void;
    initialData?: Transaction | null;
    defaultValues?: DefaultValues | null;
    assets: Asset[];
    isOpen: boolean;
    onUpdateAssetConfig?: (symbol: string, config: { rewardTokens?: string[] }) => Promise<void>;
}

const TransactionForm: React.FC<Props> = (props) => {
    const { isOpen, onClose, initialData } = props;

    // 1. State Management (Extracted Hook)
    const state = useTransactionFormState(props);

    // 2. Event Handlers (Extracted Hook)
    const handlers = useTransactionFormHandlers(state, props);

    if (!isOpen) return null;

    const {
        mode, setMode, type, setType, symbol, displayDate,
        rewardSplitMode, setRewardSplitMode, rewards, setRewards,
        inputMode, setInputMode, lpMode, setLpMode,
        lpTokenA, setLpTokenA, lpTokenB, setLpTokenB,
        lpTokenASource, setLpTokenASource, lpTokenBSource, setLpTokenBSource,
        fundingSourceA, setFundingSourceA, fundingSourceB, setFundingSourceB,
        lpRangeMin, setLpRangeMin, lpRangeMax, setLpRangeMax, monitorSymbol, setMonitorSymbol,
        batchItems, interestType, setInterestType, platform, setPlatform, source, setSource,
        relatedAssetSymbol, relatedAssetSymbols, setRelatedAssetSymbols, notes, setNotes,
        paymentMode, setPaymentMode, paymentCurrency, setPaymentCurrency,
        totalSpent, setTotalSpent, amount, setAmount, price, setPrice, isCalculating,
        mixedCashSymbol, setMixedCashSymbol, mixedCashAmount, setMixedCashAmount,
        mixedAssetSymbol, setMixedAssetSymbol, mixedAssetQty, setMixedAssetQty
    } = state;

    const { handleDateChange, handleCalculate, handleSubmit, addBatchItem, removeBatchItem, updateBatchItem } = handlers;

    // Derived State for UI
    const getLpFundingMode = () => {
        if (lpTokenASource === 'FRESH' && lpTokenBSource === 'FRESH') return 'FRESH';
        if (lpTokenASource === 'HOLDINGS' && lpTokenBSource === 'HOLDINGS') return 'HOLDINGS';
        return 'CUSTOM';
    };
    const lpFundingMode = getLpFundingMode();

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">

                <FormHeader mode={mode} setMode={setMode} onClose={onClose} isEdit={!!initialData} />

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TypeSelector type={type} setType={setType} />

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date (dd/mm/yyyy)</label>
                            <input
                                type="text"
                                required
                                placeholder="dd/mm/yyyy"
                                maxLength={10}
                                value={displayDate}
                                onChange={handleDateChange}
                                className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 text-slate-600 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {mode === 'SINGLE' ? (
                        <div className="space-y-6">
                            <StandardFields
                                symbol={symbol} setSymbol={state.setSymbol}
                                amount={amount} setAmount={setAmount}
                                price={price} setPrice={setPrice}
                                totalSpent={totalSpent} setTotalSpent={setTotalSpent}
                                inputMode={inputMode}
                                paymentMode={paymentMode} setPaymentMode={setPaymentMode}
                                paymentCurrency={paymentCurrency} setPaymentCurrency={setPaymentCurrency}
                                isCalculating={isCalculating}
                                handleCalculate={handleCalculate}
                                type={type}
                                assets={props.assets}
                                lpMode={lpMode}
                                lpFundingMode={lpFundingMode}
                                date={state.date}
                                lpTokenA={lpTokenA} lpTokenB={lpTokenB}
                                lpTokenASource={lpTokenASource} lpTokenBSource={lpTokenBSource}
                                mixedCashSymbol={mixedCashSymbol} setMixedCashSymbol={setMixedCashSymbol}
                                mixedCashAmount={mixedCashAmount} setMixedCashAmount={setMixedCashAmount}
                                mixedAssetSymbol={mixedAssetSymbol} setMixedAssetSymbol={setMixedAssetSymbol}
                                mixedAssetQty={mixedAssetQty} setMixedAssetQty={setMixedAssetQty}
                                rewardSplitMode={rewardSplitMode}
                            />

                            {type === 'INTEREST' && rewardSplitMode && (
                                <RewardSplitFields
                                    rewards={rewards} setRewards={setRewards}
                                    symbol={symbol} setRewardSplitMode={setRewardSplitMode}
                                />
                            )}

                            {/* Calculation Mode Toggle (Standard vs LP) */}
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-semibold text-slate-500 uppercase ml-2">Mode:</span>
                                <div className="flex gap-1">
                                    {(['QUANTITY', 'LP'] as const).map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setInputMode(m)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${inputMode === m ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                                        >
                                            {m === 'QUANTITY' ? 'Standard' : 'Liquidity Pool'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {inputMode === 'LP' && (
                                <div className="space-y-4">
                                    <div className="flex justify-center pb-2">
                                        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex">
                                            <button
                                                type="button"
                                                onClick={() => setLpMode('TOTAL')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${lpMode === 'TOTAL' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'} ${lpFundingMode !== 'FRESH' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={lpFundingMode !== 'FRESH'}
                                            >
                                                Total Only
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLpMode('SPLIT')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${lpMode === 'SPLIT' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}
                                            >
                                                Token Split
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 leading-tight">
                                            {lpFundingMode === 'FRESH' ? "You are adding new money to your portfolio." : lpFundingMode === 'HOLDINGS' ? "Moving existing assets to LP. No PnL realized." : "Mix of existing assets and fresh capital."}
                                        </p>
                                    </div>

                                    <LPSplitFields
                                        lpMode={lpMode}
                                        lpTokenA={lpTokenA} setLpTokenA={setLpTokenA}
                                        lpTokenB={lpTokenB} setLpTokenB={setLpTokenB}
                                        lpTokenASource={lpTokenASource} setLpTokenASource={setLpTokenASource}
                                        lpTokenBSource={lpTokenBSource} setLpTokenBSource={setLpTokenBSource}
                                        fundingSourceA={fundingSourceA} setFundingSourceA={setFundingSourceA}
                                        fundingSourceB={fundingSourceB} setFundingSourceB={setFundingSourceB}
                                        assets={props.assets}
                                        lpRangeMin={lpRangeMin} setLpRangeMin={setLpRangeMin}
                                        lpRangeMax={lpRangeMax} setLpRangeMax={setLpRangeMax}
                                        monitorSymbol={monitorSymbol} setMonitorSymbol={setMonitorSymbol}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <BatchModeFields
                            batchItems={batchItems}
                            updateBatchItem={updateBatchItem}
                            removeBatchItem={removeBatchItem}
                            addBatchItem={addBatchItem}
                            type={type}
                        />
                    )}

                    <AdditionalFields
                        type={type}
                        interestType={interestType} setInterestType={setInterestType}
                        platform={platform} setPlatform={setPlatform}
                        source={source} setSource={setSource}
                        relatedAssetSymbol={relatedAssetSymbol}
                        relatedAssetSymbols={relatedAssetSymbols} setRelatedAssetSymbols={setRelatedAssetSymbols}
                        assets={props.assets}
                    />

                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</label>
                        <textarea
                            placeholder="Add details about this transaction..."
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white transition-all text-sm"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] transform duration-100"
                        >
                            {initialData ? 'Update Transaction' : (mode === 'BATCH' ? `Save ${batchItems.length} Transactions` : 'Save Transaction')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default TransactionForm;
