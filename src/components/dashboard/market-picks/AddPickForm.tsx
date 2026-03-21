import React from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface Props {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
}

export const AddPickForm: React.FC<Props> = ({ searchTerm, setSearchTerm, onSubmit }) => {
    return (
        <form onSubmit={onSubmit} className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 animate-in fade-in slide-in-from-top-2">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Add symbol (e.g. BTC)"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                />
                <button
                    type="submit"
                    disabled={!searchTerm.trim()}
                    className="absolute right-2 top-2 p-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg disabled:opacity-50"
                >
                    <ArrowRight size={14} />
                </button>
            </div>
        </form>
    );
};
