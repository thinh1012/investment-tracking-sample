import React from 'react';
import { Package, Layers } from 'lucide-react';
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
        onAssetsClick?: () => void;
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
    const assetCount = portfolioSummary?.assets.filter(a => !a.symbol.startsWith('LP') && !a.lpRange).length || 0;

    if (!portfolioSummary) return null;

    const lpAssets = portfolioSummary.assets.filter(a => a.lpRange != null);
    const inRangePools = lpAssets.filter(a => a.inRange !== false);
    const outOfRangePools = lpAssets.filter(a => a.inRange === false);
    const totalPools = lpAssets.length;
    const inRangeValue = inRangePools.reduce((s, a) => s + (a.currentValue || a.totalInvested), 0);
    const outOfRangeValue = outOfRangePools.reduce((s, a) => s + (a.currentValue || a.totalInvested), 0);

    return (
        <div className="mt-4 mb-6 flex flex-row gap-3">
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
                onClick={portfolioSummary.onAssetsClick}
            />
            {totalPools > 0 && (
                <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 flex flex-col gap-1.5">
                    <span className="text-xs text-slate-400">LP Range</span>
                    <div className="flex items-center justify-between text-xs font-mono font-semibold">
                        <span className="text-emerald-500">{inRangePools.length} in</span>
                        <span className="text-rose-400">{outOfRangePools.length} out</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-rose-400/30 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${totalPools > 0 ? (inRangePools.length / totalPools) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>${inRangeValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</span>
                        <span className="text-rose-400/70">${outOfRangeValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
