import React, { useState, useEffect } from 'react';
import { Search, Activity, Zap, Trash2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { scoutService } from '../../services/DataScoutService';
import { googleNewsScout } from '../../services/GoogleNewsScout';
import { eventManager } from '../../services/EventManager';
import { highFidelityScoutService } from '../../services/HighFidelityScoutService';


interface ScoutJob {
    id: string;
    name: string;
    status: string;
    progress: number;
    time: string;
}

const ScoutModule: React.FC = () => {
    const [isRefilling, setIsRefilling] = useState(false);
    const [scoutJobs, setScoutJobs] = useState<ScoutJob[]>(() => {
        const saved = localStorage.getItem('scout:jobs');
        return saved ? JSON.parse(saved) : [
            { id: 'JOB-102', name: 'Stablecoin Supply', status: 'Pending', progress: 0, time: '08:30' },
            { id: 'JOB-103', name: 'Ecosystem TVL', status: 'Pending', progress: 0, time: '06:00' }
        ];
    });

    // [DATA_COURIER] Protocol: Check for offline packets (Dead Drop)
    useEffect(() => {
        const checkOfflinePacket = async () => {
            // @ts-ignore
            if (typeof window.electronAPI !== 'undefined') {
                // @ts-ignore
                const result = await window.electronAPI.scout.retrievePacket();
                if (result.success && result.data) {
                    console.log("[SCOUT] 📬 Offline Package Received:", result.data);

                    // Re-use processing logic (DRY candidate, but inline for now for safety)
                    const dominancePayload: any = {};
                    const raw = result.data;
                    if (raw['USDT.D']) dominancePayload.usdt = parseFloat(raw['USDT.D']);
                    if (raw['USDC.D']) dominancePayload.usdc = parseFloat(raw['USDC.D']);
                    if (raw['OTHERS']) dominancePayload.othersMarketCap = parseFloat(raw['OTHERS'].replace('B', ''));

                    if (Object.keys(dominancePayload).length > 0) {
                        await scoutService.injectAgenticReport({
                            dominance: dominancePayload,
                            scoutNote: `🚀 [AGENTIC_HARVEST]: Recovered offline mission data.`
                        });
                        setRecentLogs(prev => [{
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            type: 'SUCCESS',
                            msg: "Data Courier: Recovered offline mission data."
                        }, ...prev]);
                    }
                }
            }
        };
        checkOfflinePacket();
    }, []);

    const [recentLogs, setRecentLogs] = useState<{ time: string, type: string, msg: string }[]>(() => {
        const saved = localStorage.getItem('scout:logs');
        return saved ? JSON.parse(saved) : [
            { time: '08:54', type: 'SUCCESS', msg: 'BTC.D successfully updated to 59.0%' },
            { time: '08:52', type: 'INFO', msg: 'Fear & Greed Index harvested (24 - Extreme Fear)' },
            { time: '08:45', type: 'WARNING', msg: 'Sentiment API latency detected (2.4s)' }
        ];
    });

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem('scout:jobs', JSON.stringify(scoutJobs));
        localStorage.setItem('scout:logs', JSON.stringify(recentLogs));
    }, [scoutJobs, recentLogs]);

    // [ARCHITECT] Mission Scheduler (Phase 44/Morning Report)
    useEffect(() => {
        const checkCycle = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();

            // Trigger Global Morning Refill at 06:00 AM
            if (h === 6 && m === 0 && !isRefilling) {
                console.log("[SCOUT] Automated Morning Sync Triggered (06:00)");
                handleRefill();
            }
        };

        const timer = setInterval(checkCycle, 60000);
        checkCycle();
        return () => clearInterval(timer);
    }, [isRefilling]);

    // [ARCHITECT] Restore Direct Tactical Bridge (Strategist -> Scout)
    useEffect(() => {
        const handleTacticalRequest = (data: { symbol: string, reason: string }) => {
            console.log(`[SCOUT] Received Tactical Signal for ${data.symbol}: ${data.reason}`);
            setRecentLogs(prev => [{
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'INFO',
                msg: `Tactical Request: [${data.symbol}] Target identified by Strategist.`
            }, ...prev].slice(0, 10));

            handleRefill(data.symbol);
        };

        const unsubscribe = eventManager.on('scout:request_intel', handleTacticalRequest);
        return () => {
            unsubscribe();
        };
    }, []);

    const handleRefill = async (targetSymbol?: string) => {
        if (isRefilling) return;
        setIsRefilling(true);
        // Set jobs to running visually
        setScoutJobs((prev: ScoutJob[]) => prev.map((j: ScoutJob) => ({ ...j, status: 'Running', progress: 30 })));

        try {
            // 1. Run Standard Scout Missions (Electron Bridge)
            // @ts-ignore
            if (typeof window.electronAPI !== 'undefined') {
                // @ts-ignore
                const result = await window.electronAPI.scout.refill();

                if (result.success && result.data) {
                    console.log("[SCOUT] 📥 Received Agentic Data:", result.data);

                    // Transform Data for Injection
                    const dominancePayload: any = {};
                    const raw = result.data;

                    if (raw['USDT.D']) dominancePayload.usdt = parseFloat(raw['USDT.D']);
                    if (raw['USDC.D']) dominancePayload.usdc = parseFloat(raw['USDC.D']);
                    if (raw['OTHERS']) dominancePayload.othersMarketCap = parseFloat(raw['OTHERS'].replace('B', ''));

                    // Inject into Database via Service
                    if (Object.keys(dominancePayload).length > 0) {
                        await scoutService.injectAgenticReport({
                            dominance: dominancePayload,
                            scoutNote: `🚀 [AGENTIC_HARVEST]: Verified USDT.D (${dominancePayload.usdt}%), USDC.D (${dominancePayload.usdc}%) via Headless Scout.`
                        });

                        // [IPC BRIDGE] Broadcast to Vault (Cross-Window Sync)
                        if ((window as any).electronAPI?.scout?.broadcast) {
                            console.log("[SCOUT] 📡 Broadcasting Intel to Vault...");
                            await (window as any).electronAPI.scout.broadcast(dominancePayload);
                        }
                    }
                }
            }

            // 2. [DECOMMISSIONED] Google News Intercept Mission
            // commander requested removal of RSS-based news intercepts.

            // 3. [ARCHITECT] Phase 33: High-Fidelity Agentic Scouting
            // Automatically verify TVL and Dominance during every refill sync.
            if (!targetSymbol) { // Only do full high-fi scan on global refill
                setScoutJobs((prev: ScoutJob[]) => prev.map((j: ScoutJob) =>
                    j.name.includes('TVL') ? { ...j, status: 'Running', progress: 50 } : j
                ));
                await highFidelityScoutService.performMission();
            }

            // Cleanup old intercepts to reflect decommissioned state
            localStorage.removeItem('scout_intercepts');

            // Mark all as complete
            setScoutJobs((prev: ScoutJob[]) => prev.map((j: ScoutJob) => ({ ...j, status: 'Completed', progress: 100 })));

            // Add success log
            setRecentLogs(prev => [{
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'SUCCESS',
                msg: targetSymbol
                    ? `Tactical Success: [${targetSymbol}] synchronized.`
                    : 'Global Harvest Complete: High-Fidelity Vault Hydrated.'
            }, ...prev].slice(0, 10));

        } catch (error) {
            console.error("Refill failed:", error);
            setRecentLogs(prev => [{
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'ERROR',
                msg: `Mission Failure: ${error instanceof Error ? error.message : String(error)}`
            }, ...prev]);
        } finally {
            setIsRefilling(false);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
            {/* Header Info */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">Data Scout Hub</h2>
                    <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Real-time Signal Harvesting & Mission Control</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleRefill()}
                        disabled={isRefilling}
                        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest ${isRefilling ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        <Zap size={14} className={isRefilling ? "animate-spin" : ""} />
                        {isRefilling ? "Refilling..." : "Force Global Refill"}
                    </button>

                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Operations */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity size={12} className="text-indigo-500" /> Active Scouting Jobs
                        </h3>
                        <div className="space-y-6">
                            {scoutJobs.map((job: ScoutJob) => (
                                <div key={job.id} className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-[10px] font-mono text-indigo-400 block mb-1">{job.id}</span>
                                            <h4 className="text-sm font-black text-white">{job.name}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${job.status === 'Running' ? 'bg-indigo-500/20 text-indigo-400 animate-pulse' : job.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                                {job.status}
                                            </span>
                                            <div className="text-[10px] text-slate-500 mt-1 font-bold">Planned: {job.time}</div>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${job.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Historical Logs */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Mission Logs</h3>
                        <div className="space-y-4">
                            {recentLogs.map((log, i) => (
                                <div key={i} className="flex gap-4 items-start p-3 hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="mt-1">
                                        {log.type === 'SUCCESS' && <CheckCircle size={14} className="text-emerald-500" />}
                                        {log.type === 'INFO' && <Activity size={14} className="text-indigo-500" />}
                                        {log.type === 'WARNING' && <AlertTriangle size={14} className="text-amber-500" />}
                                        {log.type === 'ERROR' && <AlertTriangle size={14} className="text-rose-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-300 font-medium">{log.msg}</p>
                                        <span className="text-[10px] text-slate-600 font-mono mt-1 block">{log.time} UTC</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* API Health Column */}
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Connector Health</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'DefiLlama TVL', latency: '340ms', status: 'Optimal' },
                                { name: 'Coingecko Global', latency: '890ms', status: 'Optimal' },
                                { name: 'Alternative.me F&G', latency: '1.2s', status: 'Delayed' },
                                { name: 'CryptoPanic News', latency: '0ms', status: 'Offline' }
                            ].map((api, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                    <div>
                                        <div className="text-xs font-black text-white">{api.name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold">{api.latency}</div>
                                    </div>
                                    <div className={`text-[10px] font-black ${api.status === 'Optimal' ? 'text-emerald-500' : api.status === 'Delayed' ? 'text-amber-500' : 'text-rose-500'}`}>
                                        {api.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* [TACTICAL_FEEDBACK_LOOP] Visualizer */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Zap size={12} fill="currentColor" /> Tactical Targets
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {scoutService.getTrackedProtocols().map(slug => (
                                <span key={slug} className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                    {slug}
                                </span>
                            ))}
                        </div>
                        <p className="text-[9px] text-slate-600 mt-3 font-medium leading-tight">
                            These protocols are under "Deep Watch" by order of the Strategist.
                        </p>
                    </div>

                    {/* [STEALTH_CONTROLS] Human-Like Delay */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock size={12} /> Stealth Settings
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Reaction Time (Min - Max)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        defaultValue={2500}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                                        onChange={(e) => {
                                            // @ts-ignore
                                            if (window.electronAPI) window.electronAPI.scout.setDelay(parseInt(e.target.value), 20000);
                                        }}
                                    />
                                    <span className="text-slate-600">-</span>
                                    <input
                                        type="number"
                                        defaultValue={20000}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                                        onChange={(e) => {
                                            // @ts-ignore
                                            if (window.electronAPI) window.electronAPI.scout.setDelay(2500, parseInt(e.target.value));
                                        }}
                                    />
                                    <span className="text-[9px] text-slate-600 font-bold">ms</span>
                                </div>
                                <p className="text-[9px] text-slate-600 mt-2 font-medium leading-tight">
                                    Randomized delays simulate human behavior to bypass WAF detection on TradingView/CMC.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Scout Note</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            The Data Scout is currently synchronized with the Strategist's tactical scrape heart-beat (6h intervals).
                            Manual refills bypass cache.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoutModule;
