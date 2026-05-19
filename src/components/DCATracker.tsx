import React, { useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';

const DCA_STATE_KEY = 'hype_dca_tranches';

type TrancheId = 'a' | 'b' | 'c';
type TrancheStatus = 'pending' | 'filled';

interface TrancheState {
    status: TrancheStatus;
    filledAt?: string;
}

interface DCAState {
    a: TrancheState;
    b: TrancheState;
    c: TrancheState;
}

const DEFAULT_STATE: DCAState = {
    a: { status: 'pending' },
    b: { status: 'pending' },
    c: { status: 'pending' },
};

const TRANCHES = [
    {
        id: 'a' as TrancheId,
        label: 'Tranche A',
        pct: 30,
        min: 42,
        max: 45,
        note: 'Deploy after June 7 unlock checkpoint. If 60+ days pass unfilled, buy 50% at market.',
    },
    {
        id: 'b' as TrancheId,
        label: 'Tranche B',
        pct: 40,
        min: 36,
        max: 40,
        note: 'Set-and-forget limit order. Meaningful correction.',
    },
    {
        id: 'c' as TrancheId,
        label: 'Tranche C',
        pct: 30,
        min: 28,
        max: 33,
        note: 'Deep macro drawdown. Set-and-forget limit order.',
    },
];

const KEY_NOTES = [
    {
        label: 'Target Exit',
        text: 'Exit ladder starting at $150. Entry ~$25–26. Current LPs: HYPE/USDC on HyperSwap and PRJX.',
    },
    {
        label: 'Jun 6 — Monthly Unlock',
        text: '9.92M HYPE (~$449M) unlocks to core contributors. Historical: 85%+ went to staking across all 4 unlock events. Buyback program provides structural floor from trading fee revenue.',
    },
    {
        label: 'Jun 7 — Tranche A Checkpoint',
        text: 'Observe post-unlock behavior before deploying. If 60+ days pass with Tranche A unfilled, buy 50% at market.',
    },
    {
        label: 'Invalidation',
        text: 'HYPE loses $24 support → pause all deployment. Core team on-chain selling at scale → exit signal, not buy signal.',
    },
    {
        label: 'Rule',
        text: 'No fixed price anchoring. $38 target was missed — do not repeat. Tranches B and C are set-and-forget limit orders.',
    },
];

function getPriceStatus(price: number, min: number, max: number): 'in-zone' | 'above' | 'below' {
    if (price >= min && price <= max) return 'in-zone';
    if (price > max) return 'above';
    return 'below';
}

function getPriceDistance(price: number, min: number, max: number): string {
    if (price >= min && price <= max) return 'IN ZONE';
    if (price > max) {
        const pct = (((price - max) / max) * 100).toFixed(1);
        return `+${pct}% above`;
    }
    const pct = (((min - price) / price) * 100).toFixed(1);
    return `-${pct}% below`;
}

interface DCATrackerProps {
    prices: Record<string, number>;
    priceChanges: Record<string, number | null>;
}

export const DCATracker: React.FC<DCATrackerProps> = ({ prices, priceChanges }) => {
    const [state, setState] = useState<DCAState>(() => {
        try {
            const stored = localStorage.getItem(DCA_STATE_KEY);
            return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : DEFAULT_STATE;
        } catch {
            return DEFAULT_STATE;
        }
    });

    const hypePrice = prices['HYPE'];
    const hypeChange = priceChanges['HYPE'];
    const filledCount = Object.values(state).filter(t => t.status === 'filled').length;

    const markFilled = useCallback((id: TrancheId) => {
        setState(prev => {
            const next = {
                ...prev,
                [id]: { status: 'filled' as TrancheStatus, filledAt: new Date().toISOString().split('T')[0] },
            };
            localStorage.setItem(DCA_STATE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const markPending = useCallback((id: TrancheId) => {
        setState(prev => {
            const next = { ...prev, [id]: { status: 'pending' as TrancheStatus } };
            localStorage.setItem(DCA_STATE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">HYPE DCA Plan</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {filledCount === 0
                            ? 'No tranches filled'
                            : filledCount === 3
                            ? 'All tranches filled'
                            : `${filledCount} of 3 tranches filled`}
                    </p>
                </div>
                <div className="text-right">
                    {hypePrice != null ? (
                        <>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                ${hypePrice.toFixed(2)}
                            </div>
                            {hypeChange != null && (
                                <div className={`text-sm font-medium ${hypeChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {hypeChange >= 0 ? '+' : ''}{hypeChange.toFixed(2)}% 24h
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-2xl font-bold text-slate-400">—</div>
                    )}
                    <div className="text-xs text-slate-400 mt-0.5">HYPE/USD · 15 min</div>
                </div>
            </div>

            <div className="space-y-3">
                {TRANCHES.map(tranche => {
                    const trancheState = state[tranche.id];
                    const isFilled = trancheState.status === 'filled';
                    const priceStatus = hypePrice != null ? getPriceStatus(hypePrice, tranche.min, tranche.max) : null;
                    const distance = hypePrice != null ? getPriceDistance(hypePrice, tranche.min, tranche.max) : null;
                    const isInZone = priceStatus === 'in-zone' && !isFilled;

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
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {tranche.label}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                            {tranche.pct}%
                                        </span>
                                        {!isFilled && distance && (
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
                                                Filled {trancheState.filledAt}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                        ${tranche.min} – ${tranche.max}
                                    </div>
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {tranche.note}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0 pt-0.5">
                                    {isFilled ? (
                                        <>
                                            <CheckCircle2 size={20} className="text-slate-400" />
                                            <button
                                                onClick={() => markPending(tranche.id)}
                                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                                            >
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
                        </div>
                    );
                })}
            </div>

            <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Key Notes
                </h3>
                <div className="space-y-2">
                    {KEY_NOTES.map((note, i) => (
                        <div
                            key={i}
                            className="rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3"
                        >
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                {note.label}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {note.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
