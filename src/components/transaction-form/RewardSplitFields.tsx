import React from 'react';
import { Reward } from './types';

interface RewardSplitFieldsProps {
    rewards: Reward[];
    setRewards: (rewards: Reward[]) => void;
    symbol: string;
    setRewardSplitMode: (mode: boolean) => void;
}

export const RewardSplitFields: React.FC<RewardSplitFieldsProps> = ({ rewards, setRewards, symbol, setRewardSplitMode }) => {
    const updateReward = (index: number, field: keyof Reward, value: string) => {
        const newRewards = [...rewards];
        newRewards[index][field] = value;
        setRewards(newRewards);
    };

    return (
        <div className="md:col-span-2 space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Reward Tokens</label>
                <span className="text-[10px] text-slate-400">Linked to {symbol ? symbol.toUpperCase() : 'LP'}</span>
            </div>

            {rewards.map((reward, index) => (
                <div key={index} className="flex gap-4">
                    <div className="w-1/3">
                        <input
                            type="text"
                            placeholder="Symbol"
                            value={reward.symbol}
                            onChange={e => updateReward(index, 'symbol', e.target.value)}
                            className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 uppercase placeholder:normal-case font-medium bg-white dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="w-2/3">
                        <input
                            type="number"
                            step="any"
                            placeholder="Amount"
                            value={reward.amount}
                            onChange={e => updateReward(index, 'amount', e.target.value)}
                            className="block w-full rounded-xl border-slate-200 dark:border-slate-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-3 px-4 bg-white dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => setRewardSplitMode(false)}
                className="text-xs text-rose-500 hover:text-rose-600 underline"
            >
                Back to Single Asset Mode
            </button>
        </div>
    );
};
