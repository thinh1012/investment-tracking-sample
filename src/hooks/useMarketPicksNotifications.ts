import { useEffect, useRef } from 'react';
import { NotificationService } from '../services/notificationService';
import { Asset, NotificationSettings } from '../types';
import { deriveOpenPrice } from '../services/priceService';
import { MarketPick } from '../services/database/types';

const SETTINGS_KEY = 'investment_tracker_notification_settings';
const LAST_SENT_KEY = 'investment_tracker_last_picks_notif';
const HEARTBEAT_INTERVAL = 60 * 1000; // Check every minute
const DEFAULT_INTERVAL = 2 * 60 * 60 * 1000; // 2 Hours

export const useMarketPicksNotifications = (picks: MarketPick[], prices: Record<string, number>, priceChanges: Record<string, number>) => {
    const isRunning = useRef(false);

    useEffect(() => {
        if (isRunning.current) return;
        isRunning.current = true;

        const checkInterval = setInterval(async () => {
            const settingsRaw = localStorage.getItem(SETTINGS_KEY);
            if (!settingsRaw) return;

            const settings: NotificationSettings = JSON.parse(settingsRaw);
            if (!settings.marketPicksNotifEnabled) return;

            const now = Date.now();
            const lastSent = parseInt(localStorage.getItem(LAST_SENT_KEY) || '0');
            const interval = settings.marketPicksNotifInterval || DEFAULT_INTERVAL;

            if (now - lastSent >= interval) {
                console.log('[Heartbeat] Sending Market Picks update...');
                await sendUpdate(picks, prices, priceChanges, settings);
                localStorage.setItem(LAST_SENT_KEY, now.toString());
            }
        }, HEARTBEAT_INTERVAL);

        return () => {
            clearInterval(checkInterval);
            isRunning.current = false;
        };
    }, [picks, prices, priceChanges]);

    const sendUpdate = async (picks: MarketPick[], prices: Record<string, number>, priceChanges: Record<string, number>, settings: NotificationSettings) => {
        if (picks.length === 0) return;

        const items = picks.map(pick => {
            const price = prices[pick.symbol];
            if (!price) return null;

            const change = priceChanges[pick.symbol];
            const openPrice = deriveOpenPrice(price, change);
            const perf = openPrice ? ((price - openPrice) / openPrice) * 100 : 0;
            const perfSign = perf >= 0 ? '+' : '';

            return `• *${pick.symbol}*: $${price.toLocaleString()} (${perfSign}${perf.toFixed(1)}%)`;
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
