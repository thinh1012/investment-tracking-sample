import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { NotificationService } from '../services/notificationService';
import { LogService, SettingsService } from '../services/db';
import { NotificationSettings, NotificationLog } from '../types';

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
        lpAlertTemplate: "⚠️ LP Alert: {symbol} is now {status}\nPrice: ${price}\nRange: ${min} - ${max}"
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
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSave = async () => {
        await SettingsService.save(settings);
        notify.success('Settings saved successfully');
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
        handleSave,
        handleClearLogs,
        testTelegram,
        testEmail,
        loadLogs
    };
};
