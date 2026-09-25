import React from 'react';
import { TransactionType } from '../../types';

interface TypeSelectorProps {
    type: TransactionType;
    setType: (type: TransactionType) => void;
}

export const TypeSelector: React.FC<TypeSelectorProps> = ({ type, setType }) => {
    return (
        <div className="flex-1 min-w-0">
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 dark:bg-slate-800">
                {(['DEPOSIT', 'WITHDRAWAL', 'INTEREST', 'TRANSFER'] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`py-1.5 text-xs sm:text-sm font-medium transition-all ${type === t
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                    >
                        {t === 'DEPOSIT' ? 'Buy' : t === 'WITHDRAWAL' ? 'Sell' : t === 'INTEREST' ? 'Earn' : 'Transfer'}
                    </button>
                ))}
            </div>
        </div>
    );
};
