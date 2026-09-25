import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { Asset, Transaction } from '../../types';

const STABLES = ['USDT', 'USDC', 'USDG', 'USDT0', 'USDE', 'DAI', 'USDS', 'PYUSD', 'FDUSD', 'USDH'];

interface Row { symbol: string; qty: string; price: string; }

interface ClosePoolModalProps {
    pool: Asset;
    transactions: Transaction[];
    prices: Record<string, number>;
    onConfirm: (txs: Transaction[]) => void;
    onClose: () => void;
}

const priceFor = (sym: string, prices: Record<string, number>) => {
    const s = sym.trim().toUpperCase();
    if (STABLES.includes(s)) return 1;
    const p = prices[s === 'WETH' ? 'ETH' : s];
    return p && p !== 404 ? p : 0;
};

// "HYPE-USDC PRJX 4" -> ["HYPE", "USDC"]
const guessTokens = (poolSymbol: string) =>
    poolSymbol.split(' ')[0].split(/[-/]/).map(s => s.trim().toUpperCase()).filter(s => s && s !== 'LP');

const usd = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const ClosePoolModal: React.FC<ClosePoolModalProps> = ({ pool, transactions, prices, onConfirm, onClose }) => {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [rows, setRows] = useState<Row[]>(() => {
        const tokens = guessTokens(pool.symbol);
        return (tokens.length ? tokens : ['']).map(symbol => ({ symbol, qty: '', price: symbol ? String(priceFor(symbol, prices) || '') : '' }));
    });

    const principal = pool.totalInvested + (pool.compoundedPrincipal || 0);

    const feesValue = useMemo(() => transactions
        .filter(t => t.type === 'INTEREST' && (t.relatedAssetSymbol === pool.symbol || t.relatedAssetSymbols?.includes(pool.symbol)))
        .reduce((sum, t) => sum + t.amount * priceFor(t.assetSymbol, prices), 0), [transactions, pool.symbol, prices]);

    const validRows = rows.filter(r => r.symbol.trim() && parseFloat(r.qty) > 0 && parseFloat(r.price) > 0);
    const receivedValue = validRows.reduce((s, r) => s + parseFloat(r.qty) * parseFloat(r.price), 0);
    const priceResult = receivedValue - principal;
    const net = priceResult + feesValue;
    const incomplete = rows.some(r => (r.symbol.trim() || r.qty) && !validRows.includes(r));

    const updateRow = (i: number, patch: Partial<Row>) => setRows(rs => rs.map((r, j) => {
        if (j !== i) return r;
        const next = { ...r, ...patch };
        if (patch.symbol !== undefined) {
            const p = priceFor(patch.symbol, prices);
            next.price = p ? String(p) : '';
        }
        return next;
    }));

    const handleConfirm = () => {
        if (validRows.length === 0 || incomplete || !date) return;
        const closeId = crypto.randomUUID();
        const received = validRows.map(r => `${parseFloat(r.qty)} ${r.symbol.trim().toUpperCase()}`).join(' + ');
        const txs: Transaction[] = [
            {
                id: closeId,
                date,
                type: 'WITHDRAWAL',
                assetSymbol: pool.symbol,
                amount: pool.quantity,
                pricePerUnit: receivedValue / pool.quantity,
                subType: 'POOL_CLOSE',
                notes: `Pool Close: received ${received}`
            },
            ...validRows.map(r => ({
                id: crypto.randomUUID(),
                date,
                type: 'DEPOSIT' as const,
                assetSymbol: r.symbol.trim().toUpperCase(),
                amount: parseFloat(r.qty),
                pricePerUnit: parseFloat(r.price),
                subType: 'POOL_CLOSE' as const,
                linkedTransactionId: closeId,
                notes: `Received from closing ${pool.symbol}`
            }))
        ];
        onConfirm(txs);
    };

    const inputCls = 'w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-sm font-mono text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div className="text-xs text-slate-400">Close position</div>
                        <div className="font-black text-slate-800 dark:text-slate-100">{pool.symbol}</div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Cancel">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Close date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                    </div>

                    <div>
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-slate-500 mb-1">
                            <span>Token received</span><span>Quantity</span><span>Price (USD)</span><span className="w-6" />
                        </div>
                        <div className="space-y-2">
                            {rows.map((r, i) => (
                                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                                    <input value={r.symbol} onChange={e => updateRow(i, { symbol: e.target.value.toUpperCase() })} placeholder="USDC" className={inputCls} />
                                    <input type="number" inputMode="decimal" step="any" value={r.qty} onChange={e => updateRow(i, { qty: e.target.value })} placeholder="0" className={inputCls} />
                                    <input type="number" inputMode="decimal" step="any" value={r.price} onChange={e => updateRow(i, { price: e.target.value })} placeholder="0" className={inputCls} />
                                    <button onClick={() => setRows(rs => rs.filter((_, j) => j !== i))} disabled={rows.length === 1} className="w-6 text-slate-400 hover:text-rose-500 disabled:opacity-30" aria-label="Remove token">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setRows(rs => [...rs, { symbol: '', qty: '', price: '' }])} className="mt-2 flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600">
                            <Plus size={12} /> Add token
                        </button>
                        <p className="mt-2 text-xs text-slate-400">Enter only the withdrawn liquidity. Log uncollected fees separately as a reward so they count as earnings.</p>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {([
                            ['Principal', usd(principal)],
                            ['Received value', usd(receivedValue)],
                            ['Price / IL result', usd(priceResult), priceResult],
                            ['Fees earned (current prices)', usd(feesValue)],
                            ['Net P&L', `${usd(net)}${principal > 0 ? ` (${((net / principal) * 100).toFixed(1)}%)` : ''}`, net]
                        ] as [string, string, number?][]).map(([label, value, sign]) => (
                            <div key={label} className="flex justify-between px-3 py-2">
                                <span className={`text-slate-500 ${label === 'Net P&L' ? 'font-semibold text-slate-700 dark:text-slate-200' : ''}`}>{label}</span>
                                <span className={`font-mono ${sign === undefined ? 'text-slate-700 dark:text-slate-200' : sign >= 0 ? 'text-emerald-500' : 'text-rose-500'} ${label === 'Net P&L' ? 'font-semibold' : ''}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={validRows.length === 0 || incomplete || !date}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40"
                    >
                        Close position
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
