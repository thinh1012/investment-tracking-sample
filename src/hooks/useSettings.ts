import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { NotificationService } from '../services/NotificationService';
import { LogService, SettingsService } from '../services/database/OtherServices';
import { NotificationSettings, NotificationLog } from '../types';
import { ExternalScoutService } from '../services/ExternalScoutService';

export const useSettings = () => {
    const { notify } = useNotification();
    const [settings, setSettings] = useState<NotificationSettings>({
        telegramBotToken: '',
        telegramChatId: '',
        emailServiceId: '',
        emailTemplateId: '',
        emailPublicKey: '',
        lpRangeChecksEnabled: true,
        priceAlertTemplate: "🚨 Price Alert: {symbol} is {condition} ${target}\nCurrent Price: ${price}",
        lpAlertTemplate: "⚠️ LP Alert: {symbol} is now {status}\nPrice: ${price}\nRange: ${min} - ${max}",
        cloudSyncEnabled: true,
        cloudSyncInterval: 15,
        strategistModel: 'gemini-2.0-flash', // Updated default to follow goal.md recommendations
        geminiApiKey: ''
    });
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load settings from DB
    useEffect(() => {
        const loadSettings = async () => {
            const saved = await SettingsService.get();
            if (saved) {
                setSettings(prev => ({ ...prev, ...saved }));
            }
        };
        loadSettings();
    }, []);

    // Load logs from DB
    const loadLogs = async () => {
        try {
            const fetchedLogs = await LogService.getAll();
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Failed to load logs", error);
        }
    };

    useEffect(() => {
        loadLogs();
        const handleUpdate = () => loadLogs();
        window.addEventListener('notification-log-update', handleUpdate);
        return () => window.removeEventListener('notification-log-update', handleUpdate);
    }, []);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as any;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

    };

    const updateSetting = (key: keyof NotificationSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        await SettingsService.save(settings);

        // Push to Satellite if it's online
        const isOnline = await ExternalScoutService.checkStatus();
        if (isOnline) {
            await ExternalScoutService.syncNotificationConfig({
                telegramBotToken: settings.telegramBotToken,
                telegramChatId: settings.telegramChatId,
                whatsappPhone: settings.whatsappPhone,
                whatsappApiKey: settings.whatsappApiKey,
                volatilityThreshold: settings.volatilityThreshold,
                volatilityTemplate: settings.volatilityTemplate,
                volatilityWindowMinutes: settings.volatilityWindowMinutes,
                volatilityTelegramEnabled: settings.volatilityTelegramEnabled,
                volatilityWhatsappEnabled: settings.volatilityWhatsappEnabled
            });
        }

        notify.success('Settings saved successfully');
        window.dispatchEvent(new CustomEvent('notification-settings-update', { detail: settings }));
    };

    const toggleCloudSync = async (enabled: boolean) => {
        const newSettings = { ...settings, cloudSyncEnabled: enabled };
        setSettings(newSettings);
        await SettingsService.save(newSettings);
        notify.info(`Cloud Sync ${enabled ? 'Enabled' : 'Disabled'}`);
        window.dispatchEvent(new CustomEvent('notification-settings-update', { detail: newSettings }));
    };

    const handleClearLogs = async () => {
        if (confirm('Clear all notification history?')) {
            await LogService.clearAll();
            setLogs([]);
            notify.info('Notification history cleared');
        }
    };

    const testTelegram = async () => {
        try {
            setIsLoading(true);
            const success = await NotificationService.sendTelegram(
                '🔔 *Test Notification*\n\nYour Telegram integration is working correctly!',
                settings
            );

            if (success) {
                notify.success('Telegram test message sent!');
            } else {
                notify.error('Failed to send Telegram message. Check credentials.');
            }
        } catch (error) {
            console.error('Test Telegram failed', error);
            notify.error('An unexpected error occurred.');
        } finally {
            await loadLogs();
            setIsLoading(false);
        }
    };

    const testEmail = async () => {
        try {
            setIsLoading(true);
            const success = await NotificationService.sendEmail(
                'Test Notification',
                'Your EmailJS integration is working correctly!',
                settings
            );

            if (success) {
                notify.success('Test email sent!');
            } else {
                notify.error('Failed to send email. Check credentials.');
            }
        } catch (error) {
            console.error('Test Email failed', error);
            notify.error('An unexpected error occurred.');
        } finally {
            await loadLogs();
            setIsLoading(false);
        }
    };

    return {
        settings,
        setSettings,
        logs,
        isLoading,
        handleChange,
        updateSetting,
        handleSave,
        toggleCloudSync,
        handleClearLogs,
        testTelegram,
        testEmail,
        loadLogs
    };
};
