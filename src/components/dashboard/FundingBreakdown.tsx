import React, { useState } from 'react';
import { Clock, DollarSign, Package, Layers } from 'lucide-react';
import { Transaction, Asset } from '../../types';

interface FundingBreakdownProps {
    groupedBreakdown: Record<string, number>;
    fundingOffset: number | null;
    bucketOverrides: Record<string, number | null>;
    transactions: Transaction[];
    onUpdateFundingOffset: (offset: number | null) => void;
    onUpdateBucketOverride: (curr: string, val: number | null) => void;
    locale?: string;
    portfolioSummary?: {
        totalInvested: number;
        totalValue: number;
        assets: Asset[];
        compoundedGrowth: number;
        onUpdatePrincipal: (val: number | null) => void;
        onToggleAuditor?: () => void;
        isAuditorOpen?: boolean;
    };
}

const PortfolioMiniCard = ({ title, value, color, icon, onClick }: { title: string; value: string; color: string; icon: React.ReactNode; onClick?: () => void }) => (
    <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 flex flex-col gap-1 cursor-default" onClick={onClick}>
        <span className="text-xs text-slate-400">{title}</span>
        <span className="text-base font-semibold font-mono text-slate-800 dark:text-slate-100">{value}</span>
    </div>
);

export const FundingBreakdown: React.FC<FundingBreakdownProps> = ({
    groupedBreakdown,
    fundingOffset,
    bucketOverrides,
    transactions,
    onUpdateFundingOffset,
    onUpdateBucketOverride,
    locale,
    portfolioSummary
}) => {
    const [isFundingHistoryOpen, setIsFundingHistoryOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<string | null>(null);
    const [tempFunding, setTempFunding] = useState('');
    const [isEditingPrincipal, setIsEditingPrincipal] = useState(false);
    const [tempPrincipal, setTempPrincipal] = useState('');

    const assetCount = portfolioSummary?.assets.filter(a => !a.symbol.startsWith('LP') && !a.lpRange).length || 0;

    return (
        <>
            {Object.keys(groupedBreakdown).length > 0 && (
                <div className="mt-6 mb-8 overflow-hidden">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-2 py-1 bg-indigo-500 rounded-md text-white text-xs font-medium">
                            Capital
                        </div>
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Fresh Capital</h4>
                        <button
                            onClick={() => setIsFundingHistoryOpen(!isFundingHistoryOpen)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg group"
                            title="View Investment History"
                        >
                            <Clock size={16} className="text-slate-400 group-hover:text-indigo-500" />
                        </button>
                    </div>

                    {/* Funding History List */}
                    {isFundingHistoryOpen && (
                        /* ... same content ... */
                        <div className="mb-6 glass border dark:border-slate-800/50 rounded-2xl p-5 shadow-sm ring-1 ring-indigo-500/10">
                            <h5 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4 font-sans flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" />
                                Fresh Capital Transactions
                            </h5>
                            <div className="max-h-60 overflow-y-auto pr-3 space-y-2 custom-scrollbar">
                                {transactions
                                    .filter(t => {
                                        const stableSymbols = ['USD', 'USDT', 'USDC', 'DAI', 'BUSD'];
                                        const symbol = t.assetSymbol.toUpperCase();
                                        if (!stableSymbols.includes(symbol)) return false;

                                        if (t.type === 'DEPOSIT') {
                                            return !t.isCompound && (!t.paymentCurrency || stableSymbols.includes(t.paymentCurrency.toUpperCase()));
                                        }
                                        if (t.type === 'WITHDRAWAL') {
                                            if (t.linkedTransactionId) return false;
                                            if (t.notes?.toLowerCase().includes('buy') || t.notes?.toLowerCase().includes('swap')) return false;
                                            return true;
                                        }
                                        return false;
                                    })
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((t, idx) => {
                                        let amt = 0;
                                        let curr = 'USD';
                                        let isNegative = false;
                                        if (t.type === 'DEPOSIT') {
                                            amt = t.paymentAmount || (t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0);
                                            curr = t.paymentCurrency || 'USD';
                                        } else {
                                            amt = t.pricePerUnit && t.amount ? t.pricePerUnit * t.amount : 0;
                                            curr = t.assetSymbol || 'USD';
                                            isNegative = true;
                                        }
                                        return (
                                            <div key={t.id} className={`flex justify-between items-center text-xs py-2.5 border-b border-slate-100/50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 px-2 rounded-lg`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-bold tracking-tighter opacity-70">{t.date}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${t.type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                        {t.type === 'DEPOSIT' ? 'INFLOW' : 'OUTFLOW'}
                                                    </span>
                                                    <span className="font-bold text-slate-600 dark:text-slate-300">
                                                        {t.assetSymbol} {isNegative ? <span className="text-[10px] font-medium text-slate-400">(Sale/Exit)</span> : ''}
                                                    </span>
                                                </div>
                                                <div className="font-sans font-black text-slate-800 dark:text-slate-100">
                                                    {isNegative ? '-' : '+'}{amt.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })} <span className="text-[10px] opacity-50 uppercase tracking-widest">{curr}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
                        {Object.entries(groupedBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([curr, amt], idx) => (
                                <div key={curr} className="flex items-center gap-3 glass rounded-lg px-4 py-2.5 whitespace-nowrap min-w-fit hover:border-indigo-500/20 group">
                                    <div className="p-1 px-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-black tracking-widest rounded-lg border border-indigo-500/20">
                                        {curr}
                                    </div>
                                    <div className="text-base font-black text-slate-800 dark:text-slate-100 cursor-pointer font-sans" onClick={() => {
                                        setTempFunding(groupedBreakdown[curr]?.toString() || '');
                                        setEditingCurrency(curr);
                                    }}>
                                        {editingCurrency === curr ? (
                                            <input
                                                type="number"
                                                autoFocus
                                                className="w-24 bg-slate-100 dark:bg-slate-800 border border-indigo-500/20 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 ring-indigo-500/10 font-black text-indigo-500"
                                                value={tempFunding}
                                                onChange={e => setTempFunding(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        const val = parseFloat(tempFunding);
                                                        onUpdateBucketOverride(curr, isNaN(val) ? null : val);
                                                        setEditingCurrency(null);
                                                    }
                                                    if (e.key === 'Escape') setEditingCurrency(null);
                                                }}
                                                onBlur={() => {
                                                    const val = parseFloat(tempFunding);
                                                    onUpdateBucketOverride(curr, isNaN(val) ? null : val);
                                                    setEditingCurrency(null);
                                                }}
                                            />
                                        ) : (
                                            `$${amt.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}`
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Portfolio Summary Mini Row */}
                    {portfolioSummary && (
                        <div className="mt-4 flex flex-col md:flex-row gap-4">
                            <PortfolioMiniCard
                                title="Fresh Capital"
                                value={isEditingPrincipal ? '...' : `$${portfolioSummary.totalInvested.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}`}
                                color="indigo"
                                icon={<DollarSign size={14} />}
                                onClick={() => {
                                    setTempPrincipal(portfolioSummary.totalInvested.toString());
                                    setIsEditingPrincipal(true);
                                }}
                            />
                            {isEditingPrincipal && (
                                <div className="absolute z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
                                    <input
                                        type="number"
                                        autoFocus
                                        className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-indigo-500 font-black"
                                        value={tempPrincipal}
                                        onChange={e => setTempPrincipal(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => {
                                            const val = parseFloat(tempPrincipal);
                                            portfolioSummary.onUpdatePrincipal(isNaN(val) ? null : val);
                                            setIsEditingPrincipal(false);
                                        }} className="flex-1 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-lg py-1.5">Save</button>
                                        <button onClick={() => setIsEditingPrincipal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase rounded-lg py-1.5">Cancel</button>
                                    </div>
                                </div>
                            )}
                            <PortfolioMiniCard
                                title="Portfolio Value"
                                value={`$${portfolioSummary.totalValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}`}
                                color="emerald"
                                icon={<Package size={14} />}
                                onClick={portfolioSummary.onToggleAuditor}
                            />
                            <PortfolioMiniCard
                                title="Active Assets"
                                value={assetCount.toString()}
                                color="violet"
                                icon={<Layers size={14} />}
                            />
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
