import React, { useState } from 'react';
import {
    Shield,
    Database,
    Network,
    Lock,
    Activity,
    Server,
    Code2,
    FileJson,
    GitBranch,
    Zap
} from 'lucide-react';

const SystemsBlueprint: React.FC = () => {
    const stores = [
        { name: 'transactions', version: 1, type: 'Financial Data' },
        { name: 'logs', version: 2, type: 'System Audit' },
        { name: 'watchlist', version: 3, type: 'Intelligence' },
        { name: 'settings', version: 3, type: 'Configuration' },
        { name: 'manual_prices', version: 3, type: 'Data Cache' },
        { name: 'asset_overrides', version: 4, type: 'Calibration' },
        { name: 'market_picks', version: 5, type: 'Tactical Signals' },
        { name: 'historical_prices', version: 6, type: 'Analysis History' },
        { name: 'strategist_intel', version: 8, type: 'AI Verdicts' },
        { name: 'scout_reports', version: 13, type: 'Scouting Artifacts' }
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Architect Header */}
            <div className="glass-card p-8 border-indigo-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950/80">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-500 shadow-lg shadow-indigo-500/10">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">SYSTEMS BLUEPRINT</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                            <Lock size={12} className="text-emerald-500" /> Technical Authority & Structural Integrity
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Service Orchestration */}
                <div className="lg:col-span-2 glass-card p-6 border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                        <Network size={14} className="text-indigo-400" /> Service Orchestration
                    </h3>

                    <div className="relative p-8 bg-slate-950/50 rounded-3xl border border-slate-800 flex flex-col items-center">
                        <div className="flex justify-between w-full max-w-lg mb-12 relative z-10">
                            {/* Vault Node */}
                            <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-900 rounded-2xl border-2 border-emerald-500/50 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    <Server size={32} />
                                </div>
                                <div className="mt-3 text-center">
                                    <div className="text-[10px] font-black text-white px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 mb-1">PORT 5176</div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alpha Vault</div>
                                </div>
                            </div>

                            {/* Connection Line */}
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-emerald-500/30 via-indigo-500/50 to-indigo-500/30">
                                <Activity size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" />
                            </div>

                            {/* HQ Node */}
                            <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-900 rounded-2xl border-2 border-indigo-500/50 text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                    <Activity size={32} />
                                </div>
                                <div className="mt-3 text-center">
                                    <div className="text-[10px] font-black text-white px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20 mb-1">PORT 5188</div>
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital HQ</div>
                                </div>
                            </div>
                        </div>

                        {/* Components Map */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
                            {['Auth Layer', 'IPC Bridge', 'Scraper Node', 'AI Gateway'].map((comp, i) => (
                                <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{comp}</div>
                                    <div className="text-[8px] font-bold text-emerald-500 mt-1 uppercase">Operational</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Core Structural Directives</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <Lock size={16} className="text-indigo-400" />
                                <span className="text-xs font-bold text-slate-300 italic font-serif">"Security Parity: Operations console isolated from client vault origin."</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <Zap size={16} className="text-emerald-400" />
                                <span className="text-xs font-bold text-slate-300 italic font-serif">"Latency Constraint: HMR heartbeat maintained under 200ms."</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Schema Registry */}
                <div className="glass-card p-6 border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <Database size={14} className="text-emerald-400" /> Schema Registry (IndexedDB)
                    </h3>

                    <div className="space-y-2">
                        {stores.map((store, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 group hover:border-slate-700 transition-all flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Code2 size={12} className="text-slate-500" />
                                        <span className="text-xs font-bold text-white uppercase tracking-tighter">{store.name}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{store.type}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] font-black text-emerald-500 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20">V{store.version}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3 text-slate-400 mb-3">
                            <FileJson size={18} />
                            <div className="text-[10px] font-black uppercase tracking-widest">Snapshot Version: 20251228-01</div>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full w-[88%]" />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[8px] font-black text-slate-500">INTEGRITY CHECK</span>
                            <span className="text-[8px] font-black text-emerald-500 uppercase">Passed</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Architecture Map Footnote */}
            <div className="flex justify-center">
                <div className="flex items-center gap-2 opacity-30 group hover:opacity-100 transition-opacity">
                    <GitBranch size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alpha Vault Infrastructure v1.2.0-LTS</span>
                </div>
            </div>
        </div>
    );
};

export default SystemsBlueprint;
