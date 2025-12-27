import React, { useState, useRef } from 'react';
import { usePortfolio } from './hooks/usePortfolio';
import { useAlerts } from './hooks/useAlerts';
import { useNotification } from './context/NotificationContext';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useDataStorage } from './hooks/useDataStorage';
import { useWatchlist } from './hooks/useWatchlist';
import { useMarketPicks } from './hooks/useMarketPicks';
import { useMarketPicksNotifications } from './hooks/useMarketPicksNotifications';

import { Dashboard } from './components/dashboard/Dashboard';
import TransactionForm from './components/TransactionForm';
import Settings from './components/Settings';
import { CloudSyncModal } from './components/CloudSyncModal';
import { Sidebar } from './components/layout/Sidebar';
import { BackupService, StrategistIntelligenceService } from './services/db';
import { useCloudSync } from './hooks/useCloudSync';
import { useAutoSync } from './hooks/useAutoSync';

function App() {
  // 1. Core Data & Portfolio
  const {
    getAssets, addTransaction, deleteTransaction, updateTransaction,
    transactions, getPortfolioHistory, importTransactions,
    updateAssetPrice, updateAssetOverride, refreshPrices,
    prices, priceChanges, priceVolumes,
    assetOverrides, manualPrices
  } = usePortfolio();

  const assets = getAssets();
  const { notify } = useNotification();

  // Watchlist State (Lifted for Sync)
  const watchlistState = useWatchlist(refreshPrices);
  const { watchlist } = watchlistState;

  // Market Picks State (For notifications)
  const { picks, historicalData: picksHistory } = useMarketPicks();
  useMarketPicksNotifications(picks, prices, priceChanges, picksHistory);

  // 2. Cloud Sync (New Automated Flow)
  const syncState = useCloudSync();
  const { user, syncKey, uploadVault, lastSyncTime, isLoading: isSyncLoading, isCloudNewer, checkSyncStatus } = syncState;

  // Auto-Sync Background Worker (Monitoring everything)
  const syncTrigger = React.useMemo(() => ({
    transactions,
    watchlist,
    assetOverrides,
    manualPrices
  }), [transactions, watchlist, assetOverrides, manualPrices]);

  useAutoSync(
    user,
    syncKey,
    syncTrigger,
    uploadVault,
    checkSyncStatus
  );

  // Auto-Hydration Listener
  React.useEffect(() => {
    const handleCloudRestore = async (event) => {
      const data = event.detail;
      if (data) {
        if (confirm("Data found in Cloud Vault. Restore now? (Local data will be replaced)")) {
          await BackupService.restoreFullBackup(data);
          window.location.reload();
        }
      }
    };

    window.addEventListener('cloud-vault-downloaded', handleCloudRestore);
    return () => window.removeEventListener('cloud-vault-downloaded', handleCloudRestore);
  }, []);

  // 4. Strategist Intelligence Service (Daily Job)
  React.useEffect(() => {
    const runCheck = async () => {
      const needsJob = await StrategistIntelligenceService.runDailyCheck();
      if (needsJob) {
        console.log("App: Triggering Daily Scrape via Strategist Job Event");
        window.dispatchEvent(new CustomEvent('strategist-job-requested'));
      }
    };

    runCheck();

    const handleJobRequest = () => {
      console.log("App: Strategist Intelligence Job Signaled. Agent should perform scrape now.");
      // This log is a signal for the Overseer/Agent to perform the subagent actions.
    };

    window.addEventListener('strategist-job-requested', handleJobRequest);
    return () => window.removeEventListener('strategist-job-requested', handleJobRequest);
  }, []);

  // 3. Navigation & UI State
  const {
    currentView, navigateTo, isMobileMenuOpen, setIsMobileMenuOpen,
    isDarkMode, toggleTheme, locale
  } = useAppNavigation();

  // 3. Data Storage & Import/Export
  const { downloadJSON, downloadCSV, handleFileUpload } = useDataStorage(transactions, importTransactions, notify);
  const fileInputRef = useRef(null);

  // 4. Alerts
  const { alerts, addAlert, removeAlert, toggleAlert, isMuted, toggleMute } = useAlerts(prices, assets);

  // 5. Form & Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formDefaults, setFormDefaults] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [simulatorState, setSimulatorState] = useState(null);

  // --- Handlers ---
  const handleSimulate = (symbol, price) => {
    setSimulatorState({ symbol, price });
    navigateTo('notes');
  };
  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleAddCapital = (symbol) => {
    setFormDefaults({ assetSymbol: symbol, inputMode: 'LP', type: 'DEPOSIT' });
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleAddClaim = (symbol) => {
    setFormDefaults({ relatedAssetSymbol: symbol, type: 'INTEREST' });
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
    setFormDefaults(null);
  };

  const handleSaveTransaction = (transaction) => {
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
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">

      {/* Navigation (Mobile Header + Sidebars) */}
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
        onSyncClick={() => setIsSyncModalOpen(true)}
      />

      <Sidebar
        currentView={currentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        navigateTo={navigateTo}
        onImportClick={triggerImport}
        onExportClick={downloadJSON}
        onSyncClick={() => setIsSyncModalOpen(true)}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".json"
      />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {currentView !== 'settings' ? (
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
            onRefreshPrices={refreshPrices}
            prices={prices}
            priceChanges={priceChanges}
            priceVolumes={priceVolumes}
            updateAssetPrice={updateAssetPrice}
            view={currentView}
            locale={locale}
            onAddClick={() => setIsFormOpen(true)}
            onAddCapital={handleAddCapital}
            onAddClaim={handleAddClaim}
            onUpdateAssetOverride={updateAssetOverride}
            onExportCSV={downloadCSV}
            watchlistState={watchlistState}
            onSimulate={handleSimulate}
            simulatorState={simulatorState}
            lastSyncTime={lastSyncTime}
            isSyncLoading={isSyncLoading}
            isCloudNewer={isCloudNewer}
            user={user}
            syncKey={syncKey}
          />
        ) : (
          <Settings
            assets={assets}
            updateAssetPrice={updateAssetPrice}
            prices={prices}
          />
        )}
      </main>

      <TransactionForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        defaultValues={formDefaults}
        assets={assets}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        sync={syncState}
        onRestore={async (data) => {
          console.log("App: onRestore triggered from Modal. Data size:", !!data);
          try {
            if (confirm("Data found in Cloud Vault. Restore now? (Local data will be replaced)")) {
              console.log("App: User confirmed restore. Starting BackupService...");
              await BackupService.restoreFullBackup(data);
              console.log("App: BackupService complete. Reloading...");
              window.location.reload();
            } else {
              console.log("App: User canceled restore.");
            }
          } catch (e) {
            console.error("App: Restore sequence failed:", e);
            alert("Restore failed: " + e)
          }
        }}
      />
    </div>
  );
}

export default App;