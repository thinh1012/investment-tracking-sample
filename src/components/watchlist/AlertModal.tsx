import React, { useState } from 'react';
import { Bell, X, Check, BellOff, Trash2 } from 'lucide-react';
import { PriceAlert, AlertCondition, NotificationChannel } from '../../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
    alerts: PriceAlert[];
    onAddAlert?: (symbol: string, targetPrice: number, condition: AlertCondition, channels: NotificationChannel[]) => void;
    onRemoveAlert?: (id: string) => void;
    onToggleAlert?: (id: string) => void;
}

export const AlertModal: React.FC<Props> = ({
    isOpen, onClose, symbol, currentPrice, alerts,
    onAddAlert, onRemoveAlert, onToggleAlert
}) => {
    const [alertTargetPrice, setAlertTargetPrice] = useState(currentPrice ? currentPrice.toString() : '');
    const [alertCondition, setAlertCondition] = useState<AlertCondition>('ABOVE');
    const [alertChannels, setAlertChannels] = useState<NotificationChannel[]>(['TELEGRAM']);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!symbol || !alertTargetPrice || !onAddAlert) return;
        onAddAlert(symbol, parseFloat(alertTargetPrice), alertCondition, alertChannels);
        onClose();
    };

    const toggleChannel = (channel: NotificationChannel) => {
        setAlertChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
    };

    const activeAlerts = alerts.filter(a => a.symbol === symbol);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="text-indigo-600" />
                        Set Alert for {symbol}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="number"
                                value={alertTargetPrice}
                                onChange={(e) => setAlertTargetPrice(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Condition</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setAlertCondition('ABOVE')}
                                className={`py-2 px-4 rounded-lg border font-medium transition-colors ${alertCondition === 'ABOVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                Price Above
                            </button>
                            <button
                                onClick={() => setAlertCondition('BELOW')}
                                className={`py-2 px-4 rounded-lg border font-medium transition-colors ${alertCondition === 'BELOW' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                Price Below
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notify via</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => toggleChannel('APP')}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${alertChannels.includes('APP') ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="In-App Notification"
                            >
                                <Bell size={16} /> App
                            </button>
                            <button
                                onClick={() => toggleChannel('TELEGRAM')}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${alertChannels.includes('TELEGRAM') ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="Telegram Message"
                            >
                                <TelegramIcon /> Telegram
                            </button>
                            <button
                                onClick={() => toggleChannel('EMAIL')}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${alertChannels.includes('EMAIL') ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                title="Email Notification"
                            >
                                <EmailIcon /> Email
                            </button>
                        </div>
                    </div>
                </div>

                {/* Existing Alerts List */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Active Alerts</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {activeAlerts.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No active alerts for {symbol}</p>
                        ) : (
                            activeAlerts.map(alert => (
                                <div key={alert.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm group">
                                    <div>
                                        <span className={`font-bold ${alert.condition === 'ABOVE' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {alert.condition === 'ABOVE' ? '>' : '<'} ${alert.targetPrice}
                                        </span>
                                        <div className="flex gap-2 mt-1">
                                            {alert.channels.map(c => (
                                                <span key={c} className="text-[10px] bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-500">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onToggleAlert && onToggleAlert(alert.id)}
                                            className={`p-1.5 rounded transition-colors ${alert.isActive ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                                            title={alert.isActive ? "Pause Alert" : "Resume Alert"}
                                        >
                                            {alert.isActive ? <Check size={14} /> : <BellOff size={14} />}
                                        </button>
                                        <button
                                            onClick={() => onRemoveAlert && onRemoveAlert(alert.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                            title="Delete Alert"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={!alertTargetPrice}
                    className="w-full mt-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Create Alert
                </button>
            </div>
        </div>
    );
};

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.48-1.02-2.4-1.63-1.06-.7.53-1.09 1.14-1.71.16-.16 2.94-2.7 2.99-2.85.01-.03.01-.15-.06-.21-.07-.06-.18-.04-.26-.02-.11.02-1.8 1.15-5.08 3.37-.48.34-.91.5-1.3.51-.43 0-1.25-.24-1.86-.43-.75-.23-1.35-.46-1.3-.98.02-.27.38-.55 1.05-.83 4.12-1.79 6.87-2.97 8.24-3.53 3.92-1.6 4.74-1.9 5.27-1.91.12 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.02.13z" />
    </svg>
);

const EmailIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);
