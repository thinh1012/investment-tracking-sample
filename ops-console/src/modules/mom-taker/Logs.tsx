import * as React from 'react';
import { FileText, Clock, ChevronDown, ChevronUp, History, Filter } from 'lucide-react';
import { formatICTTime, formatICTDate } from '../../utils/time';

const MoMTaker: React.FC = () => {
    const [logs, setLogs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [debugInfo, setDebugInfo] = React.useState<string>('');

    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                let rawMarkdown = '';

                // @ts-ignore
                if (typeof window.electronAPI !== 'undefined' && window.electronAPI.projectLedger) {
                    console.log("[LEDGER] Fetching via Electron IPC...");
                    // @ts-ignore
                    rawMarkdown = await window.electronAPI.projectLedger.getLogs();
                } else {
                    console.log("[LEDGER] Fetching via Web Native Bridge...");
                    const response = await fetch('/api/ledger/task.md');
                    if (response.ok) {
                        rawMarkdown = await response.text();
                    } else {
                        throw new Error(`Web Bridge Error: ${response.status} ${response.statusText}`);
                    }
                }

                setDebugInfo(`Fetch result type: ${typeof rawMarkdown}, Length: ${rawMarkdown?.length}`);

                if (rawMarkdown) {
                    const parsed = parseMarkdownLogs(rawMarkdown);
                    setLogs(parsed);
                } else {
                    setError("No data received from Project Ledger (File Read Error?)");
                }
            } catch (e: any) {
                console.error("Failed to fetch logs", e);
                setError(e.message || "Unknown error during fetch");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const parseMarkdownLogs = (md: string) => {
        const lines = md.split('\n');
        const sessions: any[] = [];
        let currentSession: any = null;

        lines.forEach(line => {
            // New Phase/Session Detection
            if (line.trim().startsWith('- [x] **Phase') || line.trim().startsWith('- [x] **Digital HQ')) {
                if (currentSession) sessions.push(currentSession);

                // Extract Title
                const titleMatch = line.match(/\*\*(.*?)\*\*/);
                const title = titleMatch ? titleMatch[1] : 'Mission Log';

                // Extract Date if present, else default
                const dateMatch = line.match(/\((.*?)\)/);
                const dateRaw = dateMatch ? dateMatch[1] : formatICTDate();

                currentSession = {
                    date: dateRaw,
                    time: formatICTTime(), // Dynamic capture time for current view
                    objective: title,
                    details: []
                };
            }
            // Detail Detection
            else if (line.trim().startsWith('- [x]') && currentSession) {
                // Clean up the line
                const clean = line.replace('- [x]', '').replace(/\*\*(.*?)\*\*:/, '').trim();
                // Remove ID comments
                const final = clean.replace(/<!--.*?-->/, '').trim();
                if (final) currentSession.details.push(final);
            }
        });

        if (currentSession) sessions.push(currentSession);
        return sessions.reverse(); // Show newest first
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-top duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">Project Ledger [MoM]</h2>
                    <p className="text-slate-500 text-xs font-bold tracking-widest uppercase italic font-heading">Documentation & Memory Interface</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
                        <Filter size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 mesh-gradient text-white rounded-xl text-[10px] font-black transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest">
                        <History size={14} /> Memory Archive
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {error ? (
                    <div className="glass-card p-6 border-red-500/50 bg-red-500/10 mb-6">
                        <div className="flex items-center gap-3 text-red-400 mb-2">
                            <FileText size={20} />
                            <h3 className="font-black uppercase tracking-widest text-sm">Connection Terminated</h3>
                        </div>
                        <p className="text-xs text-red-300/80 font-mono mb-4">{error}</p>
                        <div className="text-[10px] text-slate-500 font-mono border-t border-dashed border-red-500/20 pt-2">
                            Debug Trace: {debugInfo}
                        </div>
                    </div>
                ) : null}

                {loading ? (
                    <div className="p-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Synchronizing Ledger...
                    </div>
                ) : logs.map((session, i) => (
                    <div key={i} className="glass-card overflow-hidden">
                        {/* Session Header */}
                        <div className="p-6 border-b border-slate-800 bg-slate-800/10 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400 border border-slate-700">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase italic font-heading">{session.objective}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{session.date} • {session.time} ICT</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/10">
                                COMMITTED
                            </span>
                        </div>

                        {/* Session Details */}
                        <div className="p-6">
                            <ul className="space-y-4">
                                {session.details.map((detail: string, j: number) => (
                                    <li key={j} className="flex gap-4 items-start group">
                                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500/30 group-hover:bg-blue-500 transition-colors" />
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                                            {detail}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* Live Feed Warning */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                <FileText className="text-slate-500" size={24} />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                    This module provides a synchronized projection of the <span className="text-emerald-500">task.md</span> ledger.
                    Historical depth is optimized for session-level accountability.
                </p>
            </div>
        </div>
    );
};

export default MoMTaker;
