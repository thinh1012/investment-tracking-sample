import React from 'react';
import { DollarSign, Package, Layers, Activity, TrendingUp, BarChart3, PieChart, Gauge } from 'lucide-react';
import { Asset } from '../../types';
import { ScoutReport } from '../../services/database/types';

interface SummaryCardProps {
    title: string;
    value: string | React.ReactNode;
    subtitle?: string;
    subValue?: string;
    color: 'indigo' | 'emerald' | 'violet' | 'rose' | 'blue' | 'indigo';
    icon: React.ReactNode;
    onValueClick?: () => void;
    sentimentValue?: number;
}

const SummaryCard = ({ title, value, subtitle, subValue, color, icon, index, onValueClick, sentimentValue }: SummaryCardProps & { index: number }) => {
    const colorClasses = {
        indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        violet: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <div className={`glass-card p-3 md:p-4 flex items-start justify-between group hover:border-${color}-500/20 transition-all duration-200`}>
            <div className={onValueClick ? 'cursor-pointer' : ''} onClick={onValueClick}>
                <h3 className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">{title}</h3>
                {/* Professional monospace for numerical data */}
                <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white font-mono mb-1">
                    {value}
                </div>
                {subtitle && (
                    <div className="flex flex-col">
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500">
                            {subtitle}
                        </p>
                        {subValue && (
                            <p className="text-sm font-black text-slate-600 dark:text-slate-300 font-heading">
                                {subValue}
                            </p>
                        )}
                    </div>
                )}
                {sentimentValue !== undefined && (
                    <div className="mt-4 flex flex-col items-center gap-1.5 w-full min-w-[120px]">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="h-full bg-rose-500" style={{ width: '20%' }} />
                            <div className="h-full bg-orange-500" style={{ width: '20%' }} />
                            <div className="h-full bg-indigo-500" style={{ width: '20%' }} />
                            <div className="h-full bg-yellow-400" style={{ width: '20%' }} />
                            <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
                        </div>
                        <div className="relative h-2 w-full">
                            <div className="absolute top-[-10px] w-3 h-3 bg-white dark:bg-slate-700 border-2 border-indigo-500 rounded-full shadow-glow transition-all duration-700 ease-out" style={{ left: `${sentimentValue}%`, transform: 'translateX(-50%)' }} />
                        </div>
                        <div className="flex justify-between w-full mt-1">
                            <span className="text-[8px] font-black uppercase text-rose-500">Fear</span>
                            {subtitle && <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{subtitle}</span>}
                            <span className="text-[8px] font-black uppercase text-emerald-500">Greed</span>
                        </div>
                    </div>
                )}
            </div>
            <div className={`p-3 rounded-lg bg-${color}-500/10 ${colorClasses[color]} transition-all duration-200`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as any, { size: 20, className: ((icon.props as any).className || "") }) : icon}
            </div>
        </div>
    );
};

interface DashboardSummaryProps {
    scoutReport: ScoutReport | null;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ scoutReport }) => {
    const formatBillion = (val?: number) => {
        if (val === undefined || val === null) return '---';
        if (val === 0) return '$0.00 B';
        return `$${val.toFixed(2)} B`;
    };

    const formatTrillion = (val?: number) => {
        if (val === undefined || val === null) return '---';
        if (val === 0) return '$0.00 T';
        return `$${(val / 1000).toFixed(2)} T`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
            <SummaryCard
                index={0}
                title="DeFi Market Cap"
                value={formatBillion(scoutReport?.globalDeFi?.marketCap)}
                subtitle="Crypto Market Cap"
                subValue={formatTrillion(scoutReport?.globalCrypto?.marketCap)}
                color="indigo"
                icon={<BarChart3 size={22} />}
            />
            <SummaryCard
                index={1}
                title="DeFi Volume (24h)"
                value={formatBillion(scoutReport?.globalDeFi?.volume24h)}
                subtitle="Crypto Volume (24h)"
                subValue={formatBillion(scoutReport?.globalCrypto?.volume24h)}
                color="emerald"
                icon={<Activity size={22} />}
            />
            <SummaryCard
                index={2}
                title="Fear and Greed Index"
                value={(scoutReport?.sentiment?.value !== undefined && scoutReport.sentiment.value > 0) ? scoutReport.sentiment.value.toString() : '---'}
                subtitle={scoutReport?.sentiment?.label}
                color="indigo"
                icon={<Gauge size={22} />}
                sentimentValue={scoutReport?.sentiment?.value}
            />
            <SummaryCard
                index={3}
                title="Altcoin Season Index"
                value={(scoutReport?.altcoinSeasonIndex !== undefined && scoutReport.altcoinSeasonIndex > 0) ? scoutReport.altcoinSeasonIndex.toString() : '---'}
                subtitle={scoutReport?.altcoinSeasonIndex !== undefined ? (scoutReport.altcoinSeasonIndex < 25 ? 'Bitcoin Season' : scoutReport.altcoinSeasonIndex > 75 ? 'Altcoin Season' : 'Neutral') : ''}
                color="rose"
                icon={<PieChart size={22} />}
                sentimentValue={scoutReport?.altcoinSeasonIndex}
            />
        </div>
    );
};
