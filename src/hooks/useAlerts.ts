import { useState, useEffect, useCallback } from 'react';
import { PriceAlert, AlertCondition, NotificationChannel, NotificationSettings } from '../types';
import { NotificationService } from '../services/notificationService';
import { useNotification } from '../context/NotificationContext';

const ALERTS_STORAGE_KEY = 'investment_tracker_price_alerts';
const SETTINGS_KEY = 'investment_tracker_notification_settings';
const WATCHLIST_KEY = 'investment_tracker_watchlist';
const WATCHLIST_TRIGGERS_KEY = 'investment_tracker_watchlist_triggers';
const COOLDOWN_MS = 60 * 60 * 1000; // 1 Hour

import { Asset } from '../types';

// Helper for safe parsing to avoid white-screen crashes
const safeJsonParse = <T>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Failed to parse ${key} from localStorage`, error);
        return fallback;
    }
};

export const useAlerts = (prices: Record<string, number>, assets: Asset[] = []) => {
    const { notify } = useNotification();

    // Use safe parsing for all initial states
    const [alerts, setAlerts] = useState<PriceAlert[]>(() =>
        safeJsonParse(ALERTS_STORAGE_KEY, [])
    );

    const [lpStatus, setLpStatus] = useState<Record<string, boolean>>(() =>
        safeJsonParse('investment_tracker_lp_status', {})
    );

    // Reload settings on render
    const [settings, setSettings] = useState<NotificationSettings>(() =>
        safeJsonParse(SETTINGS_KEY, {})
    );

    // Listen for storage changes to sync settings and watchlist across tabs/components
    useEffect(() => {
        const loadFromStorage = () => {
            const savedSettings = safeJsonParse(SETTINGS_KEY, null);
            if (savedSettings) setSettings(savedSettings);
        };
        window.addEventListener('storage', loadFromStorage);
        // Custom event for same-tab updates
        window.addEventListener('local-storage-update', loadFromStorage);

        return () => {
            window.removeEventListener('storage', loadFromStorage);
            window.removeEventListener('local-storage-update', loadFromStorage);
        };
    }, []);

    // Persist Alerts
    useEffect(() => {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    }, [alerts]);

    const addAlert = (symbol: string, targetPrice: number, condition: AlertCondition, channels: NotificationChannel[]) => {
        const newAlert: PriceAlert = {
            id: crypto.randomUUID(),
            symbol,
            targetPrice,
            condition,
            channels,
            isActive: true
        };
        setAlerts(prev => [...prev, newAlert]);
        notify.success(`Alert set for ${symbol} @ $${targetPrice}`);
    };

    const removeAlert = (id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
        notify.info('Alert removed');
    };

    const toggleAlert = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    };

    // Global Mute State (Persisted)
    const [isMuted, setIsMuted] = useState<boolean>(() =>
        safeJsonParse('investment_tracker_alerts_muted', false)
    );

    const toggleMute = () => {
        setIsMuted(prev => {
            const newValue = !prev;
            localStorage.setItem('investment_tracker_alerts_muted', JSON.stringify(newValue));
            return newValue;
        });
        notify.info(isMuted ? 'Alerts Resumed 🔔' : 'Alerts Paused 🔕');
    };

    // Price Alert Monitor Loop (Manual + Watchlist)
    useEffect(() => {
        const checkAlerts = async () => {
            if (isMuted) return; // SKIP IF MUTED

            const currentSettings = safeJsonParse<NotificationSettings>(SETTINGS_KEY, {});
            const now = Date.now();
            let updatedAlerts = false;
            // ... rest of checking logic


            // 1. Check Manual Alerts
            const newAlerts = alerts.map(alert => {
                if (!alert.isActive) return alert;

                // Skip if cooldown active
                if (alert.lastTriggeredAt && (now - alert.lastTriggeredAt < COOLDOWN_MS)) {
                    return alert;
                }

                const currentPrice = prices[alert.symbol];
                if (!currentPrice) return alert;

                let triggered = false;
                if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
                    triggered = true;
                } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
                    triggered = true;
                }

                if (triggered) {
                    updatedAlerts = true;
                    sendNotification(alert.symbol, alert.condition, alert.targetPrice, currentPrice, alert.channels, currentSettings, 'MANUAL');
                    return { ...alert, lastTriggeredAt: now };
                }

                return alert;
            });

            if (updatedAlerts) {
                setAlerts(newAlerts);
            }

            // 2. Check Watchlist Implicit Alerts
            // Watchlist is managed by Watchlist.tsx but stored in LS. We read it purely for triggering.
            // Using safe parsing here is critical.
            const watchlistItems = safeJsonParse<any[]>(WATCHLIST_KEY, []);

            if (watchlistItems.length > 0) {
                const triggers = safeJsonParse<Record<string, number>>(WATCHLIST_TRIGGERS_KEY, {});
                let triggersUpdated = false;

                watchlistItems.forEach((item: any) => {
                    const currentPrice = prices[item.symbol];
                    if (!currentPrice) return;

                    // Helper to check and trigger
                    const checkImplicit = (target: number | undefined, condition: AlertCondition) => {
                        if (!target) return;

                        // Unique key for this implicit alert: symbol_condition_target
                        const triggerKey = `${item.symbol}_${condition}_${target}`;
                        const lastTrigger = triggers[triggerKey] || 0;

                        if (now - lastTrigger < COOLDOWN_MS) return;

                        let isHit = false;
                        if (condition === 'ABOVE' && currentPrice >= target) isHit = true;
                        if (condition === 'BELOW' && currentPrice <= target) isHit = true;

                        if (isHit) {
                            // Default Channels for Watchlist: APP + All Configured External
                            const channels: NotificationChannel[] = ['APP'];
                            if (currentSettings.telegramBotToken) channels.push('TELEGRAM');
                            if (currentSettings.emailServiceId) channels.push('EMAIL');

                            sendNotification(item.symbol, condition, target, currentPrice, channels, currentSettings, 'WATCHLIST');

                            triggers[triggerKey] = now;
                            triggersUpdated = true;
                        }
                    };

                    checkImplicit(item.targetBuyPrice, 'BELOW');
                    checkImplicit(item.targetSellPrice, 'ABOVE');
                });

                if (triggersUpdated) {
                    localStorage.setItem(WATCHLIST_TRIGGERS_KEY, JSON.stringify(triggers));
                }
            }
        };

        if (Object.keys(prices).length > 0) {
            checkAlerts();
        }
    }, [prices]); // Intentionally not including settings/alerts to avoid loops

    const sendNotification = (
        symbol: string,
        condition: AlertCondition,
        target: number,
        current: number,
        channels: NotificationChannel[],
        settings: NotificationSettings,
        source: 'MANUAL' | 'WATCHLIST'
    ) => {
        const condText = condition === 'ABOVE' ? 'above' : 'below';
        const baseTemplate = settings.priceAlertTemplate || "🚨 Price Alert: {symbol} is {condition} {target}\nCurrent Price: {price}";

        // Add prefix for watchlist to distinguish? Optional.
        // const prefix = source === 'WATCHLIST' ? '[Watchlist] ' : ''; 

        const message = baseTemplate
            .replace('{symbol}', symbol)
            .replace('{condition}', condText)
            .replace('{target}', target.toLocaleString())
            .replace('{price}', current.toLocaleString());

        if (channels.includes('APP')) {
            notify.info(message);
        }

        // Async external notifications
        if (channels.includes('TELEGRAM')) {
            NotificationService.sendTelegram(message, settings);
        }
        if (channels.includes('EMAIL')) {
            NotificationService.sendEmail(`Price Alert: ${symbol}`, message, settings);
        }
    };

    // LP Range Monitor Loop
    useEffect(() => {
        const checkLpAlerts = () => {
            const currentSettings = safeJsonParse<NotificationSettings>(SETTINGS_KEY, {});

            // Default to Enabled if undefined, unless strictly disabled
            if (currentSettings.lpRangeChecksEnabled === false) return;

            const newLpStatus = { ...lpStatus };
            let updated = false;

            assets.forEach(asset => {
                // Ensure it's an LP with range data and we have a definitive status
                if (asset.lpRange && asset.monitorSymbol && asset.inRange !== undefined) {
                    const prev = lpStatus[asset.symbol];
                    const curr = asset.inRange;

                    // If status changed (and it's not the first load)
                    if (prev !== undefined && prev !== curr) {
                        const statusText = curr ? 'Back in Range 🟢' : 'Out of Range 🔴';
                        const baseTemplate = currentSettings.lpAlertTemplate || "⚠️ LP Alert: {symbol} is now {status}\nPrice: {price}\nRange: {min} - {max}";

                        const message = baseTemplate
                            .replace('{symbol}', asset.symbol)
                            .replace('{status}', statusText)
                            .replace('{price}', asset.monitorPrice?.toFixed(4) || '0')
                            .replace('{min}', asset.lpRange.min.toString())
                            .replace('{max}', asset.lpRange.max.toString());

                        // Trigger Notifications (Global Config)
                        // Always App
                        notify.info(message);

                        // External if configured
                        if (currentSettings.telegramBotToken && currentSettings.telegramChatId) {
                            NotificationService.sendTelegram(message, currentSettings);
                        }
                        if (currentSettings.emailServiceId) {
                            NotificationService.sendEmail(`LP Status Change: ${asset.symbol}`, message, currentSettings);
                        }

                        updated = true;
                        newLpStatus[asset.symbol] = curr;
                    }
                    // First time tracking this asset, just sync state without alert
                    else if (prev === undefined) {
                        newLpStatus[asset.symbol] = curr;
                        updated = true;
                    }
                }
            });

            if (updated) {
                setLpStatus(newLpStatus);
                localStorage.setItem('investment_tracker_lp_status', JSON.stringify(newLpStatus));
            }
        };

        checkLpAlerts();
    }, [assets]); // Runs whenever assets update (prices update)

    return {
        alerts,
        addAlert,
        removeAlert,
        toggleAlert,
        isMuted,
        toggleMute
    };
};
