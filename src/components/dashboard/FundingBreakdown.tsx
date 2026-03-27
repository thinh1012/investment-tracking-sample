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
    const inRangeValue = lpAssets.filter(a => a.inRange !== false).reduce((s, a) => s + (a.currentValue || a.totalInvested), 0);
    const outOfRangeValue = lpAssets.filter(a => a.inRange === false).reduce((s, a) => s + (a.currentValue || a.totalInvested), 0);

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
            {outOfRangeValue > 0 && (
                <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 flex flex-col gap-1">
                    <span className="text-xs text-slate-400">LP Range</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-emerald-500">${inRangeValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs font-mono font-semibold text-rose-400">${outOfRangeValue.toLocaleString(locale || 'en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-0.5">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(inRangeValue / (inRangeValue + outOfRangeValue)) * 100}%` }} />
                    </div>
                </div>
            )}
        </div>
    );
};
