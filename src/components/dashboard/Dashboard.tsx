import React from 'react';
import { Asset, Transaction, PriceAlert, AlertCondition, NotificationChannel } from '../../types';
import { useDashboardCalculations } from '../../hooks/useDashboardCalculations';
import { DashboardSummary } from './DashboardSummary';
import { FundingBreakdown } from './FundingBreakdown';
import { AssetsTable } from './AssetsTable';
import { LiquidityPoolsTable } from './LiquidityPoolsTable';
import { RecentTransactions } from './RecentTransactions';
import { EarningsHistory } from './EarningsHistory';
import { MarketPicks } from './MarketPicks';
import DashboardNotes from '../DashboardNotes';
import Watchlist from '../Watchlist';

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
    onUpdateAssetOverride?: (symbol: string, overrides: { avgBuyPrice?: number }) => void;
    priceChanges?: Record<string, number | null>;
    priceVolumes?: Record<string, number | null>;
    watchlistState?: any;
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
    onUpdateAssetOverride,
    priceChanges = {},
    priceVolumes = {},
    watchlistState
}) => {
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
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <EarningsHistory assets={assets} transactions={transactions} prices={prices} locale={locale} defaultOpen={false} />
                </div>
            ) : view === 'market-picks' ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 h-full">
                    <MarketPicks prices={prices} priceChanges={priceChanges} priceVolumes={priceVolumes} />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                    <DashboardNotes />
                </div>
            )}
        </div>
    );
};
