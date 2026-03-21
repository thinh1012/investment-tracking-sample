import React, { useEffect, useState, useMemo } from 'react';
import { Newspaper, TrendingUp, Info, AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, Search, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { StrategistIntelligenceService, StrategistIntel } from '../../services/StrategistIntelligenceService';
import { scoutService } from '../../services/scout';
import { ScoutReport } from '../../services/database/types';

interface Props {
    scoutReportProp?: ScoutReport | null;
}

export const DailyIntelligenceBrief: React.FC<Props> = ({ scoutReportProp }) => {
    const [intel, setIntel] = useState<StrategistIntel[]>([]);
    const [scoutReport, setScoutReport] = useState<ScoutReport | null>(null);
    const [loading, setLoading] = useState(true);

    const activeReport = scoutReportProp || scoutReport;
    const [progressStep, setProgressStep] = useState<string | null>(null);
    const [now, setNow] = useState(Date.now());
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('strategist_brief_collapsed') === 'true';
    });

    const loadIntel = async () => {
        setLoading(true);
        try {
            const [intelData, report] = await Promise.all([
                StrategistIntelligenceService.getAllIntel(),
                scoutService.getReport()
            ]);
            setIntel(intelData);
            setScoutReport(report);
        } catch (error) {
            console.error("Failed to load strategist intel:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadIntel();
        const interval = setInterval(() => setNow(Date.now()), 60000);

        const handleUpdate = () => {
            loadIntel();
        };

        window.addEventListener('strategist_intel_updated', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('strategist_intel_updated', handleUpdate);
        };
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('strategist_brief_collapsed', String(newState));
    };

    const handleRefreshClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent collapsing when clicking refresh
        setProgressStep('Scanning Portfolio...');

        setTimeout(() => setProgressStep('Analysing Ecosystems...'), 800);
        setTimeout(() => setProgressStep('Compiling Intelligence...'), 1600);

        window.dispatchEvent(new CustomEvent('strategist-job-requested'));
        await StrategistIntelligenceService.performScrape();

        setTimeout(() => {
            loadIntel();
            setProgressStep(null);
        }, 2200);
    };

    const categorizedIntel = useMemo(() => {
        return {
            holdings: intel.filter(i => i.signalType === 'HOLDING'),
            watchlist: intel.filter(i => i.signalType === 'WATCHLIST' || i.signalType === 'OPPORTUNITY')
        };
    }, [intel]);

    const getRelativeTime = (timestamp: number) => {
        const diff = Math.floor((now - timestamp) / 60000);
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        return `${Math.floor(diff / 60)}h ago`;
    };

    const SignalBars: React.FC<{ strength: number }> = ({ strength }) => {
        const bars = [1, 2, 3];
        const activeCount = strength > 85 ? 3 : strength > 70 ? 2 : 1;
        return (
            <div className="flex gap-0.5 items-end h-3">
                {bars.map(i => (
                    <div
                        key={i}
                        className={`w-1 rounded-sm transition-all duration-500 ${i <= activeCount
                            ? 'bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]'
                            : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                        style={{ height: `${i * 4}px` }}
                    />
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="animate-pulse bg-slate-100 dark:bg-slate-800/50 h-32 rounded-2xl mb-6"></div>
    );

    return (
        <div className={`mb-8 group relative overflow-hidden rounded-2xl border border-indigo-200/50 dark:border-indigo-500/20 bg-white dark:bg-slate-900 shadow-xl shadow-indigo-500/5 transition-all duration-500 ${isCollapsed ? 'max-h-[88px]' : 'max-h-[2000px]'}`}>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="p-6 relative z-10">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={toggleCollapse}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                            <Activity size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 leading-none">Strategist Intelligence Brief</h2>
                                {isCollapsed && (
                                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
                                        {intel.length} Signals
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest opacity-70 mt-1">Tactical Portfolio Intelligence</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefreshClick}
                            disabled={!!progressStep}
                            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${progressStep
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                        >
                            <RefreshCw size={14} className={progressStep ? 'animate-spin' : ''} />
                            {progressStep || 'Run Deep Scrape'}
                        </button>

                        <div className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/5 rounded-lg transition-colors">
                            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        </div>
                    </div>
                </div>

                {/* Content Block with Internal Scroll */}
                <div className={`mt-6 transition-all duration-500 ${isCollapsed ? 'opacity-0 h-0 pointer-events-none translate-y-4' : 'opacity-100 h-auto translate-y-0'}`}>
                    <div className="max-h-[520px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                        {/* 0. Macro Intelligence Snapshot */}
                        {activeReport && !isCollapsed && (
                            <MacroSnapshot report={activeReport} />
                        )}

                        {/* 0.1 Yield Alpha */}
                        {activeReport?.yields && activeReport.yields.length > 0 && !isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="p-1 bg-indigo-500/10 text-indigo-500 rounded-md"><TrendingUp size={12} strokeWidth={3} /></span>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Yield Alpha (Watchlist)</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {activeReport.yields.map((y, i) => (
                                        <div key={i} className="p-3 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/5 group/y hover:border-indigo-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase truncate">{y.project}</p>
                                                <span className="text-[7px] text-slate-500 font-mono">${(y.tvlUsd / 1e6).toFixed(1)}M</span>
                                            </div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1">{y.symbol}</p>
                                            <p className="text-[14px] font-mono font-black text-emerald-500 tracking-tighter group-hover/y:scale-110 transition-transform origin-left">{y.apy.toFixed(1)}%</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 0.2 Trusted Scout Sources */}
                        {activeReport?.trustedSources && Object.keys(activeReport.trustedSources).length > 0 && !isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="p-1 bg-indigo-500/10 text-indigo-500 rounded-md"><ShieldCheck size={12} strokeWidth={3} /></span>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Trusted Scout Sources (Golden Record)</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(activeReport.trustedSources).map(([name, url], i) => (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 rounded-lg border border-indigo-500/10 bg-indigo-500/5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center gap-2"
                                        >
                                            <Search size={10} />
                                            {name}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 1. Holding Alerts */}
                        {categorizedIntel.holdings.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="p-1 bg-emerald-500/10 text-emerald-500 rounded-md"><ShieldCheck size={12} strokeWidth={3} /></span>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Holdings Intelligence</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {categorizedIntel.holdings.map((item) => (
                                        <IntelCard
                                            key={item.symbol}
                                            item={item}
                                            getRelativeTime={getRelativeTime}
                                            SignalBars={SignalBars}
                                            now={now}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Opportunities */}
                        {categorizedIntel.watchlist.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="p-1 bg-indigo-500/10 text-indigo-500 rounded-md"><Search size={12} strokeWidth={3} /></span>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ecosystem Opportunities</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {categorizedIntel.watchlist.map((item) => (
                                        <IntelCard
                                            key={item.symbol}
                                            item={item}
                                            getRelativeTime={getRelativeTime}
                                            SignalBars={SignalBars}
                                            now={now}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {intel.length === 0 && (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                <Search size={32} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No Intelligence Cached</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3);
                }
            `}</style>
        </div>
    );
};

const IntelCard: React.FC<{
    item: StrategistIntel;
    getRelativeTime: (t: number) => string;
    SignalBars: React.FC<{ strength: number }>;
    now: number;
}> = ({ item, getRelativeTime, SignalBars, now }) => {
    return (
        <div className="p-4 rounded-2xl border transition-all duration-500 group/card flex flex-col border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 hover:shadow-lg hover:shadow-indigo-500/5">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight">{item.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SignalBars strength={item.signalStrength} />
                        <span className="text-[9px] font-mono font-bold text-indigo-500/70">{item.signalStrength}%</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                        {getRelativeTime(item.updatedAt)}
                    </span>
                </div>
            </div>

            <div className="mb-3">
                <span className={`inline-block text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest mb-2 ${item.rating === 'STRONG BUY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                    item.rating === 'GOOD' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' :
                        item.rating === 'RISKY' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' :
                            'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    }`}>
                    {item.rating}
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-bold">
                    {item.verdict}
                </p>
            </div>

            <div className="flex gap-4 border-t border-slate-200 dark:border-white/5 pt-3 overflow-x-auto no-scrollbar">
                {Object.entries(item.metrics).map(([key, val]) => (
                    <div key={key} className="flex-shrink-0">
                        <p className="text-[8px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 font-black mb-0.5">{key}</p>
                        <p className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 tracking-tighter">{val as string}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const MacroSnapshot: React.FC<{ report: ScoutReport }> = ({ report }) => {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 overflow-hidden">
                <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-1">Stablecoin Liquidity</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-slate-800 dark:text-white">${report.stables.totalCap.toFixed(1)}B</span>
                        <span className="text-[9px] font-bold text-emerald-500">+{report.stables.change24h}%</span>
                    </div>
                </div>

                <div className="flex flex-col border-l border-indigo-500/10 pl-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-1">Market Sentiment</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800 dark:text-white">{report.sentiment.label}</span>
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500"
                                style={{ width: `${report.sentiment.value}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col border-l border-indigo-500/10 pl-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-1">BTC & Stable Dominance</span>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1">
                            <span className="text-[7px] font-bold text-slate-400">BTC</span>
                            <span className="text-[9px] font-mono font-black text-slate-700 dark:text-slate-200">{report.dominance.btc.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[7px] font-bold text-slate-400">USDT</span>
                            <span className="text-[9px] font-mono font-black text-slate-700 dark:text-slate-200">{report.dominance.usdt.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[7px] font-bold text-slate-400">USDC</span>
                            <span className="text-[9px] font-mono font-black text-slate-700 dark:text-slate-200">{report.dominance.usdc.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col border-l border-indigo-500/10 pl-4">
                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-1">Network TVL</span>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {Object.entries(report.ecosystems).slice(0, 4).map(([chain, data]) => (
                            <div key={chain} className="flex-col hidden lg:flex">
                                <span className="text-[7px] font-bold text-slate-400 uppercase">{chain}</span>
                                <span className="text-[9px] font-mono font-black text-slate-700 dark:text-slate-300">
                                    ${(data.tvl / 1e9).toFixed(1)}B
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bridge Flow Summary */}
            {report.bridgeFlows && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <RefreshCw size={14} className="animate-spin-slow" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Bridge Flow Monitor</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">${report.bridgeFlows.total24h.toFixed(1)}M Net Volume (24h)</p>
                        </div>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar w-full md:w-auto">
                        {report.bridgeFlows.topChains.map((c, i) => (
                            <div key={i} className="flex flex-col min-w-[60px]">
                                <p className="text-[7px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">{c.chain}</p>
                                <p className="text-[10px] font-mono font-black text-emerald-500 tracking-tight">${c.volume.toFixed(1)}M</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
