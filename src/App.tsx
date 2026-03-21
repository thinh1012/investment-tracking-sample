import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePortfolio } from './hooks/usePortfolio';
import { useAlerts } from './hooks/useAlerts';
import { useNotification, NotificationProvider } from './context/NotificationContext';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useDataStorage } from './hooks/useDataStorage';
import { useWatchlist } from './hooks/useWatchlist';
import { useMarketPicks } from './hooks/useMarketPicks';
import { useMarketPicksNotifications } from './hooks/useMarketPicksNotifications';

// [CODE_SPLITTING]: Lazy load heavy components
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const RabbyDashboard = React.lazy(() => import('./components/dashboard/RabbyDashboard').then(m => ({ default: m.RabbyDashboard })));

const TransactionForm = React.lazy(() => import('./components/TransactionForm'));
const Settings = React.lazy(() => import('./components/Settings'));
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { BackupService } from './services/database/BackupService';
import ErrorBoundary from './components/ErrorBoundary';
import { Transaction, Asset } from './types';

function App(): React.ReactNode {
    // 0. Market Picks State (Lifted to prevent double-loading)
    const { picks, historicalData: picksHistory } = useMarketPicks();

    // 1. Watchlist State (Lifted for Sync & Symbols)
    const watchlistState = useWatchlist();
    const { watchlist } = watchlistState;
    const watchlistSymbols = useMemo(() => watchlist.map(i => i.symbol), [watchlist]);

    // 2. Core Data & Portfolio
    const {
        getAssets, addTransaction, deleteTransaction, updateTransaction,
        transactions, getPortfolioHistory, importTransactions,
        updateAssetPrice, updateAssetOverride, refreshPrices,
        prices, priceChanges, priceVolumes,
        assetOverrides, manualPrices, manualPriceSources
    } = usePortfolio(picks, watchlistSymbols);

    // 3. Reactivity: Refresh prices when watchlist changes
    useEffect(() => {
        if (watchlistSymbols.length > 0) {
            refreshPrices(true);
        }
    }, [watchlistSymbols.join(','), refreshPrices]);

    const assets = getAssets();
    const { notify } = useNotification();

    // Market Picks Notifications
    useMarketPicksNotifications(picks, prices as Record<string, number>, priceChanges, picksHistory);



    // Auto-Hydration Listener
    useEffect(() => {
        const handleCloudRestore = async (event: CustomEvent) => {
            const data = event.detail;
            if (data) {
                if (confirm("Data found in Cloud Vault. Restore now? (Local data will be replaced)")) {
                    await BackupService.restoreFullBackup(data);
                    window.location.reload();
                }
            }
        };

        window.addEventListener('cloud-vault-downloaded', handleCloudRestore as any);
        return () => window.removeEventListener('cloud-vault-downloaded', handleCloudRestore as any);
    }, []);

    // 4. SQL Analyst Service (Instant Analyst)
    useEffect(() => {
        import('./services/SqlAnalystService').then(({ SqlAnalystService }) => {
            SqlAnalystService.init();
        });
    }, []);



    // 3. Navigation & UI State
    const {
        currentView, navigateTo, isMobileMenuOpen, setIsMobileMenuOpen,
        isDarkMode, toggleTheme, locale
    } = useAppNavigation();

    // Rabby/Classic Dashboard Toggle
    const [useRabbyUI, setUseRabbyUI] = useState(() => {
        return localStorage.getItem('use_rabby_ui') === 'true';
    });

    // 3. Data Storage & Import/Export
    const { downloadJSON, downloadCSV, handleFileUpload } = useDataStorage(transactions, importTransactions, notify);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 4. Alerts
    const { alerts, addAlert, removeAlert, toggleAlert, isMuted, toggleMute } = useAlerts(prices, assets);

    // 5. Form & Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [formDefaults, setFormDefaults] = useState<any>(null);

    const [simulatorState, setSimulatorState] = useState<{ symbol: string, price: number } | null>(null);

    // Persist Rabby UI preference
    useEffect(() => {
        localStorage.setItem('use_rabby_ui', useRabbyUI.toString());
    }, [useRabbyUI]);

    // --- Handlers ---
    const handleSimulate = (symbol: string, price: number) => {
        setSimulatorState({ symbol, price });
        navigateTo('notes');
    };
    const handleEditClick = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsFormOpen(true);
    };

    const handleAddTransaction = (asset?: Asset) => {
        setEditingTransaction(null);

        // If asset is provided (from LP Add button), pre-fill the form
        if (asset) {
            setFormDefaults({
                assetSymbol: asset.symbol,
                inputMode: 'LP',
                type: 'DEPOSIT'
            });
        } else {
            setFormDefaults(null);
        }

        setIsFormOpen(true);
    };

    const handleAddClaim = (lpSymbol: string) => {
        setFormDefaults({ relatedAssetSymbol: lpSymbol, type: 'INTEREST' });
        setEditingTransaction(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingTransaction(null);
        setFormDefaults(null);
    };

    const handleCompound = (rewardTx: Transaction) => {
        // If it's a reward, we want to re-invest it as a DEPOSIT with isCompound: true
        setFormDefaults({
            assetSymbol: rewardTx.assetSymbol,
            amount: rewardTx.amount,
            pricePerUnit: rewardTx.pricePerUnit,
            paymentAmount: rewardTx.amount * (rewardTx.pricePerUnit || 0),
            paymentCurrency: 'USD',
            type: 'DEPOSIT',
            isCompound: true,
            notes: `Compounded from reward on ${rewardTx.date}`,
            relatedAssetSymbol: rewardTx.relatedAssetSymbol // Link it back to the source LP
        });
        setEditingTransaction(null);
        setIsFormOpen(true);
    };

    const handleSaveTransaction = (transaction: Transaction) => {
        if (editingTransaction) {
            updateTransaction(transaction);
            notify.success('Transaction updated successfully');
        } else {
            addTransaction(transaction);
            notify.success('Transaction added successfully');
        }
        handleFormClose();
    };

    const triggerImport = () => fileInputRef.current?.click();

    return (
        <div className={`app-container min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'dark bg-[#020617] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans transition-colors duration-300`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".json"
            />

            {/* Mobile Header (Hidden on Desktop) */}
            <Sidebar
                isMobile={true}
                currentView={currentView}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                navigateTo={navigateTo}
                onImportClick={triggerImport}
                onExportClick={downloadJSON}
                useRabbyUI={useRabbyUI}
                toggleRabbyUI={() => setUseRabbyUI(!useRabbyUI)}
            />

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <Sidebar
                currentView={currentView}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                navigateTo={navigateTo}
                onImportClick={triggerImport}
                onExportClick={downloadJSON}
                useRabbyUI={useRabbyUI}
                toggleRabbyUI={() => setUseRabbyUI(!useRabbyUI)}
            />

            {/* Main Content */}
            <main className="flex-1 p-3 md:p-6 overflow-auto pb-20 md:pb-6">
                <ErrorBoundary>
                    <React.Suspense fallback={<div className="flex items-center justify-center h-full text-slate-400">Loading View...</div>}>
                        {currentView === 'dashboard' || currentView === 'analytics' || currentView === 'notes' ? (
                            <Dashboard
                                assets={assets}
                                transactions={transactions}
                                onEditClick={handleEditClick}
                                onDeleteClick={deleteTransaction}
                                history={getPortfolioHistory()}
                                alerts={alerts}
                                onToggleAlert={toggleAlert}
                                isMuted={isMuted}
                                onToggleMute={toggleMute}
                                onAddAlert={addAlert}
                                onRemoveAlert={removeAlert}
                                onAddTransaction={handleAddTransaction}
                                onAddClaim={handleAddClaim}
                                onRefreshPrices={refreshPrices}
                                prices={prices}
                                priceChanges={priceChanges}
                                priceVolumes={priceVolumes}
                                updateAssetPrice={updateAssetPrice}
                                view={currentView as any}
                                locale={locale}
                                onAddClick={() => setIsFormOpen(true)}
                                onUpdateAssetOverride={updateAssetOverride}
                                onSimulate={handleSimulate}
                                simulatorState={simulatorState}
                                onCompound={handleCompound}
                                manualPriceSources={manualPriceSources}
                            />
                        ) : (
                            <Settings />
                        )}
                    </React.Suspense>
                </ErrorBoundary>
            </main>

            <React.Suspense fallback={null}>
                <TransactionForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    onSave={handleSaveTransaction}
                    initialData={editingTransaction}
                    defaultValues={formDefaults}
                    assets={assets}
                />
            </React.Suspense>

            <BottomNav currentView={currentView} navigateTo={navigateTo} />

        </div>
    );
}

export default function AppWrapper() {
    return (
        <ErrorBoundary>
            <NotificationProvider>
                <App />
            </NotificationProvider>
        </ErrorBoundary>
    );
}
