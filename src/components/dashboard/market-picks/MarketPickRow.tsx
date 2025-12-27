import { TrendingUp, TrendingDown, X, Calculator, Zap } from 'lucide-react';
import { deriveOpenPrice, ChartPoint } from '../../../services/priceService';
import { StrategistIntel } from '../../../services/StrategistIntelligenceService';

interface Props {
    pick: { symbol: string };
    price: number;
    change: number | null | undefined;
    volume: number | null | undefined;
    openPrice?: number;
    intel?: StrategistIntel;
    sparkline?: ChartPoint[];
    locale?: string;
    editingOpen: boolean;
    onEditOpen: (value: string) => void;
    onSaveOpen: (value: number) => void;
    onCancelEdit: () => void;
    onRemove: () => void;
    onSimulate?: (symbol: string, price: number) => void;
}

const formatVolume = (num: number | null | undefined, locale?: string): string => {
    if (num === null || num === undefined) return '-';
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M`;
    return `$${num.toLocaleString(locale, { maximumFractionDigits: 2 })}`;
};

const formatPrice = (num: number | null | undefined, locale?: string, isIndicator: boolean = false): string => {
    if (num === null || num === undefined) return '---';
    if (isIndicator) return `${num.toFixed(2)}%`;
    const decimals = num < 1 ? 6 : 2;
    return `$${num.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

export const MarketPickRow: React.FC<Props> = ({
    pick, price, change, volume, openPrice, intel, sparkline, locale,
    editingOpen, onEditOpen, onSaveOpen, onCancelEdit, onRemove, onSimulate
}) => {
    return (
        <div className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 gap-2">
            {/* Asset Info */}
            <div className="flex items-center gap-3 w-[160px] min-w-[160px]">
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                        {pick.symbol.substring(0, 3)}
                    </div>
                </div>
                <div className="truncate">
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">
                        {pick.symbol}
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="flex-1 flex items-center justify-end gap-6 text-right">
                {/* Open Price */}
                <div className="w-24 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="md:hidden block text-[8px] uppercase text-slate-400">Open</span>
                    {editingOpen ? (
                        <input
                            type="number"
                            step="any"
                            defaultValue={openPrice || price || 0}
                            onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) onSaveOpen(val);
                                onCancelEdit();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = parseFloat((e.target as HTMLInputElement).value);
                                    if (!isNaN(val)) onSaveOpen(val);
                                    onCancelEdit();
                                }
                                if (e.key === 'Escape') onCancelEdit();
                            }}
                            className="w-full bg-white dark:bg-slate-800 border border-purple-500 rounded px-1 outline-none text-right"
                            autoFocus
                        />
                    ) : (() => {
                        // Current logic:
                        // 'openPrice' contains either a daily open from history OR a manual override.
                        // 'rollingOpen' is derived from (currentPrice, 24hChange).

                        const rollingOpen = deriveOpenPrice(price, change);

                        // To be "correct" in a live dashboard, the Open price MUST match the 24h change.
                        // We prioritize the derived rolling open so it remains consistent with the % change.
                        // If we have a manual override (or historical data) and NO change data, we fall back to history.
                        const displayOpen = rollingOpen || openPrice;

                        const isRolling = !!rollingOpen;

                        return (
                            <span
                                onClick={() => onEditOpen((displayOpen || price || 0).toString())}
                                className={`cursor-pointer hover:text-purple-500 transition-colors ${!displayOpen ? 'opacity-50' : ''}`}
                                title={isRolling ? "Rolling 24h Open (matches % change). Click to override." : "Daily Open. Click to override."}
                            >
                                {displayOpen ? (
                                    <>
                                        {formatPrice(displayOpen, locale, pick.symbol.endsWith('.D'))}
                                        {isRolling && <span className="ml-0.5 text-[8px] opacity-70">*</span>}
                                    </>
                                ) : '---'}
                            </span>
                        );
                    })()}
                </div>

                {/* Current Price */}
                <div className="w-24 font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                    <span className="md:hidden block text-[8px] uppercase text-slate-400">Current</span>
                    {formatPrice(price, locale, pick.symbol.endsWith('.D'))}
                </div>

                {/* 24h Change */}
                <div className="w-20 flex justify-end">
                    {change !== undefined && change !== null ? (
                        <div className={`text-xs font-medium flex items-center gap-1 ${change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 2 })}%
                        </div>
                    ) : (
                        <span className="text-slate-400 text-xs">-</span>
                    )}
                </div>

                {/* Perf since Open */}
                <div className="w-20 font-mono text-[11px] font-bold">
                    {(() => {
                        const displayOpen = deriveOpenPrice(price, change) || openPrice;
                        if (displayOpen && price) {
                            const perf = ((price - displayOpen) / displayOpen) * 100;
                            return (
                                <span className={perf >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                    {perf >= 0 ? '+' : ''}{perf.toFixed(1)}%
                                </span>
                            );
                        }
                        return <span className="text-slate-300">—</span>;
                    })()}
                </div>

                {/* Volume */}
                <div className="w-20 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {formatVolume(volume, locale)}
                </div>

                {/* Sparkline Trend */}
                <div className="w-24 h-8 flex items-center justify-end">
                    {sparkline && sparkline.length > 1 ? (
                        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                            <path
                                d={`M ${sparkline.map((p, i) => {
                                    const x = (i / (sparkline.length - 1)) * 100;
                                    const pricesArray = sparkline.map(sp => sp.price);
                                    const min = Math.min(...pricesArray);
                                    const max = Math.max(...pricesArray);
                                    const y = 30 - ((p.price - min) / (max - min || 1)) * 30;
                                    return `${x} ${y}`;
                                }).join(' L ')}`}
                                fill="none"
                                stroke={sparkline[sparkline.length - 1].price >= sparkline[0].price ? '#10b981' : '#f43f5e'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    ) : (
                        <div className="h-px w-10 bg-slate-100 dark:bg-slate-800" />
                    )}
                </div>

                {/* Simulate Button */}
                {onSimulate && (
                    <div className="w-10 flex justify-end">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSimulate(pick.symbol, price);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-purple-500 transition-all hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                            title="Simulate LP"
                        >
                            <Calculator size={14} />
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="w-6 flex justify-end">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                        title="Remove"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};
