import React, { useState, useEffect } from 'react';
import { Pencil, Save, X, BookOpen, Calculator, TrendingUp } from 'lucide-react';

const STORAGE_KEY = 'dashboard_notes';

const DashboardNotes: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'NOTES' | 'SIMULATOR'>('NOTES');
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState('');

    // Simulator State (Concentrated Liquidity)
    const [simDeposit, setSimDeposit] = useState(1000);
    const [simTokenA, setSimTokenA] = useState('ETH');
    const [simTokenB, setSimTokenB] = useState('USDC');
    const [simEntryPrice, setSimEntryPrice] = useState(2000);
    const [simMinPrice, setSimMinPrice] = useState(1500);
    const [simMaxPrice, setSimMaxPrice] = useState(2500);
    const [simTargetPrice, setSimTargetPrice] = useState(2200);

    const [simFeeApr, setSimFeeApr] = useState(20);

    // Initial Split Calculation (V3)
    const calculateLiquidity = (amount: number, P: number, Pa: number, Pb: number) => {
        if (P <= Pa) {
            const x = amount / P;
            return x * (Math.sqrt(Pa) * Math.sqrt(Pb)) / (Math.sqrt(Pb) - Math.sqrt(Pa));
        } else if (P >= Pb) {
            return amount / (Math.sqrt(Pb) - Math.sqrt(Pa));
        } else {
            const term1 = Math.sqrt(P) - Math.sqrt(Pa);
            const term2 = (1 / Math.sqrt(P)) - (1 / Math.sqrt(Pb));
            const denominator = term1 + term2 * P;
            return amount / denominator;
        }
    };

    const getAmountsForLiquidity = (L: number, P: number, Pa: number, Pb: number) => {
        let x = 0;
        let y = 0;

        if (P <= Pa) {
            x = L * (1 / Math.sqrt(P) - 1 / Math.sqrt(Pb));
            y = 0;
        } else if (P >= Pb) {
            x = 0;
            y = L * (Math.sqrt(P) - Math.sqrt(Pa));
        } else {
            x = L * (1 / Math.sqrt(P) - 1 / Math.sqrt(Pb));
            y = L * (Math.sqrt(P) - Math.sqrt(Pa));
        }
        return { x, y };
    };

    // Helper: Get Split Ratio for a given price
    const getSplitRatio = (P: number, min: number, max: number) => {
        const L_temp = calculateLiquidity(1000, P, min, max); // Arbitrary amount
        const split = getAmountsForLiquidity(L_temp, P, min, max);
        const vA = split.x * P;
        const vB = split.y;
        const total = vA + vB;
        return total > 0 ? (vA / total) * 100 : 0;
    };

    // Helper: Find Price for a Target Split A% (Binary Search)
    const calculatePriceFromSplit = (targetRatioA: number, min: number, max: number) => {
        // Monotonic: P=Min -> Ratio=100%, P=Max -> Ratio=0%
        let low = min;
        let high = max;
        let iterations = 20; // Sufficient precision

        while (iterations > 0) {
            const mid = (low + high) / 2;
            const currentRatio = getSplitRatio(mid, min, max);

            if (Math.abs(currentRatio - targetRatioA) < 0.1) return mid;

            if (currentRatio > targetRatioA) {
                // To reduce Ratio A (hold less base), we need HIGHER price
                low = mid;
            } else {
                high = mid;
            }
            iterations--;
        }
        return (low + high) / 2;
    };

    // 1. Calculate Liquidity (L) derived from Initial Deposit at Entry Price
    const L = calculateLiquidity(simDeposit, simEntryPrice, simMinPrice, simMaxPrice);

    // 2. Initial Asset Amounts (Token X and Y) if we just HELD them from the start
    const initialSplit = getAmountsForLiquidity(L, simEntryPrice, simMinPrice, simMaxPrice);

    // Calculate Current Ratios for UI
    const ratioA = Math.round(getSplitRatio(simEntryPrice, simMinPrice, simMaxPrice));
    const ratioB = 100 - ratioA;

    const handleSplitChange = (newRatioA: number) => {
        // Clamp 0-100
        const clamped = Math.max(0, Math.min(100, newRatioA));
        // Calculate required price
        const newPrice = calculatePriceFromSplit(clamped, simMinPrice, simMaxPrice);
        setSimEntryPrice(Math.round(newPrice * 100) / 100);
    };

    // 3. New Asset Amounts in LP at Target Price
    const lpSplit = getAmountsForLiquidity(L, simTargetPrice, simMinPrice, simMaxPrice);

    // Values
    const holdValue = (initialSplit.x * simTargetPrice) + initialSplit.y;
    const lpValue = (lpSplit.x * simTargetPrice) + lpSplit.y;
    const ilAmount = lpValue - holdValue;
    const ilPercent = holdValue > 0 ? (ilAmount / holdValue) * 100 : 0;

    // Fee Calculations
    const feeDaily = simDeposit * (simFeeApr / 100) / 365;
    const feeMonthly = feeDaily * 30;
    const netPnL = ilAmount + feeMonthly;

    useEffect(() => {
        // Load Notes
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
            setContent(savedNotes);
        } else {
            setContent("Welcome to your Investment Dashboard!\n\nUse this space to write notes, definitions, or instructions for yourself.\n\nExample:\n- LP: Liquidity Pool\n- ROI: Return on Investment\n- Check Binance every Monday");
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, content);
        setIsEditing(false);
    };

    const handleCancel = () => {
        const savedNotes = localStorage.getItem(STORAGE_KEY);
        setContent(savedNotes || "");
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Tabs */}
            <div className="flex justify-between items-center px-6 py-0 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 overflow-x-auto custom-scrollbar">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('NOTES')}
                        className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'NOTES'
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <BookOpen size={18} />
                        Notes & Dictionary
                    </button>
                    <button
                        onClick={() => setActiveTab('SIMULATOR')}
                        className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'SIMULATOR'
                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                            : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                    >
                        <Calculator size={18} />
                        CL Simulator (V3)
                    </button>
                </div>

                {activeTab === 'NOTES' && (
                    !isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Edit Notes"
                        >
                            <Pencil size={16} />
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <button
                                onClick={handleCancel}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Cancel"
                            >
                                <X size={18} />
                            </button>
                            <button
                                onClick={handleSave}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                title="Save Notes"
                            >
                                <Save size={18} />
                            </button>
                        </div>
                    )
                )}
            </div>

            <div className="p-6">
                {activeTab === 'NOTES' && (
                    isEditing ? (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-48 p-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-sm leading-relaxed custom-scrollbar resize-y"
                            placeholder="Type your notes here..."
                        />
                    ) : (
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 font-mono leading-relaxed">
                                {content || <span className="text-slate-400 italic">No notes yet. Click edit to add some.</span>}
                            </div>
                        </div>
                    )
                )}

                {activeTab === 'SIMULATOR' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-indigo-500" />
                                    Concentrated Liquidity Inputs
                                </h4>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Token A (Base)</label>
                                            <input
                                                type="text"
                                                value={simTokenA}
                                                onChange={(e) => setSimTokenA(e.target.value)}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-medium text-sm"
                                                placeholder="e.g. ETH"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Token B (Quote)</label>
                                            <input
                                                type="text"
                                                value={simTokenB}
                                                onChange={(e) => setSimTokenB(e.target.value)}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-medium text-sm"
                                                placeholder="e.g. USDC"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Deposit Value</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={simDeposit}
                                                    onChange={(e) => setSimDeposit(Number(e.target.value))}
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-medium text-sm pr-12"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none truncate max-w-[40px]">{simTokenB}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Entry Price</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={simEntryPrice}
                                                    onChange={(e) => setSimEntryPrice(Number(e.target.value))}
                                                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-medium text-sm pr-12"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none truncate max-w-[40px]">{simTokenB}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Price Range ({simTokenB} per {simTokenA})</label>
                                        <div className="flex items-center gap-2 mb-2">
                                            <input
                                                type="number"
                                                value={simMinPrice}
                                                onChange={(e) => setSimMinPrice(Number(e.target.value))}
                                                className="w-1/2 p-2 rounded-lg text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="Min"
                                            />
                                            <span className="text-slate-400">-</span>
                                            <input
                                                type="number"
                                                value={simMaxPrice}
                                                onChange={(e) => setSimMaxPrice(Number(e.target.value))}
                                                className="w-1/2 p-2 rounded-lg text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Required Deposit Split</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={ratioA}
                                                    onChange={(e) => handleSplitChange(Number(e.target.value))}
                                                    className="w-12 h-6 text-right text-xs font-bold text-indigo-600 bg-transparent border-b border-indigo-200 focus:border-indigo-600 outline-none"
                                                />
                                                <span className="text-xs font-bold text-indigo-600">% {simTokenA}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-1 cursor-pointer group" title="Drag Entry Price to adjust">
                                            <div
                                                className="h-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500 group-hover:bg-indigo-600"
                                                style={{ width: `${ratioA}%` }}
                                            >
                                                {ratioA > 10 && `${ratioA}%`}
                                            </div>
                                            <div
                                                className="h-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white transition-all duration-500 group-hover:bg-emerald-600"
                                                style={{ width: `${ratioB}%` }}
                                            >
                                                {ratioB > 10 && `${ratioB}%`}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium text-slate-500">
                                            {/* Ratios are now editable via the top input */}
                                            <span className="opacity-0">Placeholder</span>
                                            <span className="text-emerald-600 dark:text-emerald-400">{ratioB}% {simTokenB}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estimate Fee APR (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={simFeeApr}
                                                onChange={(e) => setSimFeeApr(Number(e.target.value))}
                                                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-medium text-sm pr-8"
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            Est. daily fee income based on volume/TVL.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Price</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={simMinPrice * 0.5}
                                                max={simMaxPrice * 1.5}
                                                value={simTargetPrice}
                                                onChange={(e) => setSimTargetPrice(Number(e.target.value))}
                                                className="flex-1 accent-indigo-600"
                                            />
                                            <input
                                                type="number"
                                                value={simTargetPrice}
                                                onChange={(e) => setSimTargetPrice(Number(e.target.value))}
                                                className="w-24 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white font-bold text-indigo-600 dark:text-indigo-400 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800 space-y-6">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Value (Held)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                                        {holdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-slate-500 font-normal">{simTokenB}</span>
                                    </span>
                                    <span className={`text-sm font-medium ${holdValue >= simDeposit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        ({((holdValue - simDeposit) / simDeposit * 100).toFixed(2)}%)
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                    <span>{initialSplit.x.toFixed(4)} {simTokenA}</span>
                                    <span>+</span>
                                    <span>{initialSplit.y.toFixed(2)} {simTokenB}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Estimated Value (In LP)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {lpValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-lg text-slate-500 font-normal">{simTokenB}</span>
                                    </span>
                                    <span className={`text-sm font-medium ${lpValue >= simDeposit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        ({((lpValue - simDeposit) / simDeposit * 100).toFixed(2)}%)
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 flex gap-2">
                                    <span>{lpSplit.x.toFixed(4)} {simTokenA}</span>
                                    <span>+</span>
                                    <span>{lpSplit.y.toFixed(2)} {simTokenB}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Impermanent Loss</span>
                                    <span className="text-xs font-mono text-rose-500">{ilPercent.toFixed(2)}%</span>
                                </div>
                                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                                    {ilAmount < 0 ? '-' : ''}{Math.abs(ilAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {simTokenB}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Divergence from holding. <br />
                                    Concentrated liquidity magnifies IL risk.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Fee Projection & Net Impact</span>
                                <div className="grid grid-cols-2 gap-4 mt-2 mb-3">
                                    <div className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Monthly Fees</div>
                                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            +{feeMonthly.toLocaleString(undefined, { maximumFractionDigits: 2 })} {simTokenB}
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg">
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">Net PnL (IL + Fees)</div>
                                        <div className={`text-sm font-bold ${netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                            {netPnL > 0 ? '+' : ''}{netPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })} {simTokenB}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardNotes;
