import React from 'react';

interface Props {
    symbol: string;
    setSymbol: (s: string) => void;
    buyTarget: string;
    setBuyTarget: (s: string) => void;
    sellTarget: string;
    setSellTarget: (s: string) => void;
    expectedQty: string;
    setExpectedQty: (s: string) => void;
    note: string;
    setNote: (s: string) => void;
    onCancel: () => void;
    onAdd: () => void;
}

export const AddWatchlistForm: React.FC<Props> = (props) => {
    const {
        symbol, setSymbol, buyTarget, setBuyTarget, sellTarget, setSellTarget,
        expectedQty, setExpectedQty, note, setNote, onCancel, onAdd
    } = props;

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end animate-in fade-in slide-in-from-top-2">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Symbol</label>
                <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm uppercase"
                    placeholder="SOL"
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Buy ($)</label>
                <input
                    type="number"
                    value={buyTarget}
                    onChange={(e) => setBuyTarget(e.target.value)}
                    className="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm"
                    placeholder="Opt"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Sell ($)</label>
                <input
                    type="number"
                    value={sellTarget}
                    onChange={(e) => setSellTarget(e.target.value)}
                    className="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm"
                    placeholder="Opt"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Qty</label>
                <input
                    type="number"
                    value={expectedQty}
                    onChange={(e) => setExpectedQty(e.target.value)}
                    className="w-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm"
                    placeholder="Opt"
                />
            </div>
            <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Note</label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm"
                    placeholder="e.g. Buy on dip"
                />
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onAdd}
                    className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                >
                    Add
                </button>
            </div>
        </div>
    );
};
