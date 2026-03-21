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
}

export const BatchModeFields: React.FC<BatchModeFieldsProps> = (props) => {
    const { batchItems, updateBatchItem, removeBatchItem, addBatchItem, type } = props;

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
                        {type === 'DEPOSIT' && (
                            <input
                                type="number"
                                step="any"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => updateBatchItem(index, 'price', e.target.value)}
                                className="w-1/4 rounded-lg border-slate-200 dark:border-slate-700 py-2 px-3 text-sm bg-white dark:bg-slate-800 dark:text-white"
                                required={type === 'DEPOSIT'}
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
        </div>
    );
};
