import React, { useEffect, useState } from 'react';
import { Newspaper, TrendingUp, Info, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { StrategistIntelligenceService, StrategistIntel } from '../../services/StrategistIntelligenceService';

export const DailyIntelligenceBrief: React.FC = () => {
    const [intel, setIntel] = useState<StrategistIntel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadIntel = async () => {
        setLoading(true);
        const data = await StrategistIntelligenceService.getAllIntel();
        setIntel(data);
        setLoading(false);
    };

    useEffect(() => {
        loadIntel();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // In a real app, this might trigger a server-side scrape.
        // In this agentic setup, the user clicking this signals the Strategist to "Run the Job".
        console.log("Intelligence Job Requested by User");
        // We simulate a small delay to make it feel premium
        setTimeout(() => {
            setIsRefreshing(false);
            window.dispatchEvent(new CustomEvent('strategist-job-requested'));
        }, 1500);
    };

    if (loading) return (
        <div className="animate-pulse bg-slate-100 dark:bg-slate-800/50 h-32 rounded-2xl mb-6"></div>
    );

    return (
        <div className="mb-8 group relative overflow-hidden rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/5">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="p-5 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Newspaper size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Strategist Intelligence Brief</h2>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Daily Ecosystem Analysis & Scrapes</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isRefreshing
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95'
                            }`}
                    >
                        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Scraping...' : 'Run Job'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intel.length === 0 ? (
                        <div className="col-span-2 py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                            <Info size={24} className="mx-auto text-slate-300 mb-2" />
                            <p className="text-xs text-slate-400 font-medium italic">No intelligence data cached. Click 'Run Job' to initiate scraping.</p>
                        </div>
                    ) : (
                        intel.map((item) => (
                            <div key={item.symbol} className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:border-indigo-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-black text-slate-800 dark:text-white">{item.symbol}</span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${item.rating === 'STRONG BUY' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                item.rating === 'GOOD' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                                    item.rating === 'RISKY' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                        'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                            }`}>
                                            {item.rating}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 mb-3 font-medium">
                                    {item.verdict}
                                </p>
                                <div className="flex gap-4 border-t border-slate-200 dark:border-white/5 pt-3">
                                    {Object.entries(item.metrics).map(([key, val]) => (
                                        <div key={key}>
                                            <p className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-black">{key}</p>
                                            <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">{val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
