import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart } from 'recharts';
import { BitcoinAnalogService, BitcoinAnalogResult } from '../../services/BitcoinAnalogService';
import { fetchMarketChart } from '../../services/priceService';
import { TrendingUp, Info, Loader2 } from 'lucide-react';

const CACHE_KEY = 'bitcoin_analog_data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const BitcoinAnalogChart: React.FC = () => {
    const [data, setData] = useState<BitcoinAnalogResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Check Cache
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { result, timestamp } = JSON.parse(cached);
                    // Validate that the cached result has the necessary USD scaling data and new RSI data
                    const isDataValid = result &&
                        typeof result.currentDay0Price === 'number' &&
                        result.currentDay0Price > 0 &&
                        typeof result.currentRSI === 'number';

                    if (isDataValid && Date.now() - timestamp < CACHE_DURATION && retryCount === 0) {
                        setData(result);
                        setLoading(false);
                        return;
                    }
                }

                // Fetch new data (5 years for good analog history)
                const marketData = await fetchMarketChart('BTC', 1825);
                if (marketData.length === 0) {
                    setError('Unable to fetch market data. Rate limit might be hit.');
                    setLoading(false);
                    return;
                }

                const result = BitcoinAnalogService.processAnalogs(marketData);
                setData(result);

                // Save to Cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    result,
                    timestamp: Date.now()
                }));
            } catch (err) {
                setError('Failed to process chart data.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [retryCount]);

    const chartData = useMemo(() => {
        if (!data || !data.currentDay0Price) return [];

        const day0Price = data.currentDay0Price;

        // Merge currentPath and averagePath based on day
        const allDays = new Set([
            ...data.averagePath.map(p => p.day),
            ...data.currentPath.map(p => p.day)
        ]);

        return Array.from(allDays)
            .sort((a, b) => a - b)
            .map(day => {
                const avg = data.averagePath.find(p => p.day === day);
                const curr = data.currentPath.find(p => p.day === day);
                return {
                    day,
                    displayDay: day === 0 ? '0' : (day > 0 ? `+${day}D` : `${day}D`),
                    // Scale from percentage back to USD
                    average: avg ? parseFloat(((avg.value / 100) * day0Price).toFixed(0)) : null,
                    current: curr ? parseFloat(((curr.value / 100) * day0Price).toFixed(0)) : null,
                    rsi: curr ? curr.rsi : null // Add RSI value from current path
                };
            });
    }, [data]);

    return (
        <div className="bg-gradient-to-br from-pink-50/50 to-white dark:from-pink-900/20 dark:to-slate-900 rounded-3xl p-6 shadow-sm border border-pink-100 dark:border-pink-900/30 mb-8 overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-pink-500" />
                        Bitcoin RSI Analog Chart
                    </h3>
                    <p className="text-pink-600/80 dark:text-pink-400/80 text-xs font-bold uppercase tracking-widest mt-1">
                        Average Market Path Following The Last Five Times Bitcoin's RSI Broke Below 30
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {data?.currentRSI !== null && data?.currentRSI !== undefined && (
                        <div className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${data.currentRSI < 30
                            ? 'bg-pink-100 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                            <span className="text-[10px] font-black uppercase tracking-tighter">Current RSI:</span>
                            <span className="text-xs font-black">{data.currentRSI.toFixed(1)}</span>
                        </div>
                    )}
                    {data?.lastOversoldDate && (
                        <div className="bg-pink-100 dark:bg-pink-900/40 px-3 py-1.5 rounded-full border border-pink-200 dark:border-pink-800 line-clamp-1 whitespace-nowrap">
                            <span className="text-[10px] font-black text-pink-600 dark:text-pink-300 uppercase tracking-tighter">Last Signal: {data.lastOversoldDate}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="h-[350px] w-full flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-pink-500 mb-2" size={32} />
                        <p className="text-pink-600 dark:text-pink-400 text-sm font-medium">Analyzing Historical RSI Analogs...</p>
                    </div>
                ) : error || !data ? (
                    <div className="text-center p-6">
                        <Info className="text-slate-400 mx-auto mb-2" size={32} />
                        <p className="text-slate-500 text-sm">{error || 'No analog data found.'}</p>
                        <button
                            onClick={() => setRetryCount(prev => prev + 1)}
                            className="mt-4 px-4 py-2 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-xl text-xs font-bold hover:bg-pink-200 dark:hover:bg-pink-900/60 transition-colors"
                        >
                            Retry Loading
                        </button>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 20 }}>
                            <defs>
                                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.15} />
                            <XAxis
                                dataKey="day"
                                type="number"
                                domain={[-90, 80]}
                                ticks={[-90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                label={{ value: 'Days from RSI < 30', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                            />
                            <YAxis
                                yAxisId="rsi"
                                orientation="right"
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(val) => val.toFixed(0)}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }}
                                labelFormatter={(val) => `Day ${val}`}
                                formatter={(value: number, name: string) => {
                                    if (name === 'rsi') return [`${value.toFixed(1)}`, 'Current RSI'];
                                    return [
                                        `$${Math.round(value).toLocaleString()}`,
                                        name === 'average' ? 'Historical Average' : 'Current Path'
                                    ];
                                }}
                            />
                            <ReferenceLine x={0} stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" label={{ position: 'top', value: 'Oversold (RSI < 30)', fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                            <ReferenceLine yAxisId="rsi" y={30} stroke="#f472b6" strokeWidth={1} strokeDasharray="5 5" opacity={0.5} label={{ position: 'right', value: 'RSI 30', fill: '#f472b6', fontSize: 10, fontWeight: 800 }} />

                            <Area type="monotone" dataKey="average" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" dot={false} isAnimationActive={true} />
                            <Line type="monotone" dataKey="current" stroke="#06b6d4" strokeWidth={3} dot={false} isAnimationActive={true} />
                            <Line yAxisId="rsi" type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" dot={false} isAnimationActive={true} opacity={0.6} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Legend / Credits */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-pink-100 dark:border-pink-900/30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bitcoin Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Historical Average (Last 5)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-violet-500 border-dashed rounded-full"></div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Current RSI</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Source: CoinGecko Data • Calculation: RSI(14) Analog Matching</div>
            </div>
        </div>
    );
};
