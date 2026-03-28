import React from 'react';
import { Asset, Transaction, PriceAlert, AlertCondition, NotificationChannel } from '../../types';
import { useDashboardCalculations } from '../../hooks/useDashboardCalculations';
import { FundingBreakdown } from './FundingBreakdown';
import { LiquidityPoolsTable } from './LiquidityPoolsTable';
import { StakingTable } from './StakingTable';
import { RemindersTable } from './RemindersTable';
import { AssetsTable } from './AssetsTable';
import { EarningsHistory } from './EarningsHistory';
import { MonthlyEarnings } from './earnings/MonthlyEarnings';
import { LPFeeTracker } from './LPFeeTracker';
import { RecentTransactions } from './RecentTransactions';
import { AccountingJournal } from './AccountingJournal';
import { TrendingUp, Shield, Layout } from 'lucide-react';
const DashboardNotes = React.lazy(() => import('../DashboardNotes'));
const PortfolioAuditor = React.lazy(() => import('./PortfolioAuditor').then(m => ({ default: m.PortfolioAuditor })));


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
    view?: 'dashboard' | 'analytics' | 'notes';

    // Alert Props
    alerts?: PriceAlert[];
    onAddAlert?: (symbol: string, targetPrice: number, condition: AlertCondition, channels: NotificationChannel[]) => void;
    onRemoveAlert?: (id: string) => void;
    onToggleAlert?: (id: string) => void;
    isMuted?: boolean;
    onToggleMute?: () => void;
    locale?: string;
    onAddTransaction?: (asset?: Asset) => void;
    onAddClaim?: (lpSymbol: string) => void;
    onUpdateAssetOverride?: (symbol: string, overrides: { avgBuyPrice?: number }) => void;
    priceChanges?: Record<string, number | null>;
    priceVolumes?: Record<string, number | null>;
    onSimulate?: (symbol: string, price: number) => void;
    simulatorState?: { symbol: string; price: number } | null;
    onCompound?: (tx: Transaction) => void;
    manualPriceSources?: Record<string, string>;
    manualPrices?: Record<string, number>;
    onClearManualPrice?: (symbol: string) => void;
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
    onAddTransaction,
    onAddClaim,
    onUpdateAssetOverride,
    priceChanges = {},
    priceVolumes = {},
    onSimulate,
    simulatorState,
    onCompound,
    manualPriceSources = {},
    manualPrices = {},
    onClearManualPrice
}) => {
    const [activeAnalyticsTab, setActiveAnalyticsTab] = React.useState<'yield' | 'ledger' | 'monthly'>('monthly');
    const [activeLedgerTab, setActiveLedgerTab] = React.useState<'earnings' | 'recent' | 'accounting'>('recent');
    const [isAuditorOpen, setIsAuditorOpen] = React.useState(false);
    const [assetsForceOpen, setAssetsForceOpen] = React.useState(false);

    const handleAssetsClick = () => {
        setAssetsForceOpen(prev => {
            const next = !prev;
            if (next) {
                setTimeout(() => {
                    document.getElementById('assets-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            }
            return next;
        });
    };


    // 1. Hook for Logic
    const {
        totalInvested,
        totalValue,
        compoundedGrowth,
        groupedBreakdown,
        fundingOffset,
        bucketOverrides,
        updateGlobalPrincipal,
        updateFundingOffset,
        updateBucketOverride,
        resetBaseline
    } = useDashboardCalculations({ assets, transactions, prices });

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
                <div className="flex flex-col">
                    <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {view === 'dashboard' ? 'LP Positions' : view === 'analytics' ? 'Earnings' : 'Notes'}
                        {view === 'dashboard' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </h1>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <button
                        onClick={resetBaseline}
                        className="text-xs font-medium text-slate-500 hover:text-rose-500"
                        title="Recalculate Principal Baseline"
                    >
                        Sync Baseline
                    </button>
                    <button
                        onClick={onAddClick}
                        className="hidden md:flex flex-none text-sm bg-indigo-500 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-600 font-medium items-center gap-2"
                    >
                        <TrendingUp size={16} /> Add Transaction
                    </button>
                </div>
            </div>

            <React.Suspense fallback={<div className="p-12 text-center text-slate-400 font-bold">Loading Component...</div>}>
                {view === 'dashboard' ? (
                    <div className="space-y-6 md:space-y-8">
                        {isAuditorOpen && (
                            <PortfolioAuditor
                                assets={assets}
                                transactions={transactions}
                                prices={prices}
                                locale={locale}
                                onClose={() => setIsAuditorOpen(false)}
                            />
                        )}

                        {/* Funding Breakdown & Portfolio Summary */}
                        <FundingBreakdown
                            groupedBreakdown={groupedBreakdown}
                            fundingOffset={fundingOffset}
                            bucketOverrides={bucketOverrides}
                            transactions={transactions}
                            onUpdateFundingOffset={updateFundingOffset}
                            onUpdateBucketOverride={updateBucketOverride}
                            locale={locale}
                            portfolioSummary={{
                                totalInvested,
                                totalValue,
                                assets,
                                compoundedGrowth,
                                onUpdatePrincipal: updateGlobalPrincipal,
                                onToggleAuditor: () => setIsAuditorOpen(!isAuditorOpen),
                                isAuditorOpen,
                                onAssetsClick: handleAssetsClick
                            }}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                            <LiquidityPoolsTable
                                assets={assets}
                                transactions={transactions}
                                onAddTransaction={onAddTransaction}
                                updateAssetPrice={updateAssetPrice}
                                locale={locale}
                            />
                            <StakingTable
                                assets={assets}
                                locale={locale}
                            />
                            <RemindersTable
                                assets={assets}
                                locale={locale}
                            />
                            <AssetsTable
                                assets={assets}
                                transactions={transactions}
                                prices={prices}
                                onRefreshPrices={onRefreshPrices}
                                onUpdateAssetOverride={onUpdateAssetOverride}
                                locale={locale}
                                forceOpen={assetsForceOpen}
                                manualPrices={manualPrices}
                                onClearManualPrice={onClearManualPrice}
                            />
                        </div>
                    </div>
                ) : view === 'analytics' ? (
                    <div className="space-y-6">
                        {/* Analytics Tabs — underline style */}
                        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 mb-2 scrollbar-hide">
                            {([
                                { id: 'monthly', label: 'Monthly' },
                                { id: 'yield', label: 'Yield' },
                                { id: 'ledger', label: 'Ledger' },
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveAnalyticsTab(tab.id)}
                                    className={`px-3 md:px-5 py-3 text-sm font-bold border-b-2 -mb-px whitespace-nowrap ${
                                        activeAnalyticsTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeAnalyticsTab === 'monthly' ? (
                            <div className="space-y-6">
                                <MonthlyEarnings transactions={transactions} prices={prices} locale={locale} />
                            </div>
                        ) : activeAnalyticsTab === 'yield' ? (
                            <div className="space-y-6">
                                <LPFeeTracker assets={assets} transactions={transactions} prices={prices} locale={locale} onAddClaim={onAddClaim} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
                                    {([
                                        { id: 'recent', label: 'Recent Transactions' },
                                        { id: 'earnings', label: 'Earnings History' },
                                        { id: 'accounting', label: 'Accounting Ledger' },
                                    ] as const).map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveLedgerTab(tab.id)}
                                            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeLedgerTab === tab.id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                {activeLedgerTab === 'earnings' ? (
                                    <EarningsHistory assets={assets} transactions={transactions} prices={prices} locale={locale} defaultOpen={true} onCompound={onCompound} />
                                ) : activeLedgerTab === 'accounting' ? (
                                    <AccountingJournal transactions={transactions} locale={locale} />
                                ) : (
                                    <RecentTransactions
                                        transactions={transactions}
                                        onEditClick={onEditClick}
                                        onDeleteClick={onDeleteClick}
                                        locale={locale}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <DashboardNotes
                            simulatorInitialData={simulatorState}
                            locale={locale}
                        />
                    </div>
                )
                }
            </React.Suspense >

        </div >
    );
};
