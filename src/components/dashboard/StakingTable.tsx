import React, { useState, useEffect, useRef } from 'react';
import { Zap, Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { Asset, StakingPosition } from '../../types';
import { TableShell } from '../common/TableShell';
import { useStaking } from '../../hooks/useStaking';
import { useNotification } from '../../context/NotificationContext';

interface StakingTableProps {
    assets: Asset[];
    locale?: string;
}

const TokenLogo: React.FC<{ symbol: string }> = ({ symbol }) => {
    const [failed, setFailed] = useState(false);
    const src = `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/color/${symbol.toLowerCase()}.png`;
    if (failed) {
        return (
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase flex-shrink-0">
                {symbol.slice(0, 2)}
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={symbol}
            className="w-7 h-7 rounded-full flex-shrink-0"
            onError={() => setFailed(true)}
        />
    );
};

interface AddStakingModalProps {
    assets: Asset[];
    onAdd: (pos: Omit<StakingPosition, 'id' | 'created_at'>) => void;
    onClose: () => void;
    syncing: boolean;
    prefillSymbol?: string;
}

const AddStakingModal: React.FC<AddStakingModalProps> = ({ assets, onAdd, onClose, syncing, prefillSymbol }) => {
    const tokenAssets = assets.filter(a =>
        !a.lpRange &&
        !a.symbol.toUpperCase().startsWith('LP') &&
        !a.symbol.includes('/') &&
        !a.symbol.includes('-') &&
        !a.symbol.toUpperCase().includes('POOL')
    );

    const [form, setForm] = useState({
        token_symbol: prefillSymbol || (tokenAssets[0]?.symbol ?? ''),
        protocol: '',
        amount: '',
        apr: '',
        lock_period_days: '',
        unlock_date: '',
    });

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.token_symbol || !form.protocol || !form.amount || !form.apr) return;
        onAdd({
            token_symbol: form.token_symbol,
            protocol: form.protocol,
            amount: parseFloat(form.amount),
            apr: parseFloat(form.apr),
            lock_period_days: form.lock_period_days ? parseInt(form.lock_period_days) : undefined,
            unlock_date: form.unlock_date || undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 space-y-5 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Add Staking Position</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Token */}
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
                                {tokenAssets.length === 0 && <option value="">No tokens found</option>}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Protocol */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Protocol</label>
                        <input
                            type="text"
                            placeholder="e.g. Lido, Aave, Validator"
                            value={form.protocol}
                            onChange={e => set('protocol', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                            required
                        />
                    </div>

                    {/* Amount + APR */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => set('amount', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">APR %</label>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0.00"
                                value={form.apr}
                                onChange={e => set('apr', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                                required
                            />
                        </div>
                    </div>

                    {/* Lock Period + Unlock Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lock Period (days)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="Optional"
                                value={form.lock_period_days}
                                onChange={e => set('lock_period_days', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unlock Date</label>
                            <input
                                type="date"
                                value={form.unlock_date}
                                onChange={e => set('unlock_date', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={syncing}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
                    >
                        {syncing ? 'Saving...' : 'Add Position'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export const StakingTable: React.FC<StakingTableProps> = ({ assets, locale }) => {
    const { positions, addPosition, deletePosition, syncing } = useStaking();
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [prefillSymbol, setPrefillSymbol] = useState<string | undefined>();
    const { notify } = useNotification();
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (notifiedRef.current || positions.length === 0) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        positions.forEach(pos => {
            if (!pos.unlock_date) return;
            const unlock = new Date(pos.unlock_date);
            unlock.setHours(0, 0, 0, 0);
            if (unlock <= today) {
                notify.info(`${pos.token_symbol} staked on ${pos.protocol} is unlocked and ready to withdraw.`);
            }
        });
        notifiedRef.current = true;
    }, [positions]);

    const openModal = (symbol?: string) => {
        setPrefillSymbol(symbol);
        setShowModal(true);
    };

    const totalStakedValue = positions.length;

    const daysUntilUnlock = (unlockDate?: string) => {
        if (!unlockDate) return null;
        const diff = new Date(unlockDate).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <>
            <TableShell
                title="Staking"
                subtitle="Staked Positions & Rates"
                icon={<Zap />}
                iconColor="amber"
                isOpen={isOpen}
                onToggle={() => setIsOpen(!isOpen)}
                extraHeaderActions={
                    <button
                        onClick={e => { e.stopPropagation(); openModal(); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 transition-all bg-slate-100 dark:bg-slate-800/50 rounded-xl"
                        title="Add Staking Position"
                    >
                        <Plus size={16} />
                    </button>
                }
                className="lg:col-span-3"
            >
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <tr>
                            <th className="px-4 py-3 md:px-8 md:py-4">Token</th>
                            <th className="px-4 py-3 md:px-6 md:py-4">Protocol</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-right">Amount</th>
                            <th className="px-3 py-3 md:px-6 md:py-4 text-right">APR</th>
                            <th className="hidden md:table-cell px-6 py-4">Lock Period</th>
                            <th className="hidden md:table-cell px-6 py-4">Unlock Date</th>
                            <th className="px-4 py-3 md:px-6 md:py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {positions.map(pos => {
                            const daysLeft = daysUntilUnlock(pos.unlock_date);
                            const isLocked = daysLeft !== null && daysLeft > 0;
                            return (
                                <tr key={pos.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-200 group/row">
                                    <td className="px-4 py-3 md:px-8 md:py-4">
                                        <div className="flex items-center gap-3">
                                            <TokenLogo symbol={pos.token_symbol} />
                                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{pos.token_symbol}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                                        {pos.protocol}
                                    </td>
                                    <td className="px-3 py-3 md:px-6 md:py-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                                        {pos.amount.toLocaleString(locale || 'en-US', { maximumFractionDigits: 4 })}
                                        <div className="text-[10px] text-slate-400 font-normal">{pos.token_symbol}</div>
                                    </td>
                                    <td className="px-3 py-3 md:px-6 md:py-4 text-right">
                                        <span className="font-bold text-emerald-500 text-sm">{pos.apr}%</span>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                                        {pos.lock_period_days ? `${pos.lock_period_days}d` : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4 text-sm">
                                        {pos.unlock_date ? (
                                            <div className="flex flex-col">
                                                <span className="text-slate-700 dark:text-slate-200 font-medium">
                                                    {new Date(pos.unlock_date).toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                {daysLeft !== null && (
                                                    <span className={`text-[10px] font-bold ${isLocked ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                        {isLocked ? `${daysLeft}d left` : 'Unlocked'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                        <button
                                            onClick={() => deletePosition(pos.id)}
                                            className="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all bg-slate-100 dark:bg-slate-800 rounded-lg"
                                            title="Remove"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {positions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-8 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Zap size={36} className="text-slate-200 dark:text-slate-800" />
                                        <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">No staking positions</p>
                                        <button
                                            onClick={() => openModal()}
                                            className="text-xs text-indigo-500 hover:text-indigo-600 font-bold"
                                        >
                                            + Add your first position
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </TableShell>

            {showModal && (
                <AddStakingModal
                    assets={assets}
                    onAdd={addPosition}
                    onClose={() => setShowModal(false)}
                    syncing={syncing}
                    prefillSymbol={prefillSymbol}
                />
            )}
        </>
    );
};
