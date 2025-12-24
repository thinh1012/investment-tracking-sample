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

const SummaryCard = ({ title, value, subValue, color, icon, index }: SummaryCardProps & { index: number }) => {
    const colorClasses = {
        indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    return (
        <div className={`glass-card p-6 flex items-start justify-between animate-slide-up animate-stagger-${index + 1} group`}>
            <div>
                <h3 className="text-slate-400 dark:text-slate-500 text-xs font-black mb-3 uppercase tracking-[0.15em] font-heading">{title}</h3>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-heading group-hover:text-indigo-500 transition-colors duration-300">{value}</p>
                {subValue && (
                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${subValue.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'}`}>
                        <span className="opacity-70">{subValue.startsWith('-') ? '▼' : '▲'}</span>
                        {subValue.startsWith('-') ? '' : '+'}{subValue}
                    </p>
                )}
            </div>
            <div className={`p-3.5 rounded-xl border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-${color}-500/5`}>
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

    const profitPct = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested * 100).toFixed(1) : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <SummaryCard
                index={0}
                title="Total Invested"
                value={isEditingPrincipal ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                            type="number"
                            autoFocus
                            className="w-32 bg-slate-100 dark:bg-slate-800 text-indigo-500 text-2xl font-black rounded-xl px-2 py-1 border border-indigo-200 dark:border-indigo-900/50 focus:outline-none focus:ring-2 ring-indigo-500/20 font-heading"
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
                    </div>
                ) : `$${totalInvested.toLocaleString('en-US')}`}
                color="indigo"
                icon={<DollarSign size={22} className={isEditingPrincipal ? 'text-indigo-500' : 'cursor-pointer'} onClick={() => {
                    setTempPrincipal(manualPrincipal !== null ? manualPrincipal.toString() : totalInvested.toString());
                    setIsEditingPrincipal(true);
                }} />}
                subValue={manualPrincipal !== null ? 'Override Active' : undefined}
            />
            <SummaryCard
                index={1}
                title="Portfolio Value"
                value={`$${totalValue.toLocaleString('en-US')}`}
                color="emerald"
                icon={<Package size={22} />}
            />
            <SummaryCard
                index={2}
                title="Active Assets"
                value={assetCount.toString()}
                color="violet"
                icon={<Layers size={22} />}
            />
        </div>
    );
};
