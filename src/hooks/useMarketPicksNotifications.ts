import { useEffect, useRef } from 'react';
import { NotificationService } from '../services/NotificationService';
import { Asset, NotificationSettings } from '../types';
import { deriveOpenPrice, getPrice } from '../services/PriceService';
import { MarketPick } from '../services/database/types';

const SETTINGS_KEY = 'investment_tracker_notification_settings';
const LAST_SENT_KEY = 'investment_tracker_last_picks_notif';
const HEARTBEAT_INTERVAL = 60 * 1000; // Check every minute
const DEFAULT_INTERVAL = 2 * 60 * 60 * 1000; // 2 Hours

export const useMarketPicksNotifications = (picks: MarketPick[], prices: Record<string, number>, priceChanges: Record<string, number | null>, historicalData: Record<string, number | null>) => {
    const isRunning = useRef(false);
    const dataRef = useRef<{
        picks: MarketPick[];
        prices: Record<string, number>;
        priceChanges: Record<string, number | null>;
        historicalData: Record<string, number | null>;
    }>({ picks, prices, priceChanges, historicalData });

    // Keep data fresh for the interval closure
    useEffect(() => {
        dataRef.current = { picks, prices, priceChanges, historicalData };
    }, [picks, prices, priceChanges, historicalData]);

    useEffect(() => {
        if (isRunning.current) return;
        isRunning.current = true;

        const checkNow = async () => {
            try {
                const settingsRaw = localStorage.getItem(SETTINGS_KEY);
                if (!settingsRaw) return;

                const settings: NotificationSettings = JSON.parse(settingsRaw);
                if (!settings.marketPicksNotifEnabled) return;

                const { picks: latestPicks, prices: latestPrices, priceChanges: latestChanges, historicalData: latestHistory } = dataRef.current;

                // Allow empty data in logs but don't send notifications
                if (latestPicks.length === 0 || Object.keys(latestPrices).length === 0) {
                    console.log('[Heartbeat] Skipping: No data loaded yet.');
                    return;
                }

                const now = Date.now();
                const lastSent = parseInt(localStorage.getItem(LAST_SENT_KEY) || '0');
                const interval = settings.marketPicksNotifInterval || DEFAULT_INTERVAL;

                if (now - lastSent >= interval) {
                    console.log('[Heartbeat] Sending Market Picks update...');
                    await sendUpdate(latestPicks, latestPrices, latestChanges, latestHistory, settings);
                    localStorage.setItem(LAST_SENT_KEY, now.toString());
                    window.dispatchEvent(new Event('notification-log-update'));
                }
            } catch (err) {
                console.error('[Heartbeat] Error in notification cycle:', err);
            }
        };

        const checkInterval = setInterval(checkNow, HEARTBEAT_INTERVAL);

        // Listen for manual triggers
        window.addEventListener('force-market-picks-notif', checkNow);

        return () => {
            clearInterval(checkInterval);
            window.removeEventListener('force-market-picks-notif', checkNow);
            isRunning.current = false;
        };
    }, []); // Only start once

    const sendUpdate = async (picks: MarketPick[], prices: Record<string, number>, priceChanges: Record<string, number | null>, historicalData: Record<string, number | null>, settings: NotificationSettings) => {
        if (picks.length === 0) return;

        // Sort picks by price descending (Highest price first)
        const sortedPicks = [...picks].sort((a, b) => {
            const priceA = getPrice(a.symbol, prices);
            const priceB = getPrice(b.symbol, prices);
            return priceB - priceA;
        });

        const items = sortedPicks.map(pick => {
            const price = getPrice(pick.symbol, prices);
            if (!price) return null;

            // Try historicalData first (computed from open price)
            const openPrice = historicalData[pick.symbol];
            let perf = 0;
            
            if (openPrice) {
                // Calculate % change from open price
                perf = ((price - openPrice) / openPrice) * 100;
            } else if (priceChanges[pick.symbol] !== null && priceChanges[pick.symbol] !== undefined) {
                // Fallback to Scout's 24h change data
                perf = priceChanges[pick.symbol]!;
            }
            
            const perfSign = perf >= 0 ? '+' : '';

            const isDominance = pick.symbol.endsWith('.D');
            const prefix = isDominance ? '' : '$';
            const suffix = isDominance ? '%' : '';

            const formattedPrice = price < 1 ? price.toFixed(8) : price.toLocaleString();
            return `• *${pick.symbol}*: ${prefix}${formattedPrice}${suffix} (${perfSign}${perf.toFixed(1)}%)`;
        }).filter(Boolean);

        if (items.length === 0) return;

        const template = settings.marketPicksAlertTemplate || "🔭 *Tactical Market Update*\n\n{items}\n\n_Auto-sent every 2 hours_";
        const message = template.replace('{items}', items.join('\n'));

        // Telegram
        if (settings.telegramBotToken && settings.telegramChatId) {
            await NotificationService.sendTelegram(message, settings);
        }

        // Email
        if (settings.emailServiceId) {
            await NotificationService.sendEmail('Market Picks Update', message, settings);
        }
    };
};
