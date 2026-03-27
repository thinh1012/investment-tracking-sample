import React from 'react';
import { MessageSquare } from 'lucide-react';
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


        </>
    );
};
