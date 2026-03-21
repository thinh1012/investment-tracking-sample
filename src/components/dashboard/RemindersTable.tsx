import React, { useState, useEffect, useRef } from 'react';
import { Bell, Plus, Trash2, X, ChevronDown, Check } from 'lucide-react';
import { Asset } from '../../types';
import { TableShell } from '../common/TableShell';
import { useReminders } from '../../hooks/useReminders';
import { useNotification } from '../../context/NotificationContext';

interface RemindersTableProps {
    assets: Asset[];
    locale?: string;
}

const TokenLogo: React.FC<{ symbol: string }> = ({ symbol }) => {
    const [failed, setFailed] = useState(false);
    const src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`;
    if (failed) {
        return (
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-black text-indigo-400 uppercase flex-shrink-0">
                {symbol.slice(0, 2)}
            </div>
        );
    }
    return (
        <img src={src} alt={symbol} className="w-6 h-6 rounded-full flex-shrink-0" onError={() => setFailed(true)} />
    );
};

interface AddReminderModalProps {
    assets: Asset[];
    onAdd: (r: { token_symbol: string; reminder_date: string; note: string }) => void;
    onClose: () => void;
    syncing: boolean;
    prefillSymbol?: string;
}

const AddReminderModal: React.FC<AddReminderModalProps> = ({ assets, onAdd, onClose, syncing, prefillSymbol }) => {
    const tokenAssets = assets.filter(a =>
        !a.lpRange &&
        !a.symbol.toUpperCase().startsWith('LP') &&
        !a.symbol.includes('/') &&
        !a.symbol.includes('-') &&
        !a.symbol.toUpperCase().includes('POOL')
    );

    const [form, setForm] = useState({
        token_symbol: prefillSymbol || tokenAssets[0]?.symbol || '',
        reminder_date: '',
        note: '',
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.token_symbol || !form.reminder_date || !form.note) return;
        onAdd(form);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 space-y-5 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Add Token Reminder</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Token</label>
                        <div className="relative">
                            <select
                                value={form.token_symbol}
                                onChange={e => set('token_symbol', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 appearance-none pr-8"
                                required
                            >
                                {tokenAssets.map(a => (
                                    <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                        <input
                            type="date"
                            value={form.reminder_date}
                            onChange={e => set('reminder_date', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Action / Note</label>
                        <textarea
                            placeholder="e.g. Check if LP is still profitable, rebalance if APR drops below 5%"
                            value={form.note}
                            onChange={e => set('note', e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300 resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={syncing}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                        {syncing ? 'Saving...' : 'Add Reminder'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export const RemindersTable: React.FC<RemindersTableProps> = ({ assets, locale }) => {
    const { reminders, addReminder, toggleDone, deleteReminder, syncing } = useReminders();
    const [isOpen, setIsOpen] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { notify } = useNotification();
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (notifiedRef.current || reminders.length === 0) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        reminders.forEach(r => {
            if (r.is_done) return;
            const date = new Date(r.reminder_date);
            date.setHours(0, 0, 0, 0);
            if (date <= today) {
                notify.warning(`${r.token_symbol} reminder: ${r.note}`);
            }
        });
        notifiedRef.current = true;
    }, [reminders]);

    const pending = reminders.filter(r => !r.is_done);
    const done = reminders.filter(r => r.is_done);
    const sorted = [...pending, ...done];

    const daysUntil = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    return (
        <>
            <TableShell
                title="Reminders"
                subtitle="Token Actions & Follow-ups"
                icon={<Bell />}
                iconColor="indigo"
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                extraHeaderActions={
                    <button
                        onClick={e => { e.stopPropagation(); setShowModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 transition-all bg-slate-100 dark:bg-slate-800/50 rounded-xl"
                        title="Add Reminder"
                    >
                        <Plus size={16} />
                    </button>
                }
                className="lg:col-span-3"
            >
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {sorted.map(r => {
                        const days = daysUntil(r.reminder_date);
                        const isOverdue = days < 0 && !r.is_done;
                        const isToday = days === 0 && !r.is_done;

                        return (
                            <div
                                key={r.id}
                                className={`flex items-start gap-3 px-4 py-4 md:px-8 group/row transition-all ${r.is_done ? 'opacity-40' : ''}`}
                            >
                                {/* Done toggle */}
                                <button
                                    onClick={() => toggleDone(r.id, !r.is_done)}
                                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        r.is_done
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                                    }`}
                                >
                                    {r.is_done && <Check size={11} />}
                                </button>

                                {/* Token logo */}
                                <TokenLogo symbol={r.token_symbol} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-bold text-sm text-slate-800 dark:text-slate-100 ${r.is_done ? 'line-through' : ''}`}>
                                            {r.token_symbol}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                            r.is_done ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' :
                                            isOverdue ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' :
                                            isToday ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {r.is_done ? 'Done' :
                                             isOverdue ? `${Math.abs(days)}d overdue` :
                                             isToday ? 'Today' :
                                             `in ${days}d`}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(r.reminder_date).toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{r.note}</p>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => deleteReminder(r.id)}
                                    className="opacity-0 group-hover/row:opacity-100 flex-shrink-0 p-1.5 text-slate-300 hover:text-rose-500 transition-all bg-slate-100 dark:bg-slate-800 rounded-lg mt-0.5"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })}

                    {reminders.length === 0 && (
                        <div className="px-8 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <Bell size={36} className="text-slate-200 dark:text-slate-800" />
                                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">No reminders yet</p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="text-xs text-indigo-500 hover:text-indigo-600 font-bold"
                                >
                                    + Add your first reminder
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </TableShell>

            {showModal && (
                <AddReminderModal
                    assets={assets}
                    onAdd={addReminder}
                    onClose={() => setShowModal(false)}
                    syncing={syncing}
                />
            )}
        </>
    );
};
