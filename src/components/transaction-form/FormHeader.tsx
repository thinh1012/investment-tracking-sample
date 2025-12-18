import React from 'react';
import { X, FileText, ListChecks } from 'lucide-react';

interface FormHeaderProps {
    mode: 'SINGLE' | 'BATCH';
    setMode: (mode: 'SINGLE' | 'BATCH') => void;
    onClose: () => void;
    isEdit: boolean;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ mode, setMode, onClose, isEdit }) => {
    return (
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEdit ? 'Edit Transaction' : (mode === 'BATCH' ? 'Batch Entry' : 'Add Transaction')}
                </h2>
                {!isEdit && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-fit mt-2">
                        <button
                            type="button"
                            onClick={() => setMode('SINGLE')}
                            className={`px-3 py-1 flex items-center gap-2 text-xs font-semibold rounded-md transition-all ${mode === 'SINGLE' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <FileText size={14} /> Single
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('BATCH')}
                            className={`px-3 py-1 flex items-center gap-2 text-xs font-semibold rounded-md transition-all ${mode === 'BATCH' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <ListChecks size={14} /> Batch
                        </button>
                    </div>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
                <X size={20} />
            </button>
        </div>
    );
};
