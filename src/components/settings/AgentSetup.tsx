import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Save } from 'lucide-react';
import { NotificationSettings } from '../../types';

interface AgentSetupProps {
    settings: NotificationSettings;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSave: () => void;
}

export const AgentSetup: React.FC<AgentSetupProps> = ({ settings, onChange, onSave }) => {

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                        <Bot size={32} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Agent Command Center</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Configure the neural pathways for your autonomous team.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* 1. Strategist Core (API Config) */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Sparkles className="text-indigo-500" size={20} />
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Strategist Core</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                AI Model Provider
                            </label>
                            <select
                                name="aiProvider"
                                value={settings.aiProvider || 'GEMINI'}
                                onChange={onChange}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            >
                                <option value="GEMINI">Google Gemini (Recommended)</option>
                                <option value="OPENAI">OpenAI (Coming Soon)</option>
                                <option value="GROK">xAI Grok (Requires Key)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                API Key
                            </label>
                            <input
                                type="password"
                                name="geminiApiKey"
                                value={settings.geminiApiKey || ''}
                                onChange={onChange}
                                placeholder="sk-..."
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Keys are stored locally. Never sent to Antigravity servers.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                Cognitive Model
                            </label>
                            <select
                                name="strategistModel"
                                value={settings.strategistModel || 'gemini-2.0-flash'}
                                onChange={onChange}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm"
                            >
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (New Standard - Recommended)</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy - 1,500 RPD)</option>
                                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8B (High Speed)</option>
                                <option value="gemma-3-12b-it">Gemma 3 12B (Massive Quota - 14,000 RPD)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Advanced - Lower Quota)</option>
                            </select>
                        </div>
                    </div>
                </div>

            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                    onClick={onSave}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 flex items-center gap-2"
                >
                    <Save size={20} /> Save Configuration
                </button>
            </div>
        </div>
    );
};
