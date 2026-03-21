import React from 'react';
import { Brain, Sparkles, ShieldCheck } from 'lucide-react';
import { NotificationSettings } from '../../types';

interface AISettingsProps {
    settings: NotificationSettings;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ settings, onChange }) => {
    return (
        <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg text-purple-500">
                    <Brain size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI Strategist Intelligence</h2>
            </div>

            <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl p-4 flex gap-3 text-sm text-purple-800 dark:text-purple-300">
                <ShieldCheck className="flex-shrink-0" size={18} />
                <p>
                    <strong>Local Intelligence Boundary:</strong> The Strategist engine operates strictly in your local environment.
                    No portfolio data is sent to the LLM; only anonymous public metrics are used for synthesis.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                            AI Model Provider
                        </label>
                        <select
                            name="aiProvider"
                            value={settings.aiProvider || 'GEMINI'}
                            onChange={onChange}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        >
                            <option value="GEMINI">Google Gemini Flash (Recommended)</option>
                            <option value="OPENAI">OpenAI (GPT-4o/o1)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Strategist Model Version
                        </label>
                        <input
                            type="text"
                            name="strategistModel"
                            value={settings.strategistModel || 'gemini-1.5-flash'}
                            onChange={onChange}
                            placeholder="e.g. gemini-1.5-flash"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                            <span>Gemini API Key</span>
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                                <Sparkles size={12} /> Get Key
                            </a>
                        </label>
                        <input
                            type="password"
                            name="geminiApiKey"
                            value={settings.geminiApiKey || ''}
                            onChange={onChange}
                            placeholder="Enter your API key"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
                        />
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Strategy Pulse</h4>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Eyes & Ears active (Local)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
