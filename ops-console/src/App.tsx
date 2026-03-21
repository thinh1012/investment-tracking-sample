import React, { useState } from 'react';
import {
    Shield,
    Terminal,
    Layout,
    FileText,
    Brain,
    Search,
    ClipboardCheck,
    Database,
    Menu,
    X,
    Activity
} from 'lucide-react';
import Dashboard from './modules/executive-manager/Dashboard';
import { VaultDatabaseExplorer } from './modules/accountant/VaultExplorer';
import ScoutHub from './modules/scout/ScoutHub';
import ReviewerModule from './modules/critic/CodeHealth';
import MoMTaker from './modules/mom-taker/Logs';
import ImplementationForge from './modules/builder/ImplementationForge';
import StrategistIntel from './modules/strategist/StrategistIntel';
import SystemsBlueprint from './modules/architect/SystemsBlueprint';

const AGENTS = [
    { id: 'executive-manager', name: 'EXECUTIVE MANAGER', role: 'HQ Dashboard', icon: Layout, color: 'text-indigo-500' },
    { id: 'architect', name: 'ARCHITECT', role: 'System Design', icon: Shield, color: 'text-emerald-500' },
    { id: 'builder', name: 'BUILDER', role: 'Implementation', icon: Terminal, color: 'text-amber-500' },
    { id: 'mom-taker', name: 'MOM TAKER', role: 'Project Ledger', icon: FileText, color: 'text-slate-400' },
    { id: 'strategist', name: 'STRATEGIST', role: 'Market Intel', icon: Brain, color: 'text-rose-500' },
    { id: 'scout', name: 'SCOUT', role: 'Data Harvesting', icon: Search, color: 'text-cyan-500' },
    { id: 'critic', name: 'CRITIC', role: 'Verification & QA', icon: ClipboardCheck, color: 'text-orange-500' },
    { id: 'accountant', name: 'ACCOUNTANT', role: 'Data Guard', icon: Database, color: 'text-purple-500' }
];

const App: React.FC = () => {
    const [activeAgent, setActiveAgent] = useState('executive-manager');

    const renderContent = () => {
        const agent = AGENTS.find(a => a.id === activeAgent);

        switch (activeAgent) {
            case 'executive-manager': return <Dashboard onNavigate={setActiveAgent} />;
            case 'accountant': return <VaultDatabaseExplorer />;
            case 'scout': return <ScoutHub />;
            case 'critic': return <ReviewerModule />;
            case 'mom-taker': return <MoMTaker />;
            case 'builder': return <ImplementationForge />;
            case 'strategist': return <StrategistIntel />;
            case 'architect': return <SystemsBlueprint />;
            default: return (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl">
                    <div className="text-center">
                        <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-800 shadow-2xl">
                            {agent && React.createElement(agent.icon, { size: 32, className: "text-slate-500" })}
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Module Initializing...</h3>
                        <p className="text-slate-500 text-sm max-w-sm">The Builder is currently assembling the {activeAgent} control panel.</p>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="stable-shell bg-slate-950 text-slate-100">
            {/* Sidebar */}
            <aside className="stable-sidebar bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50 flex flex-col z-20">
                <div className="p-6 border-b border-slate-800/50">
                    <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
                        <Shield className="text-indigo-500" size={24} />
                        <span className="text-gradient">DIGITAL HQ</span>
                    </h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Alpha Vault Operations</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {AGENTS.map((agent) => (
                        <button
                            key={agent.id}
                            onClick={() => setActiveAgent(agent.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group flex-shrink-0 ${activeAgent === agent.id
                                ? 'mesh-gradient text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            <agent.icon size={20} className={activeAgent === agent.id ? agent.color : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                            <div className="text-left overflow-hidden">
                                <div className="text-xs font-black tracking-wide leading-none truncate">{agent.name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">{agent.role}</div>
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Vault Status</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            VAULT PORT 5176 LIVE
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 relative">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-xl z-10">
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-white uppercase italic">
                            {AGENTS.find(a => a.id === activeAgent)?.name} Console
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Ready for Mission Parameters</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-slate-500 tracking-tighter">
                            V1.1.0-SYNCHRONIZED
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto h-full">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
