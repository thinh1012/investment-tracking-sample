import emailjs from '@emailjs/browser';
import { NotificationSettings } from '../types';
import { LogService } from './database/OtherServices';

export const NotificationService = {
    sendTelegram: async (message: string, settings: NotificationSettings): Promise<boolean> => {
        // [PHASE 28] Resolution order: UI Settings -> Electron Bridge -> Fail
        const botToken = settings.telegramBotToken || (window as any).electronAPI?.env?.TELEGRAM_BOT_TOKEN;
        const chatId = settings.telegramChatId || (window as any).electronAPI?.env?.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.warn('[Notification] Missing Telegram credentials (UI & Bridge)');
            return false;
        }

        try {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            console.log('[Notification] Sending Telegram message to:', `https://api.telegram.org/bot${botToken.slice(0, 6)}.../sendMessage`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            const data = await response.json();
            if (!data.ok) {
                console.error('[Notification] Telegram API Error:', data.description, data);
                await LogService.add({
                    id: crypto.randomUUID(),
                    date: Date.now(),
                    channel: 'TELEGRAM',
                    recipient: chatId || 'unknown',
                    message: message,
                    status: 'FAILURE',
                    error: `API Error: ${data.description}`,
                    type: message.includes('LP') ? 'LP' : 'PRICE'
                });
                return false;
            }

            await LogService.add({
                id: crypto.randomUUID(),
                date: Date.now(),
                channel: 'TELEGRAM',
                recipient: chatId || 'unknown',
                message: message,
                status: 'SUCCESS',
                type: message.includes('LP') ? 'LP' : 'PRICE'
            });
            return true;
        } catch (error) {
            console.error('[Notification] Telegram Network Error:', error);
            await LogService.add({
                id: crypto.randomUUID(),
                date: Date.now(),
                channel: 'TELEGRAM',
                recipient: settings.telegramChatId || 'unknown',
                message: message,
                status: 'FAILURE',
                error: String(error),
                type: 'SYSTEM'
            });
            return false;
        }
    },

    sendEmail: async (subject: string, message: string, settings: NotificationSettings): Promise<boolean> => {
        if (!settings.emailServiceId || !settings.emailTemplateId || !settings.emailPublicKey) {
            console.warn('[Notification] Missing EmailJS credentials');
            return false;
        }

        try {
            // Note: EmailJS usually requires 'template_params' that match your template
            // We assume a generic template with {{subject}} and {{message}} variables
            const templateParams = {
                subject: subject,
                message: message,
                to_name: 'Investor' // Default or customizable
            };

            await emailjs.send(
                settings.emailServiceId,
                settings.emailTemplateId,
                templateParams,
                settings.emailPublicKey
            );

            await LogService.add({
                id: crypto.randomUUID(),
                date: Date.now(),
                channel: 'EMAIL',
                recipient: 'EmailJS Config', // We don't have exact email unless we store it, using generic
                message: `Subject: ${subject}\n${message}`,
                status: 'SUCCESS',
                type: subject.includes('LP') ? 'LP' : 'PRICE'
            });
            return true;
        } catch (error) {
            console.error('[Notification] EmailJS Error:', error);
            await LogService.add({
                id: crypto.randomUUID(),
                date: Date.now(),
                channel: 'EMAIL',
                recipient: 'EmailJS Config',
                message: `Subject: ${subject}\n${message}`,
                status: 'FAILURE',
                error: (error as any)?.text || String(error),
                type: 'SYSTEM'
            });
            return false;
        }
    }
};
