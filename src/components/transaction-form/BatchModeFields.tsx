import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { BatchItem } from './types';
import { TransactionType } from '../../types';

interface BatchModeFieldsProps {
    batchItems: BatchItem[];
    updateBatchItem: (index: number, field: keyof BatchItem, value: string) => void;
    removeBatchItem: (index: number) => void;
    addBatchItem: () => void;
    type: TransactionType;
    paymentCurrency?: string;
    setPaymentCurrency?: (s: string) => void;
}

export const BatchModeFields: React.FC<BatchModeFieldsProps> = (props) => {
    const { batchItems, updateBatchItem, removeBatchItem, addBatchItem, type, paymentCurrency, setPaymentCurrency } = props;
    const isSell = type === 'WITHDRAWAL';
    const needsPrice = type === 'DEPOSIT' || isSell;
    const received = ['USDT', 'USDC', 'USDG', 'DAI', 'USD'].includes(paymentCurrency || '') ? paymentCurrency! : 'USDT';
    const totalReceived = isSell ? batchItems.reduce((s, i) => s + (parseFloat(i.amount) || 0) * (parseFloat(i.price) || 0), 0) : 0;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Batch Items</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {batchItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <input
                            type="text"
                            placeholder="Symbol"
                            value={item.symbol}
                            onChange={(e) => updateBatchItem(index, 'symbol', e.target.value)}
                            className="w-1/3 rounded-lg border-slate-200 dark:border-slate-700 py-2 px-3 uppercase text-sm bg-white dark:bg-slate-800 dark:text-white"
                            required
                        />
                        <input
                            type="number"
                            step="any"
                            placeholder="Qty"
                            value={item.amount}
                            onChange={(e) => updateBatchItem(index, 'amount', e.target.value)}
                            className="w-1/3 rounded-lg border-slate-200 dark:border-slate-700 py-2 px-3 text-sm bg-white dark:bg-slate-800 dark:text-white"
                            required
                        />
                        {needsPrice && (
                            <input
                                type="number"
                                step="any"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => updateBatchItem(index, 'price', e.target.value)}
                                className="w-1/4 rounded-lg border-slate-200 dark:border-slate-700 py-2 px-3 text-sm bg-white dark:bg-slate-800 dark:text-white"
                                required={needsPrice}
                            />
                        )}
                        <button
                            type="button"
                            onClick={() => removeBatchItem(index)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            disabled={batchItems.length === 1}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={addBatchItem}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-medium text-sm hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex justify-center items-center gap-2"
            >
                <Plus size={16} /> Add Another Item
            </button>
            {isSell && setPaymentCurrency && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Received in</span>
                    <select
                        value={received}
                        onChange={(e) => setPaymentCurrency(e.target.value)}
                        className="rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 dark:text-white py-1.5 px-2"
                    >
                        {['USDT', 'USDC', 'USDG', 'DAI', 'USD'].map(c => <option key={c} value={c}>{c === 'USD' ? 'USD (fiat)' : c}</option>)}
                    </select>
                    <span className="ml-auto font-mono">
                        {totalReceived.toLocaleString('en-US', { maximumFractionDigits: 2 })} {received}{received === 'USD' ? ' (not credited)' : ''}
                    </span>
                </div>
            )}
        </div>
    );
};
