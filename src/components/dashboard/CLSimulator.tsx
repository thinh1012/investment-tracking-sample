import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, TrendingUp, TrendingDown, Info, HelpCircle } from 'lucide-react';
import { calculateRequiredAmounts, projectPositionValue, calculateIL, getPriceForTargetSplit } from '../../utils/clMath';

interface Props {
    initialBaseSymbol?: string;
    initialPrice?: number;
    locale?: string;
}

export const CLSimulator: React.FC<Props> = ({ initialBaseSymbol = 'ETH', initialPrice = 3200, locale = 'en-US' }) => {
    // Inputs
    const [tokenA, setTokenA] = useState(initialBaseSymbol);
    const [tokenB, setTokenB] = useState('USDC');
    const [depositValue, setDepositValue] = useState(1000);
    const [entryPrice, setEntryPrice] = useState(initialPrice);
    const [rangeMin, setRangeMin] = useState(initialPrice * 0.9);
    const [rangeMax, setRangeMax] = useState(initialPrice * 1.4);
    const [feeApr, setFeeApr] = useState(20);
    const [duration, setDuration] = useState(30); // in days
    const [targetPrice, setTargetPrice] = useState(initialPrice * 1.1);

    // Sync with initial props if they change
    useEffect(() => {
        if (initialBaseSymbol) setTokenA(initialBaseSymbol);
        if (initialPrice) {
            setEntryPrice(initialPrice);
            setTargetPrice(initialPrice * 1.1);
            setRangeMin(initialPrice * 0.9);
            setRangeMax(initialPrice * 1.4);
        }
    }, [initialBaseSymbol, initialPrice]);

    // Calculations
    const results = useMemo(() => {
        if (entryPrice <= 0 || rangeMin <= 0 || rangeMax <= 0 || rangeMin >= rangeMax) {
            return null;
        }

        const initial = calculateRequiredAmounts(entryPrice, rangeMin, rangeMax, depositValue);
        const projection = calculateIL(entryPrice, targetPrice, rangeMin, rangeMax, depositValue);

        // Fee Projection based on Duration
        const dailyRate = (feeApr / 100) / 365;
        const totalFees = projection.lpValue * dailyRate * duration;
        const netPnl = projection.ilUsdc + totalFees;

        return {
            initial,
            projection,
            estimatedFees: totalFees,
            netPnl,
            targetChange: ((targetPrice / entryPrice) - 1) * 100
        };
    }, [entryPrice, rangeMin, rangeMax, depositValue, targetPrice, feeApr, duration]);

    if (!results) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Calculator className="text-purple-500" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">CL Simulator (V3)</h2>
                    <p className="text-sm text-slate-500">Project IL and performance for concentrated liquidity pools</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* Left Column: Inputs */}
                <div className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-emerald-500">
                        <TrendingUp size={18} />
                        <h3 className="font-semibold uppercase tracking-wider text-xs">Concentrated Liquidity Inputs</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Token A (Base)</label>
                            <input
                                value={tokenA}
                                onChange={(e) => setTokenA(e.target.value.toUpperCase())}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Token B (Quote)</label>
                            <input
                                value={tokenB}
                                onChange={(e) => setTokenB(e.target.value.toUpperCase())}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Deposit Value ({tokenB})</label>
                            <input
                                type="number"
                                value={depositValue}
                                onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Entry Price ({tokenB})</label>
                            <input
                                type="number"
                                value={entryPrice}
                                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none text-right"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Price Range ({tokenB} per {tokenA})</label>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                value={rangeMin}
                                onChange={(e) => setRangeMin(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="Low"
                            />
                            <input
                                type="number"
                                value={rangeMax}
                                onChange={(e) => setRangeMax(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="High"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Required Deposit Split (Drag to adjust)</label>
                            <div className="flex gap-4 text-[11px]">
                                <span className="text-emerald-500 font-bold">{results.initial.split0.toFixed(0)}% {tokenA}</span>
                                <span className="text-emerald-500 font-bold">{results.initial.split1.toFixed(0)}% {tokenB}</span>
                            </div>
                        </div>

                        <div className="relative pt-2 pb-6">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={results.initial.split0}
                                onChange={(e) => {
                                    const newSplit0 = parseFloat(e.target.value);
                                    const newPrice = getPriceForTargetSplit(newSplit0, rangeMin, rangeMax);
                                    setEntryPrice(newPrice);
                                }}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-500 relative z-10"
                            />
                            <div className="absolute top-2 w-full h-2 rounded-full overflow-hidden flex pointer-events-none -z-0">
                                <div className="h-full bg-emerald-500/30" style={{ width: `${results.initial.split0}%` }} />
                                <div className="h-full bg-emerald-700/30" style={{ width: `${results.initial.split1}%` }} />
                            </div>
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>{results.initial.amount0.toFixed(4)} {tokenA}</span>
                            <span>{results.initial.amount1.toFixed(2)} {tokenB}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Estimated Fee APR (%)</label>
                        <input
                            type="number"
                            value={feeApr}
                            onChange={(e) => setFeeApr(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Time in Pool: <span className="text-emerald-500 ml-1">{duration >= 365 ? `${(duration / 365).toFixed(1)} years` : `${duration} days`}</span></label>
                            <span className="text-[10px] font-bold text-emerald-500/60 uppercase">
                                {duration >= 365 ? 'Multi-Year View' : duration >= 30 ? 'Monthly View' : 'Daily View'}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={1825}
                            step={1}
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    <div className="space-y-4 py-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Target Price: <span className="text-purple-500 ml-1">{targetPrice.toLocaleString(locale, { maximumFractionDigits: 2 })} {tokenB}</span></label>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${results.targetChange >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {results.targetChange >= 0 ? '+' : ''}{results.targetChange.toFixed(2)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={rangeMin * 0.5}
                            max={rangeMax * 1.5}
                            step={1}
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>

                {/* Right Column: Metrics */}
                <div className="space-y-6">
                    {/* Held Value */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Value (Held)</label>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold font-mono">${results.projection.heldValue.toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase">{tokenB}</span>
                            <span className={`ml-2 text-sm font-bold ${results.targetChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                ({results.targetChange >= 0 ? '+' : ''}{results.targetChange.toFixed(2)}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono">
                            {results.initial.amount0.toFixed(4)} {tokenA} + {results.initial.amount1.toFixed(2)} {tokenB}
                        </p>
                    </div>

                    {/* LP Value */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estimated Value (In LP)</label>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold font-mono text-purple-500">${results.projection.lpValue.toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
                            <span className="text-sm font-bold text-slate-400 uppercase">{tokenB}</span>
                            <span className={`ml-2 text-sm font-bold ${results.projection.lpValue >= depositValue ? 'text-emerald-500' : 'text-rose-500'}`}>
                                ({((results.projection.lpValue / depositValue - 1) * 100).toFixed(2)}%)
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-mono">
                            {projectPositionValue(targetPrice, rangeMin, rangeMax, results.initial.liquidity).amount0.toFixed(4)} {tokenA} + {projectPositionValue(targetPrice, rangeMin, rangeMax, results.initial.liquidity).amount1.toFixed(2)} {tokenB}
                        </p>
                    </div>

                    {/* IL Box */}
                    <div className="bg-rose-500/5 dark:bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20">
                        <div className="flex justify-between items-start">
                            <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Impermanent Loss</label>
                            <span className="text-sm font-bold text-rose-500">{results.projection.ilPercentage.toFixed(2)}%</span>
                        </div>
                        <div className="mt-2">
                            <span className="text-2xl font-bold font-mono text-rose-500">-${Math.abs(results.projection.ilUsdc).toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
                            <span className="text-xs font-bold text-rose-500/60 uppercase ml-1">{tokenB}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-rose-500/70 italic group relative cursor-help">
                            <Info size={10} />
                            <span>Divergence from holding. Concentrated liquidity magnifies IL risk.</span>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-[10px] rounded-xl shadow-2xl z-50 normal-case not-italic font-normal border border-slate-700 dark:border-slate-600 animate-in fade-in slide-in-from-bottom-1">
                                <p className="font-bold mb-1 text-rose-400">Why does it magnify risk?</p>
                                Concentrated Liquidity acts like leverage. Because your capital is "efficiently" deployed in a narrow range, price movement outside that range affects your portfolio value more drastically than in standard (0 to ∞) pools.
                            </div>
                        </div>
                    </div>

                    {/* Projections Sidebar */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20">
                            <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Estimated Fees ({duration}d)</label>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-xl font-bold font-mono text-emerald-500">+${results.estimatedFees.toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
                                <span className="text-[10px] font-bold text-emerald-500/60 uppercase">{tokenB}</span>
                            </div>
                        </div>
                        <div className={`p-5 rounded-2xl border ${results.netPnl >= 0 ? 'bg-purple-500/5 border-purple-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                            <label className={`text-[10px] font-bold uppercase tracking-wider ${results.netPnl >= 0 ? 'text-purple-500' : 'text-rose-500'}`}>Net PnL (IL + Fees)</label>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className={`text-xl font-bold font-mono ${results.netPnl >= 0 ? 'text-purple-500' : 'text-rose-500'}`}>
                                    {results.netPnl >= 0 ? '+' : '-'}${Math.abs(results.netPnl).toLocaleString(locale, { maximumFractionDigits: 2 })}
                                </span>
                                <span className={`text-[10px] font-bold uppercase ${results.netPnl >= 0 ? 'text-purple-500/60' : 'text-rose-500/60'}`}>{tokenB}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
