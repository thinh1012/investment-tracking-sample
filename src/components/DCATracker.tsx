import React, { useState, useCallback } from 'react';
import { CheckCircle2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

const PLANS_KEY = 'dca_plans_v2';

interface TrancheConfig {
    id: string;
    label: string;
    pct: number;
    min: number;
    max: number;
    note: string;
    status: 'pending' | 'filled';
    filledAt?: string;
}

interface DCANote {
    id: string;
    label: string;
    text: string;
}

interface DCAPlan {
    id: string;
    symbol: string;
    targetPrice: string;
    budget: string;
    accumulateTarget: string;
    tranches: TrancheConfig[];
    notes: DCANote[];
}

const DEFAULT_PLAN: DCAPlan = {
    id: 'hype-default',
    symbol: 'HYPE',
    targetPrice: '150',
    budget: '',
    accumulateTarget: '',
    tranches: [
        { id: 'a', label: 'Tranche A', pct: 30, min: 42, max: 45, note: 'Deploy after June 7 unlock checkpoint. If 60+ days pass unfilled, buy 50% at market.', status: 'pending' },
        { id: 'b', label: 'Tranche B', pct: 40, min: 36, max: 40, note: 'Set-and-forget limit order. Meaningful correction.', status: 'pending' },
        { id: 'c', label: 'Tranche C', pct: 30, min: 28, max: 33, note: 'Deep macro drawdown. Set-and-forget limit order.', status: 'pending' },
    ],
    notes: [
        { id: '1', label: 'Target Exit', text: 'Exit ladder starting at $150. Entry ~$25–26.' },
        { id: '2', label: 'Jun 6 — Monthly Unlock', text: '9.92M HYPE (~$449M) unlocks to core contributors. Historical: 85%+ went to staking. No significant dumps across 4 unlock events.' },
        { id: '3', label: 'Jun 7 — Tranche A Checkpoint', text: 'Observe post-unlock behavior before deploying.' },
        { id: '4', label: 'Invalidation', text: 'HYPE loses $24 support → pause all deployment. Core team on-chain selling at scale → exit signal.' },
        { id: '5', label: 'Rule', text: 'No fixed price anchoring. $38 target was missed — do not repeat.' },
    ],
};

function makePlan(): DCAPlan {
    return {
        id: Date.now().toString(),
        symbol: '',
        targetPrice: '',
        budget: '',
        accumulateTarget: '',
        tranches: [
            { id: 'a', label: 'Tranche A', pct: 30, min: 0, max: 0, note: '', status: 'pending' },
            { id: 'b', label: 'Tranche B', pct: 40, min: 0, max: 0, note: '', status: 'pending' },
            { id: 'c', label: 'Tranche C', pct: 30, min: 0, max: 0, note: '', status: 'pending' },
        ],
        notes: [],
    };
}

function loadPlans(): DCAPlan[] {
    try {
        const stored = localStorage.getItem(PLANS_KEY);
        if (stored) return JSON.parse(stored);

        // Migrate from old single-plan storage
        const plan: DCAPlan = JSON.parse(JSON.stringify(DEFAULT_PLAN));
        const oldState = JSON.parse(localStorage.getItem('hype_dca_tranches') || 'null');
        const oldNotes = JSON.parse(localStorage.getItem('hype_dca_notes') || 'null');
        const oldBudget = localStorage.getItem('hype_dca_budget') || '';
        if (oldBudget) plan.budget = oldBudget;
        if (oldState) plan.tranches = plan.tranches.map(t => ({ ...t, status: oldState[t.id]?.status ?? 'pending', filledAt: oldState[t.id]?.filledAt }));
        if (oldNotes) plan.notes = oldNotes;
        return [plan];
    } catch {
        return [JSON.parse(JSON.stringify(DEFAULT_PLAN))];
    }
}

function savePlans(plans: DCAPlan[]) {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

function getPriceStatus(price: number, min: number, max: number): 'in-zone' | 'above' | 'below' | 'unset' {
    if (min === 0 && max === 0) return 'unset';
    if (price >= min && price <= max) return 'in-zone';
    if (price > max) return 'above';
    return 'below';
}

function getPriceDistance(price: number, min: number, max: number): string {
    if (min === 0 && max === 0) return '—';
    if (price >= min && price <= max) return 'IN ZONE';
    if (price > max) return `+${(((price - max) / max) * 100).toFixed(1)}% above`;
    return `-${(((min - price) / price) * 100).toFixed(1)}% below`;
}

interface DCATrackerProps {
    prices: Record<string, number>;
    priceChanges: Record<string, number | null>;
}

export const DCATracker: React.FC<DCATrackerProps> = ({ prices, priceChanges }) => {
    const [plans, setPlans] = useState<DCAPlan[]>(loadPlans);
    const [activePlanId, setActivePlanId] = useState<string>(() => loadPlans()[0]?.id ?? '');

    const [editingTrancheId, setEditingTrancheId] = useState<string | null>(null);
    const [trancheDraft, setTrancheDraft] = useState<{ label: string; pct: string; min: string; max: string; note: string }>({ label: '', pct: '', min: '', max: '', note: '' });

    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState<{ label: string; text: string }>({ label: '', text: '' });

    const activePlan = plans.find(p => p.id === activePlanId) ?? plans[0];
    const sym = activePlan?.symbol?.toUpperCase() ?? '';
    const currentPrice = sym ? prices[sym] : undefined;
    const currentChange = sym ? priceChanges[sym] : undefined;
    const targetNum = parseFloat(activePlan?.targetPrice ?? '') || null;
    const budgetNum = parseFloat(activePlan?.budget ?? '') || 0;
    const accumulateTargetNum = parseFloat(activePlan?.accumulateTarget ?? '') || null;
    const filledCount = activePlan?.tranches.filter(t => t.status === 'filled').length ?? 0;
    const upside = currentPrice && targetNum ? (((targetNum - currentPrice) / currentPrice) * 100).toFixed(0) : null;

    const trancheTokens = (t: TrancheConfig) => {
        const mid = t.min && t.max ? (t.min + t.max) / 2 : null;
        const alloc = budgetNum * (t.pct / 100);
        return mid && alloc > 0 ? alloc / mid : null;
    };
    const planTotalTokens = activePlan?.tranches.reduce((sum, t) => sum + (trancheTokens(t) ?? 0), 0) ?? 0;
    const filledTokens = activePlan?.tranches.filter(t => t.status === 'filled').reduce((sum, t) => sum + (trancheTokens(t) ?? 0), 0) ?? 0;
    const accumulateProgress = accumulateTargetNum && accumulateTargetNum > 0 ? Math.min(filledTokens / accumulateTargetNum, 1) : null;

    const updatePlan = useCallback((id: string, updates: Partial<DCAPlan>) => {
        setPlans(prev => {
            const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
            savePlans(next);
            return next;
        });
    }, []);

    const addPlan = () => {
        const plan = makePlan();
        setPlans(prev => { const next = [...prev, plan]; savePlans(next); return next; });
        setActivePlanId(plan.id);
    };

    const deletePlan = (id: string) => {
        if (plans.length === 1) return;
        setPlans(prev => {
            const next = prev.filter(p => p.id !== id);
            savePlans(next);
            return next;
        });
        if (activePlanId === id) setActivePlanId(plans.find(p => p.id !== id)!.id);
    };

    const markFilled = (trancheId: string) => {
        updatePlan(activePlan.id, {
            tranches: activePlan.tranches.map(t =>
                t.id === trancheId ? { ...t, status: 'filled', filledAt: new Date().toISOString().split('T')[0] } : t
            ),
        });
    };

    const markPending = (trancheId: string) => {
        updatePlan(activePlan.id, {
            tranches: activePlan.tranches.map(t =>
                t.id === trancheId ? { ...t, status: 'pending', filledAt: undefined } : t
            ),
        });
    };

    const startEditTranche = (t: TrancheConfig) => {
        setEditingTrancheId(t.id);
        setTrancheDraft({ label: t.label, pct: String(t.pct), min: t.min ? String(t.min) : '', max: t.max ? String(t.max) : '', note: t.note });
    };

    const confirmEditTranche = () => {
        if (!editingTrancheId) return;
        updatePlan(activePlan.id, {
            tranches: activePlan.tranches.map(t =>
                t.id === editingTrancheId ? {
                    ...t,
                    label: trancheDraft.label || t.label,
                    pct: parseFloat(trancheDraft.pct) || t.pct,
                    min: parseFloat(trancheDraft.min) || 0,
                    max: parseFloat(trancheDraft.max) || 0,
                    note: trancheDraft.note,
                } : t
            ),
        });
        setEditingTrancheId(null);
    };

    const startEditNote = (n: DCANote) => {
        setEditingNoteId(n.id);
        setNoteDraft({ label: n.label, text: n.text });
    };

    const confirmEditNote = () => {
        if (!editingNoteId) return;
        updatePlan(activePlan.id, { notes: activePlan.notes.map(n => n.id === editingNoteId ? { ...n, ...noteDraft } : n) });
        setEditingNoteId(null);
    };

    const deleteNote = (id: string) => {
        updatePlan(activePlan.id, { notes: activePlan.notes.filter(n => n.id !== id) });
    };

    const addNote = () => {
        const note: DCANote = { id: Date.now().toString(), label: 'New note', text: '' };
        const notes = [...activePlan.notes, note];
        updatePlan(activePlan.id, { notes });
        setEditingNoteId(note.id);
        setNoteDraft({ label: note.label, text: note.text });
    };

    if (!activePlan) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-5">

            {/* Plan tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
                {plans.map(plan => (
                    <button
                        key={plan.id}
                        onClick={() => setActivePlanId(plan.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            activePlanId === plan.id
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {plan.symbol || 'New Plan'}
                    </button>
                ))}
                <button
                    onClick={addPlan}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Plan header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <input
                            value={activePlan.symbol}
                            onChange={e => updatePlan(activePlan.id, { symbol: e.target.value.toUpperCase() })}
                            placeholder="SYMBOL"
                            className="text-xl font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 outline-none w-28 uppercase"
                        />
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <span>Target</span>
                            <span className="text-slate-400">$</span>
                            <input
                                type="number"
                                value={activePlan.targetPrice}
                                onChange={e => updatePlan(activePlan.id, { targetPrice: e.target.value })}
                                placeholder="0"
                                className="w-20 bg-transparent font-semibold text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 outline-none"
                            />
                            {upside && (
                                <span className={`text-xs font-semibold ${Number(upside) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    ({upside}%)
                                </span>
                            )}
                        </div>
                    </div>
                    {accumulateTargetNum ? (
                        <div className="space-y-1">
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">{filledTokens > 0 ? filledTokens.toFixed(2) : '0'}</span>
                                <span> / {accumulateTargetNum} {sym || 'tokens'} accumulated</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                    style={{ width: `${(accumulateProgress ?? 0) * 100}%` }}
                                />
                            </div>
                            {planTotalTokens > 0 && (
                                <div className="text-xs text-slate-400">
                                    Plan yields ~{planTotalTokens.toFixed(2)} {sym} total
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            {filledCount === 0 ? 'No tranches filled' : filledCount === 3 ? 'All tranches filled' : `${filledCount} of 3 filled`}
                        </p>
                    )}
                </div>
                <div className="text-right shrink-0">
                    {currentPrice != null ? (
                        <>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">${currentPrice.toFixed(2)}</div>
                            {currentChange != null && (
                                <div className={`text-sm font-medium ${currentChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {currentChange >= 0 ? '+' : ''}{currentChange.toFixed(2)}% 24h
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-2xl font-bold text-slate-400">{sym ? '—' : '—'}</div>
                    )}
                    <div className="text-xs text-slate-400 mt-0.5">{sym || '—'}/USD · 15 min</div>
                </div>
            </div>

            {/* Budget + Accumulate target */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">Total budget</span>
                <div className="flex items-center gap-1 flex-1">
                    <span className="text-sm font-medium text-slate-400">$</span>
                    <input
                        type="number"
                        value={activePlan.budget}
                        onChange={e => updatePlan(activePlan.id, { budget: e.target.value })}
                        placeholder="0"
                        className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 outline-none min-w-0"
                    />
                    <span className="text-sm text-slate-400 shrink-0">USDC</span>
                </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">Accumulate</span>
                    <div className="flex items-center gap-1 flex-1">
                        <input
                            type="number"
                            value={activePlan.accumulateTarget}
                            onChange={e => updatePlan(activePlan.id, { accumulateTarget: e.target.value })}
                            placeholder="0"
                            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 outline-none min-w-0"
                        />
                        <span className="text-sm text-slate-400 shrink-0">{sym || 'tokens'}</span>
                    </div>
                </div>
            </div>

            {/* Tranches */}
            <div className="space-y-3">
                {activePlan.tranches.map(tranche => {
                    const isFilled = tranche.status === 'filled';
                    const priceStatus = currentPrice != null ? getPriceStatus(currentPrice, tranche.min, tranche.max) : null;
                    const distance = currentPrice != null ? getPriceDistance(currentPrice, tranche.min, tranche.max) : null;
                    const isInZone = priceStatus === 'in-zone' && !isFilled;
                    const midpoint = tranche.min && tranche.max ? (tranche.min + tranche.max) / 2 : null;
                    const allocation = budgetNum * (tranche.pct / 100);
                    const tokenTarget = allocation > 0 && midpoint ? allocation / midpoint : null;

                    return (
                        <div
                            key={tranche.id}
                            className={`rounded-xl border p-4 transition-all ${
                                isFilled
                                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 opacity-60'
                                    : isInZone
                                    ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-400/50'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                            }`}
                        >
                            {editingTrancheId === tranche.id ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Label</label>
                                            <input
                                                autoFocus
                                                value={trancheDraft.label}
                                                onChange={e => setTrancheDraft(d => ({ ...d, label: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none text-slate-800 dark:text-slate-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Allocation %</label>
                                            <input
                                                type="number"
                                                value={trancheDraft.pct}
                                                onChange={e => setTrancheDraft(d => ({ ...d, pct: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none text-slate-800 dark:text-slate-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Zone min ($)</label>
                                            <input
                                                type="number"
                                                value={trancheDraft.min}
                                                onChange={e => setTrancheDraft(d => ({ ...d, min: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none text-slate-800 dark:text-slate-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Zone max ($)</label>
                                            <input
                                                type="number"
                                                value={trancheDraft.max}
                                                onChange={e => setTrancheDraft(d => ({ ...d, max: e.target.value }))}
                                                className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none text-slate-800 dark:text-slate-200"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Note</label>
                                        <textarea
                                            value={trancheDraft.note}
                                            onChange={e => setTrancheDraft(d => ({ ...d, note: e.target.value }))}
                                            rows={2}
                                            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none text-slate-600 dark:text-slate-400 resize-none leading-relaxed"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingTrancheId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1">
                                            <X size={12} /> Cancel
                                        </button>
                                        <button onClick={confirmEditTranche} className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg">
                                            <Check size={12} /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{tranche.label}</span>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                {tranche.pct}%
                                            </span>
                                            {!isFilled && distance && priceStatus !== 'unset' && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    priceStatus === 'in-zone'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                        : priceStatus === 'above'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    {distance}
                                                </span>
                                            )}
                                            {isFilled && (
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                                    Filled {tranche.filledAt}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                            {tranche.min || tranche.max ? `$${tranche.min} – $${tranche.max}` : <span className="text-slate-300 dark:text-slate-600 text-lg">Set zone</span>}
                                        </div>
                                        {tokenTarget != null && (
                                            <div className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                ~{tokenTarget.toFixed(2)} {sym || 'tokens'}
                                                <span className="text-xs font-normal text-slate-400 ml-1">(${allocation.toFixed(0)} @ ${midpoint?.toFixed(2)} mid)</span>
                                            </div>
                                        )}
                                        {!tokenTarget && budgetNum > 0 && (
                                            <div className="mt-1 text-xs text-slate-400">Set zone to calculate token target</div>
                                        )}
                                        {!tokenTarget && !budgetNum && (
                                            <div className="mt-1 text-xs text-slate-400">Enter budget to see token target</div>
                                        )}
                                        {tranche.note && (
                                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tranche.note}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                                        <button onClick={() => startEditTranche(tranche)} className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
                                            <Pencil size={13} />
                                        </button>
                                        {isFilled ? (
                                            <>
                                                <CheckCircle2 size={20} className="text-slate-400" />
                                                <button onClick={() => markPending(tranche.id)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline">
                                                    Undo
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => markFilled(tranche.id)}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                                                    isInZone
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                Mark Filled
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Notes */}
            <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Key Notes</h3>
                <div className="space-y-2">
                    {activePlan.notes.map(note => (
                        <div key={note.id} className="rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3">
                            {editingNoteId === note.id ? (
                                <div className="space-y-2">
                                    <input
                                        autoFocus
                                        value={noteDraft.label}
                                        onChange={e => setNoteDraft(d => ({ ...d, label: e.target.value }))}
                                        className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1 outline-none text-slate-800 dark:text-slate-200"
                                        placeholder="Label"
                                    />
                                    <textarea
                                        value={noteDraft.text}
                                        onChange={e => setNoteDraft(d => ({ ...d, text: e.target.value }))}
                                        rows={3}
                                        className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm px-2 py-1 outline-none text-slate-600 dark:text-slate-400 resize-none leading-relaxed"
                                        placeholder="Note content"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingNoteId(null)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-1">
                                            <X size={12} /> Cancel
                                        </button>
                                        <button onClick={confirmEditNote} className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg">
                                            <Check size={12} /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 group">
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{note.label}</div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{note.text}</p>
                                    </div>
                                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditNote(note)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                            <Pencil size={13} />
                                        </button>
                                        <button onClick={() => deleteNote(note.id)} className="p-1 text-slate-400 hover:text-rose-500">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addNote}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                    >
                        <Plus size={13} /> Add note
                    </button>
                </div>
            </div>

            {/* Delete plan */}
            {plans.length > 1 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => deletePlan(activePlan.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 transition-colors"
                    >
                        <Trash2 size={13} /> Delete this plan
                    </button>
                </div>
            )}
        </div>
    );
};
