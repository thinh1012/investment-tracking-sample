import React from 'react';
import { LpToken } from './types';
import { Asset } from '../../types';

interface LPSplitFieldsProps {
    lpMode: 'TOTAL' | 'SPLIT';
    lpTokenA: LpToken;
    setLpTokenA: (t: LpToken) => void;
    lpTokenB: LpToken;
    setLpTokenB: (t: LpToken) => void;
    lpTokenASource: 'FRESH' | 'HOLDINGS';
    setLpTokenASource: (s: 'FRESH' | 'HOLDINGS') => void;
    lpTokenBSource: 'FRESH' | 'HOLDINGS';
    setLpTokenBSource: (s: 'FRESH' | 'HOLDINGS') => void;
    fundingSourceA: string;
    setFundingSourceA: (s: string) => void;
    fundingSourceB: string;
    setFundingSourceB: (s: string) => void;
    assets: Asset[];
    lpRangeMin: string;
    setLpRangeMin: (v: string) => void;
    lpRangeMax: string;
    setLpRangeMax: (v: string) => void;
    monitorSymbol: string;
    setMonitorSymbol: (v: string) => void;
}

export const LPSplitFields: React.FC<LPSplitFieldsProps> = (props) => {
    const {
        lpMode, lpTokenA, setLpTokenA, lpTokenB, setLpTokenB,
        lpTokenASource, setLpTokenASource, lpTokenBSource, setLpTokenBSource,
        fundingSourceA, setFundingSourceA, fundingSourceB, setFundingSourceB,
        assets, lpRangeMin, setLpRangeMin, lpRangeMax, setLpRangeMax,
        monitorSymbol, setMonitorSymbol
    } = props;

    if (lpMode !== 'SPLIT') {
        return (
            <div className="md:col-span-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Principal Source</label>
                        <button
                            type="button"
                            onClick={() => setLpTokenASource(lpTokenASource === 'FRESH' ? 'HOLDINGS' : 'FRESH')}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all ${lpTokenASource === 'HOLDINGS' ? 'bg-indigo-500 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}
                        >
                            {lpTokenASource}
                        </button>
                    </div>

                    {lpTokenASource === 'HOLDINGS' ? (
                        <div className="space-y-3">
                            <select
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 text-sm font-bold px-4 py-3 uppercase bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 transition-all"
                                value={fundingSourceA}
                                onChange={(e) => {
                                    const s = e.target.value;
                                    setFundingSourceA(s);
                                    setLpTokenA({ ...lpTokenA, symbol: s });
                                }}
                            >
                                <option value="">-- Select Asset --</option>
                                {assets.filter((a: Asset) => !a.lpRange).map((a: Asset) => (
                                    <option key={a.symbol} value={a.symbol}>{a.symbol} (Avail: {a.quantity.toFixed(4)})</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 italic px-1">This will subtract the value from your spot holdings.</p>
                        </div>
                    ) : (
                        <p className="text-[10px] text-slate-400 italic px-1">Using new capital for this position.</p>
                    )}
                </div>

                <RangeFields
                    lpRangeMin={lpRangeMin} setLpRangeMin={setLpRangeMin}
                    lpRangeMax={lpRangeMax} setLpRangeMax={setLpRangeMax}
                    monitorSymbol={monitorSymbol} setMonitorSymbol={setMonitorSymbol}
                />
            </div>
        );
    }

    return (
        <div className="md:col-span-2 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-4">
                <TokenInput
                    label="Token A"
                    token={lpTokenA} setToken={setLpTokenA}
                    source={lpTokenASource} setSource={setLpTokenASource}
                    fundingSource={fundingSourceA} setFundingSource={setFundingSourceA}
                    assets={assets}
                />
                <TokenInput
                    label="Token B"
                    token={lpTokenB} setToken={setLpTokenB}
                    source={lpTokenBSource} setSource={setLpTokenBSource}
                    fundingSource={fundingSourceB} setFundingSource={setFundingSourceB}
                    assets={assets}
                />
            </div>

            <RangeFields
                lpRangeMin={lpRangeMin} setLpRangeMin={setLpRangeMin}
                lpRangeMax={lpRangeMax} setLpRangeMax={setLpRangeMax}
                monitorSymbol={monitorSymbol} setMonitorSymbol={setMonitorSymbol}
            />
        </div>
    );
};

const TokenInput = ({ label, token, setToken, source, setSource, fundingSource, setFundingSource, assets }: any) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-500">{label}</label>
            <button
                type="button"
                onClick={() => setSource(source === 'FRESH' ? 'HOLDINGS' : 'FRESH')}
                className={`text-[10px] px-1.5 py-0.5 rounded border ${source === 'HOLDINGS' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
            >
                {source}
            </button>
        </div>
        <div className="space-y-2">
            {source === 'HOLDINGS' ? (
                <select
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 text-sm px-2 py-2 uppercase dark:bg-slate-800 dark:text-white"
                    value={fundingSource}
                    onChange={(e) => {
                        const s = e.target.value;
                        setFundingSource(s);
                        setToken({ ...token, symbol: s });
                    }}
                >
                    <option value="">-- Select Asset --</option>
                    {assets.filter((a: Asset) => !a.lpRange).map((a: Asset) => (
                        <option key={a.symbol} value={a.symbol}>{a.symbol} (Avail: {a.quantity.toFixed(4)})</option>
                    ))}
                </select>
            ) : (
                <input
                    placeholder="Sym"
                    className="w-full rounded-lg border-slate-200 dark:border-slate-700 text-sm px-2 py-2 uppercase dark:bg-slate-800 dark:text-white"
                    value={token.symbol}
                    onChange={e => setToken({ ...token, symbol: e.target.value })}
                />
            )}
            <input
                placeholder="Qty"
                type="number"
                step="any"
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 text-sm px-2 py-2 dark:bg-slate-800 dark:text-white"
                value={token.amount}
                onChange={e => setToken({ ...token, amount: e.target.value })}
            />
        </div>
    </div>
);

const RangeFields = ({ lpRangeMin, setLpRangeMin, lpRangeMax, setLpRangeMax, monitorSymbol, setMonitorSymbol }: any) => (
    <>
        <div className="animate-in fade-in slide-in-from-top-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">LP Price Range (Optional)</label>
            <div className="flex gap-2 items-center">
                <input
                    type="number"
                    step="any"
                    placeholder="Min Price"
                    className="w-1/2 rounded-lg border-slate-200 dark:border-slate-700 text-sm px-3 py-2 dark:bg-slate-800 dark:text-white"
                    value={lpRangeMin}
                    onChange={e => setLpRangeMin(e.target.value)}
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                    type="number"
                    step="any"
                    placeholder="Max Price"
                    className="w-1/2 rounded-lg border-slate-200 dark:border-slate-700 text-sm px-3 py-2 dark:bg-slate-800 dark:text-white"
                    value={lpRangeMax}
                    onChange={e => setLpRangeMax(e.target.value)}
                />
            </div>
        </div>
        <div className="animate-in fade-in slide-in-from-top-2 mt-2">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Monitor Asset (for Range Check)</label>
            <input
                type="text"
                placeholder="e.g. ETH"
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 text-sm px-3 py-2 uppercase dark:bg-slate-800 dark:text-white"
                value={monitorSymbol}
                onChange={e => setMonitorSymbol(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">If set, dashboard will alert if price is outside range.</p>
        </div>
    </>
);
