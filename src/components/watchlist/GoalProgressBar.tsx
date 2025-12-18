import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface Props {
    heldQuantity: number;
    expectedQty: number;
    percent: number;
    symbol: string;
    onAddCapital?: (symbol: string) => void;
}

export const GoalProgressBar: React.FC<Props> = ({ heldQuantity, expectedQty, percent, symbol, onAddCapital }) => {
    if (expectedQty <= 0) return null;

    return (
        <div className="w-full flex items-center gap-3">
            <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {heldQuantity.toLocaleString()} / {expectedQty.toLocaleString()}
                    </span>
                    <span className="text-slate-400">{percent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${percent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
            {onAddCapital && (
                <button
                    onClick={() => onAddCapital(symbol)}
                    className="p-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    title="Buy More"
                >
                    <ShoppingCart size={14} />
                </button>
            )}
        </div>
    );
};
