
import { useState, useEffect } from 'react';
import { Transaction, NotificationSettings, Asset, NotificationLog } from '../types';
import { TransactionService, SettingsService, LogService, WatchlistService, PriceDataService, AssetOverrideService } from '../services/db';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const CLEANUP_REMINDER_COUNT = 10; // Remind every 10 backups

export const useAutoBackup = () => {
    const [isBackupDue, setIsBackupDue] = useState(false);
    const [showCleanupReminder, setShowCleanupReminder] = useState(false);

    useEffect(() => {
        checkBackupStatus();
    }, []);

    const checkBackupStatus = async () => {
        const lastBackup = localStorage.getItem('last_auto_backup_timestamp');
        const now = Date.now();

        // Logic Check: If no backup timestamp exists (First run),
        // Check if we actually have data. If NO data, we don't need a backup.
        // We set the timestamp to NOW so the clock starts ticking from today.
        if (!lastBackup) {
            const transactions = await TransactionService.getAll();
            if (transactions.length === 0) {
                console.log("Fresh install detected: Skipping initial backup warning.");
                localStorage.setItem('last_auto_backup_timestamp', now.toString());
                return;
            }
        }

        if (!lastBackup || (now - parseInt(lastBackup)) > BACKUP_INTERVAL_MS) {
            setIsBackupDue(true);
        }
    };

    const performBackup = async () => {
        try {
            // 1. Gather Data
            const transactions = await TransactionService.getAll();
            const watchlist = await WatchlistService.getAll();
            const settings = await SettingsService.get();
            const manualPrices = await PriceDataService.getManualPrices();
            const assetOverrides = await AssetOverrideService.getAll();

            const exportData = {
                transactions,
                watchlist,
                settings,
                manualPrices,
                assetOverrides,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            // 2. Create Download
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            const dateStr = new Date().toISOString().split('T')[0];
            downloadAnchorNode.setAttribute("download", `crypto-investment-backup-${dateStr}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            // 3. Update State
            localStorage.setItem('last_auto_backup_timestamp', Date.now().toString());

            // 4. Handle Cleanup Count
            const currentCount = parseInt(localStorage.getItem('backup_count') || '0');
            const newCount = currentCount + 1;
            localStorage.setItem('backup_count', newCount.toString());

            setIsBackupDue(false);

            if (newCount % CLEANUP_REMINDER_COUNT === 0) {
                setShowCleanupReminder(true);
            }

        } catch (error) {
            console.error("Auto Backup Failed", error);
            alert("Backup failed. Please try manual export from Settings.");
        }
    };

    const dismissBackup = () => {
        // Remind again in 1 hour if dismissed? Or just wait for next restart?
        // For now, let's snooze for 1 hour to avoid annoyance
        const oneHourLater = Date.now() - BACKUP_INTERVAL_MS + (60 * 60 * 1000);
        // Logic: if we set last backup to (Now - 11 hours), it will trigger again in 1 hour (total 12)
        // Check Logic: (Now - Last) > 12h. 
        // If we want to snooze 1h: Set Last = Now - 11h.
        // Then (Now - (Now - 11h)) = 11h. < 12h. Warning gone.
        // In 1h: (Now+1h - (Now-11h)) = 12h. Warning back.

        const snoozeDate = Date.now() - (BACKUP_INTERVAL_MS - (60 * 60 * 1000));
        localStorage.setItem('last_auto_backup_timestamp', snoozeDate.toString());
        setIsBackupDue(false);
    };

    const dismissCleanup = () => {
        setShowCleanupReminder(false);
    };

    return {
        isBackupDue,
        showCleanupReminder,
        performBackup,
        dismissBackup,
        dismissCleanup
    };
};
