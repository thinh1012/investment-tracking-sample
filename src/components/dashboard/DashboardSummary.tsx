import React, { useState } from 'react';
import { DollarSign, Package, Layers } from 'lucide-react';
import { Asset } from '../../types';

interface SummaryCardProps {
    title: string;
    value: string | React.ReactNode;
    subValue?: string;
    color: 'indigo' | 'emerald' | 'violet' | 'rose' | 'blue';
    icon: React.ReactNode;
}

const SummaryCard = ({ title, value, subValue, color, icon }: SummaryCardProps) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:ring-indigo-900/50',
        emerald: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/50',
        violet: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-900/50',
        rose: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-900/50',
        blue: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/50',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wide">{title}</h3>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</p>
                {subValue && (
                    <p className={`text-sm font-medium mt-1 ${subValue.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {subValue.startsWith('-') ? '' : '+'}{subValue}
                    </p>
                )}
            </div>
            <div className={`p-3.5 rounded-xl ${colorClasses[color]}`}>
                {icon}
            </div>
        </div>
    );
};

interface DashboardSummaryProps {
    totalInvested: number;
    totalValue: number;
    assets: Asset[];
    manualPrincipal: number | null;
    onUpdatePrincipal: (val: number | null) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ totalInvested, totalValue, assets, manualPrincipal, onUpdatePrincipal }) => {
    const [isEditingPrincipal, setIsEditingPrincipal] = useState(false);
    const [tempPrincipal, setTempPrincipal] = useState('');

    const assetCount = assets.filter(a => !a.symbol.startsWith('LP') && !a.lpRange).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryCard
                title="Total Invested"
                value={isEditingPrincipal ? (
                    <div className="flex items-center gap-2 " onClick={e => e.stopPropagation()}>
                        <input
                            type="number"
                            autoFocus
                            className="w-32 bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 text-xl font-bold rounded px-1 py-0.5 border border-indigo-200 dark:border-indigo-700 focus:outline-none"
                            value={tempPrincipal}
                            onChange={e => setTempPrincipal(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    const val = parseFloat(tempPrincipal);
                                    if (!isNaN(val)) {
                                        onUpdatePrincipal(val);
                                    } else if (tempPrincipal === '') {
                                        onUpdatePrincipal(null);
                                    }
                                    setIsEditingPrincipal(false);
                                }
                                if (e.key === 'Escape') setIsEditingPrincipal(false);
                            }}
                            onBlur={() => {
                                const val = parseFloat(tempPrincipal);
                                if (!isNaN(val)) {
                                    onUpdatePrincipal(val);
                                } else if (tempPrincipal === '') {
                                    onUpdatePrincipal(null);
                                }
                                setIsEditingPrincipal(false);
                            }}
                        />
                        <span className="text-xs text-slate-400 font-normal self-end mb-1">(Enter to save)</span>
                    </div>
                ) : `$${totalInvested.toLocaleString('en-US')} ${manualPrincipal !== null ? '✎' : ''}`}
                color="indigo"
                icon={<DollarSign size={24} className={isEditingPrincipal ? 'text-indigo-600' : 'cursor-pointer hover:scale-110 transition-transform'} onClick={() => {
                    setTempPrincipal(manualPrincipal !== null ? manualPrincipal.toString() : totalInvested.toString());
                    setIsEditingPrincipal(true);
                }} />}
            />
            <SummaryCard
                title="Current Value (Est)"
                value={`$${totalValue.toLocaleString('en-US')} `}
                color="blue"
                icon={<Package size={24} />}
            />
            <SummaryCard
                title="Assets Count"
                value={assetCount.toString()}
                color="violet"
                icon={<Layers size={24} />}
            />
        </div>
    );
};
