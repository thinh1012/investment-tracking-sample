import React from 'react';
import {
    Shield,
    Terminal,
    Brain,
    Search,
    ClipboardCheck,
    Database,
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { formatICTTime } from '../../utils/time';

interface DashboardProps {
    onNavigate: (module: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const stats = [
        { label: 'System Health', value: 'OPTIMAL', icon: Activity, color: 'text-emerald-500' },
        { label: 'Agents Online', value: '8/8', icon: Shield, color: 'text-indigo-500' },
        { label: 'Intelligence Depth', value: 'High', icon: Brain, color: 'text-rose-500' },
        { label: 'Last Sync', value: '2m ago', icon: Clock, color: 'text-slate-400' }
    ];

    const agents = [
        { name: 'Strategist', status: 'Ready', task: 'Monitoring Yields', health: 100 },
        { name: 'Data Scout', status: 'Active', task: 'Harvesting Stables', health: 98 },
        { name: 'Code Reviewer', status: 'Ready', task: 'No Debt Found', health: 100 },
        { name: 'Accountant', status: 'Standby', task: 'Vault Audited', health: 100 }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Header */}
            <div className="mesh-gradient rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-emerald-500/10">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black tracking-tighter text-white mb-2 uppercase italic font-heading">Digital Headquarters Activated</h1>
                    <p className="text-emerald-50/80 max-w-xl font-medium">Welcome, Commander. All 8 agents are synchronized. The engine room is operating at peak efficiency.</p>
                </div>
                <Activity className="absolute right-[-20px] top-[-20px] text-white/10 w-64 h-64 -rotate-12" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <stat.icon size={20} className={stat.color} />
                            <div className="w-8 h-1 bg-slate-800 rounded-full" />
                        </div>
                        <div className="text-2xl font-black text-white font-heading">{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Agent Status Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Squad Readiness</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-full">ALL SYSTEMS NOMINAL</span>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {agents.map((agent, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <div>
                                        <div className="text-sm font-black text-white tracking-tight">{agent.name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{agent.task}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-300">{agent.status}</div>
                                    <div className="w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${agent.health}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Mission Feed */}
                <div className="glass-card p-6 flex flex-col">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 font-heading">Live Mission Feed</h3>
                    <div className="flex-1 space-y-4">
                        {[
                            { time: formatICTTime(Date.now() - 1000 * 60 * 5), agent: 'SCOUT', log: 'Stablecoin liquidity harvest completed on Port 5176' },
                            { time: formatICTTime(Date.now() - 1000 * 60 * 15), agent: 'REVIEWER', log: 'No security vulnerabilities detected in electron/main.js' },
                            { time: formatICTTime(Date.now() - 1000 * 60 * 60), agent: 'ARCHITECT', log: 'Digital HQ initialized on independent port 5188' }
                        ].map((log, i) => (
                            <div key={i} className="flex gap-4 items-start opacity-100 transition-opacity">
                                <span className="text-[10px] font-mono text-slate-500 mt-1">{log.time}</span>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-indigo-400 mb-0.5">[{log.agent}]</div>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{log.log}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => onNavigate('mom-taker')}
                        className="mt-6 w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-[10px] font-black rounded-xl border border-slate-700 transition-all uppercase tracking-widest"
                    >
                        View Full Log Command
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
