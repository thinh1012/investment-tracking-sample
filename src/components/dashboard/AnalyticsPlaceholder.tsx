import React from 'react';
import { BarChart3 } from 'lucide-react';

export const AnalyticsPlaceholder = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
                <BarChart3 size={48} className="text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Analytics Dashboard</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Detailed analytics and charts are temporarily unavailable in this version.
                <br />
                Most metrics are now integrated directly into the main Dashboard.
            </p>
        </div>
    );
};
