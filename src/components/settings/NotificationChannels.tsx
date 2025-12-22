import React from 'react';
import { MessageSquare, Mail } from 'lucide-react';
import { NotificationSettings } from '../../types';

interface Props {
    settings: NotificationSettings;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTestTelegram: () => void;
    onTestEmail: () => void;
    isLoading: boolean;
}

export const NotificationChannels: React.FC<Props> = ({
    settings,
    onChange,
    onTestTelegram,
    onTestEmail,
    isLoading
}) => {
    return (
        <>
            {/* Telegram Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-blue-500">
                        <MessageSquare size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Telegram</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Bot Token
                        </label>
                        <input
                            type="text"
                            name="telegramBotToken"
                            value={settings.telegramBotToken}
                            onChange={onChange}
                            placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">@BotFather</a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Chat ID
                        </label>
                        <input
                            type="text"
                            name="telegramChatId"
                            value={settings.telegramChatId}
                            onChange={onChange}
                            placeholder="e.g. 123456789"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Send a message to your bot and check <a href="https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">getUpdates</a> API to find your ID.
                        </p>
                    </div>

                    <button
                        onClick={onTestTelegram}
                        disabled={!settings.telegramBotToken || !settings.telegramChatId || isLoading}
                        className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Test Telegram Message'}
                    </button>
                </div>
            </div>

            {/* EmailJS Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-amber-500">
                        <Mail size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Email (via EmailJS)</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Service ID
                        </label>
                        <input
                            type="text"
                            name="emailServiceId"
                            value={settings.emailServiceId}
                            onChange={onChange}
                            placeholder="e.g. service_xyz123"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Template ID
                        </label>
                        <input
                            type="text"
                            name="emailTemplateId"
                            value={settings.emailTemplateId}
                            onChange={onChange}
                            placeholder="e.g. template_abc123"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Public Key (User ID)
                        </label>
                        <input
                            type="text"
                            name="emailPublicKey"
                            value={settings.emailPublicKey}
                            onChange={onChange}
                            placeholder="e.g. user_12345678"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <button
                        onClick={onTestEmail}
                        disabled={!settings.emailServiceId || !settings.emailTemplateId || !settings.emailPublicKey || isLoading}
                        className="w-full py-2 px-4 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Test Email'}
                    </button>
                </div>
            </div>
        </>
    );
};
