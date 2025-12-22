import React from 'react';
import { Asset, Transaction, PriceAlert, AlertCondition, NotificationChannel } from '../../types';
import { useDashboardCalculations } from '../../hooks/useDashboardCalculations';
import { DashboardSummary } from './DashboardSummary';
import { FundingBreakdown } from './FundingBreakdown';
import { AssetsTable } from './AssetsTable';
import { LiquidityPoolsTable } from './LiquidityPoolsTable';
import { RecentTransactions } from './RecentTransactions';
import { EarningsHistory } from './EarningsHistory';
import { LPFeeTracker } from './LPFeeTracker';
import { MarketPicks } from './MarketPicks';
import DashboardNotes from '../DashboardNotes';
import Watchlist from '../Watchlist';
import { TrendingUp, TrendingDown, History } from 'lucide-react';

interface Props {
    assets: Asset[];
    transactions: Transaction[];
    history: { invested: { date: string; value: number }[], earnings: { date: string; value: number }[] };
    onAddClick: () => void;
    onEditClick: (tx: Transaction) => void;
    onDeleteClick: (id: string) => void;
    onRefreshPrices?: (force?: boolean) => Promise<void>;
    updateAssetPrice?: (symbol: string, price: number) => void;
    prices: Record<string, number>;
    view?: 'dashboard' | 'analytics' | 'watchlist' | 'notes' | 'simulator' | 'market-picks';

    // Alert Props
    alerts?: PriceAlert[];
    onAddAlert?: (symbol: string, targetPrice: number, condition: AlertCondition, channels: NotificationChannel[]) => void;
    onRemoveAlert?: (id: string) => void;
    onToggleAlert?: (id: string) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
    locale?: string;
    onAddCapital?: (symbol: string) => void;
    onAddClaim?: (symbol: string) => void;
    onUpdateAssetOverride?: (symbol: string, overrides: { avgBuyPrice?: number }) => void;
    priceChanges?: Record<string, number | null>;
    priceVolumes?: Record<string, number | null>;
    watchlistState?: any;
    onSimulate?: (symbol: string, price: number) => void;
    simulatorState?: { symbol: string; price: number } | null;
}

export const Dashboard: React.FC<Props> = ({
    assets,
    transactions,
    history,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onRefreshPrices,
    updateAssetPrice,
    prices,
    view,
    alerts,
    onAddAlert,
    onRemoveAlert,
    onToggleAlert,
    isMuted,
    onToggleMute,
    locale,
    onAddCapital,
    onAddClaim,
    onUpdateAssetOverride,
    priceChanges = {},
    priceVolumes = {},
    watchlistState,
    onSimulate,
    simulatorState
}) => {
    const [activeAnalyticsTab, setActiveAnalyticsTab] = React.useState<'earnings' | 'yield'>('earnings');

    // 1. Hook for Logic
    const {
        totalInvested,
        totalValue,
        groupedBreakdown,
        manualPrincipal,
        fundingOffset,
        updateManualPrincipal,
        updateFundingOffset
    } = useDashboardCalculations({ assets, transactions, prices });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Actions */}
            <div className="flex justify-end">
                <button
                    onClick={onAddClick}
                    className="text-sm bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 font-medium flex items-center gap-2"
                >
                    + Add Transaction
                </button>
            </div>

            {view === 'dashboard' ? (
                <div>
                    {/* 2. Summary Cards */}
                    <DashboardSummary
                        totalInvested={totalInvested}
                        totalValue={totalValue}
                        assets={assets}
                        manualPrincipal={manualPrincipal}
                        onUpdatePrincipal={updateManualPrincipal}
                    />

                    {/* 3. Funding Breakdown */}
                    <FundingBreakdown
                        groupedBreakdown={groupedBreakdown}
                        fundingOffset={fundingOffset}
                        transactions={transactions}
                        onUpdateFundingOffset={updateFundingOffset}
                        locale={locale}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 4. Assets Table */}
                        <AssetsTable
                            assets={assets}
                            prices={prices}
                            onRefreshPrices={onRefreshPrices}
                            onUpdateAssetOverride={onUpdateAssetOverride}
                            locale={locale}
                        />

                        {/* 5. Liquidity Pools Table */}
                        <LiquidityPoolsTable
                            assets={assets}
                            transactions={transactions}
                            onAddCapital={onAddCapital}
                            updateAssetPrice={updateAssetPrice}
                            locale={locale}
                        />
                    </div>

                    {/* 7. Recent Transactions */}
                    <RecentTransactions
                        transactions={transactions}
                        onEditClick={onEditClick}
                        onDeleteClick={onDeleteClick}
                        locale={locale}
                    />
                </div>
            ) : view === 'watchlist' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <Watchlist
                        prices={prices}
                        onRefreshPrices={onRefreshPrices}
                        alerts={alerts}
                        onAddAlert={onAddAlert}
                        onRemoveAlert={onRemoveAlert}
                        onToggleAlert={onToggleAlert}
                        isMuted={isMuted}
                        onToggleMute={onToggleMute}
                        assets={assets}
                        onAddCapital={onAddCapital}
                        {...watchlistState}
                    />
                </div>
            ) : view === 'analytics' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                    {/* Analytics Header Tabs */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Analytics & Yield</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Track your performance and fee recovery progress.</p>
                        </div>
                        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveAnalyticsTab('earnings')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeAnalyticsTab === 'earnings'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Earnings History
                            </button>
                            <button
                                onClick={() => setActiveAnalyticsTab('yield')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeAnalyticsTab === 'yield'
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                LP Yield Tracker
                            </button>
                        </div>
                    </div>

                    {activeAnalyticsTab === 'earnings' ? (
                        <div className="space-y-6">
                            <EarningsHistory assets={assets} transactions={transactions} prices={prices} locale={locale} defaultOpen={true} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <LPFeeTracker assets={assets} transactions={transactions} prices={prices} locale={locale} onAddClaim={onAddClaim} />
                        </div>
                    )}
                </div>
            ) : view === 'market-picks' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full">
                    <MarketPicks
                        prices={prices}
                        priceChanges={priceChanges}
                        priceVolumes={priceVolumes}
                        locale={locale}
                        onSimulate={onSimulate}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <DashboardNotes
                        simulatorInitialData={simulatorState}
                        locale={locale}
                    />
                </div>
            )}
        </div>
    );
};
