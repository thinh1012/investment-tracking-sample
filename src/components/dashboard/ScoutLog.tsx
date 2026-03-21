import React, { useEffect, useState } from 'react';
import { Telescope, RefreshCw, TrendingUp, Activity, PieChart, Layers } from 'lucide-react';
import { scoutService } from '../../services/scout';
import { TableShell } from '../common/TableShell';

import { ScoutReport } from '../../services/database/types';

export const ScoutLog: React.FC = () => {
    const [reports, setReports] = useState<ScoutReport[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const latest = await scoutService.getRecentReports(3);
            setReports(latest);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        return `$${val.toLocaleString()}`;
    };

    const triggerMission = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent toggling when clicking refresh
        setLoading(true);
        try {
            // Trigger fresh harvest via global service
            await scoutService.getReport(true);
            // Reload DB view (this will also refresh the cache)
            await fetchReports();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TableShell
            title="Scout Mission Log"
            subtitle="Historical Market Intelligence Reports"
            icon={<Telescope />}
            iconColor="indigo"
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="mt-6"
            extraHeaderActions={
                <button
                    onClick={triggerMission}
                    disabled={loading}
                    className="ml-auto p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-indigo-500 flex items-center gap-2"
                    title="Run Fresh Scout Mission"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            }
        >
            <div className="max-h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                {reports.length > 0 ? (
                    reports.map((rpt) => (
                        <div key={rpt.timestamp} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm hover:border-indigo-500/30 transition-all flex flex-col gap-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Mission ID: {rpt.timestamp}</span>
                                <span className="text-[10px] font-mono text-indigo-500 opacity-70">
                                    {new Date(rpt.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Activity size={10} />
                                        <span className="text-[9px] font-bold uppercase">Sentiment</span>
                                    </div>
                                    <span className={`text-xs font-black ${rpt.sentiment.value > 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {rpt.sentiment.value} / 100
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <TrendingUp size={10} />
                                        <span className="text-[9px] font-bold uppercase">Stables Cap</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                            {formatCurrency(rpt.stables.totalCap)}
                                        </span>
                                        <span className={`text-[9px] font-bold ${rpt.stables.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {rpt.stables.change24h > 0 ? '+' : ''}{rpt.stables.change24h.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <PieChart size={10} />
                                        <span className="text-[9px] font-bold uppercase">Dominance</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 pt-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-500 w-6">BTC</span>
                                            <span className="text-[10px] font-black text-indigo-500">{rpt.dominance.btc.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-500 w-6">USDT</span>
                                            <span className="text-[10px] font-bold text-emerald-500">{rpt.dominance.usdt.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-500 w-6">USDC</span>
                                            <span className="text-[10px] font-bold text-sky-500">{rpt.dominance.usdc.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Layers size={10} />
                                        <span className="text-[9px] font-bold uppercase">Hype TVL</span>
                                    </div>
                                    <span className="text-xs font-black text-indigo-400">
                                        {formatCurrency(rpt.ecosystems['HYPERLIQUID']?.tvl || 0)}
                                    </span>
                                </div>
                            </div>

                            {rpt.scoutNote && (
                                <div className="mt-1 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 italic">
                                        "{rpt.scoutNote}"
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 flex flex-col items-center gap-3 opacity-50">
                        <Telescope size={24} className="text-slate-300" />
                        <p className="text-xs font-medium text-slate-400">No missions logged yet.</p>
                    </div>
                )}
            </div>
        </TableShell>
    );
};
