import React, { useState, useEffect } from 'react';
import {
    Terminal,
    Activity,
    Zap,
    Layers,
    CheckCircle2,
    Settings,
    Cpu,
    Globe,
    Box
} from 'lucide-react';
import { formatICTTime } from '../../utils/time';

const ImplementationForge: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(formatICTTime());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(formatICTTime());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const modules = [
        { name: 'Executive Manager', status: 'SYNCHRONIZED', color: 'text-indigo-400' },
        { name: 'Architect', status: 'CORE_READY', color: 'text-emerald-400' },
        { name: 'Builder', status: 'FORGING...', color: 'text-amber-400' },
        { name: 'MoM Taker', status: 'LEDGER_LIVE', color: 'text-slate-400' },
        { name: 'Strategist', status: 'INTEL_READY', color: 'text-rose-400' },
        { name: 'Scout', status: 'HARVESTING', color: 'text-cyan-400' },
        { name: 'Reviewer', status: 'HEALTH_CHECK', color: 'text-orange-400' },
        { name: 'Accountant', status: 'DATA_SNAPSHOT', color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-6">
            {/* Environment Hero */}
            <div className="glass-card p-8 bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-amber-500/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-500 shadow-lg shadow-amber-500/10">
                            <Terminal size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-black text-white tracking-tighter">IMPLEMENTATION FORGE</h1>
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-md text-[10px] font-black text-amber-500 uppercase tracking-widest">Active</span>
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Mission Control for Frontend Deployment</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-right min-w-[140px]">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vite Heartbeat</div>
                            <div className="flex items-center justify-end gap-2 text-xl font-black text-emerald-500 tracking-tighter mt-1">
                                <Activity size={20} className="animate-pulse" />
                                165ms
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-right min-w-[140px]">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Time</div>
                            <div className="text-xl font-black text-white tracking-tighter mt-1">{currentTime}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Environment Status */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6 border-slate-800">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                            <Globe size={14} className="text-indigo-500" /> Environment Gateway
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 group hover:border-indigo-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                                        <Box size={24} />
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                        Online
                                    </div>
                                </div>
                                <h4 className="text-white font-black tracking-tight mb-1">ALPHA VAULT PREVIEW</h4>
                                <p className="text-slate-500 text-xs font-bold font-mono">http://localhost:5176</p>
                            </div>

                            <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 group hover:border-amber-500/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                                        <Layers size={24} />
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                        Synchronized
                                    </div>
                                </div>
                                <h4 className="text-white font-black tracking-tight mb-1">DIGITAL HEADQUARTERS</h4>
                                <p className="text-slate-500 text-xs font-bold font-mono">http://localhost:5191</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Development Tools</h4>
                                <div className="flex gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-tighter">
                                <span className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-400 border border-slate-700/50">Vite 7.0.3</span>
                                <span className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-400 border border-slate-700/50">Tailwind v4</span>
                                <span className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-400 border border-slate-700/50">React 19</span>
                                <span className="px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-400 border border-slate-700/50">TypeScript 5</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Health */}
                <div className="glass-card p-6 border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <Cpu size={14} className="text-amber-500" /> Module Integrity
                    </h3>
                    <div className="space-y-3">
                        {modules.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-2xl border border-slate-800 bg-slate-900/30 group hover:border-slate-700 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${m.name === 'Builder' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500/50'}`} />
                                    <span className="text-xs font-bold text-slate-300">{m.name}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${m.color} bg-white/5 px-2 py-0.5 rounded border border-white/5`}>
                                    {m.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <div className="flex items-center gap-3 text-indigo-400">
                            <Zap size={18} />
                            <div className="text-[10px] font-black uppercase tracking-widest">HMR STATUS: OPTIMIZED</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImplementationForge;
