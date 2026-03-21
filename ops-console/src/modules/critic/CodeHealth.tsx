import React, { useState, useEffect } from 'react';
import { ClipboardCheck, FileText, AlertTriangle, Code, Trash2, ShieldAlert, Clock, RefreshCw, Settings, Mail, X, Check } from 'lucide-react';
import emailjs from '@emailjs/browser';

const ReviewerModule: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScanned, setLastScanned] = useState<string | null>(() => localStorage.getItem('critic:lastScanned'));
    const [healthScore, setHealthScore] = useState(() => {
        const saved = localStorage.getItem('critic:healthScore');
        return saved ? parseInt(saved, 10) : 100;
    });
    const [totalLines, setTotalLines] = useState(() => localStorage.getItem('critic:totalLines') || '0');
    const [totalTodos, setTotalTodos] = useState(() => parseInt(localStorage.getItem('critic:totalTodos') || '0', 10));
    const [offenders, setOffenders] = useState<any[]>(() => {
        const saved = localStorage.getItem('critic:offenders');
        return saved ? JSON.parse(saved) : [];
    });
    const [nextScanTime, setNextScanTime] = useState('23:30 Today');

    // Email Config State
    const [showEmailSettings, setShowEmailSettings] = useState(false);
    const [emailConfig, setEmailConfig] = useState(() => {
        const saved = localStorage.getItem('critic:emailConfig');
        return saved ? JSON.parse(saved) : { serviceId: '', templateId: '', publicKey: '' };
    });
    const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    // Persistence Effect
    useEffect(() => {
        localStorage.setItem('critic:healthScore', healthScore.toString());
        localStorage.setItem('critic:totalLines', totalLines);
        localStorage.setItem('critic:totalTodos', totalTodos.toString());
        localStorage.setItem('critic:offenders', JSON.stringify(offenders));
        localStorage.setItem('critic:emailConfig', JSON.stringify(emailConfig));
        if (lastScanned) localStorage.setItem('critic:lastScanned', lastScanned);
    }, [healthScore, lastScanned, totalLines, totalTodos, offenders, emailConfig]);

    // Initial Scan Trigger (Auto-Correcting for Zero-Fluke)
    useEffect(() => {
        if (totalLines === '0' && !isScanning && !error) {
            console.log("[CRITIC] Initializing First Authentic Audit...");
            handleScan();
        }
    }, []);

    // Scheduler Logic
    useEffect(() => {
        const checkSchedule = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            // Check for 11:30 PM trigger
            if (hours === 23 && minutes === 30 && !isScanning) {
                console.log("[CRITIC] Auto-Scan Triggered (11:30 PM)");
                handleScan();
            }

            // Update Next Scan Label
            if (hours > 23 || (hours === 23 && minutes > 30)) {
                setNextScanTime('23:30 Tomorrow');
            } else {
                setNextScanTime('23:30 Tonight');
            }
        };

        const timer = setInterval(checkSchedule, 60000); // Check every minute
        checkSchedule(); // Initial check

        return () => clearInterval(timer);
    }, [isScanning]);

    const handleScan = async () => {
        if (isScanning) return;
        setIsScanning(true);
        setError(null);

        try {
            // [DATA_COURIER] Note: Verifying delivery from audit bridge
            const response = await fetch('/api/audit/health');
            const result = await response.json();

            if (result.error) {
                setError(result.error);
                return;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setLastScanned(timeStr);
            setHealthScore(Math.round(result.healthScore));
            setTotalLines(result.totalLines);
            setTotalTodos(result.totalTodos);
            setOffenders(result.offenders);

            // Auto-Alert Logic (Example threshold)
            if (result.healthScore < 50 && emailConfig.serviceId) {
                sendEmailAlert(result.healthScore, "Health Critical! Auto-Scan Detected Degradation.");
            }

        } catch (err: any) {
            console.error('[CRITIC] Audit Failed:', err);
            setError("Bridge connection failed. Is the dev server running?");
        } finally {
            setIsScanning(false);
        }
    };

    const sendEmailAlert = async (score: number, message: string = "Manual Test Alert") => {
        if (!emailConfig.serviceId || !emailConfig.templateId || !emailConfig.publicKey) {
            setShowEmailSettings(true);
            return;
        }

        setEmailStatus('sending');
        try {
            console.log("[CRITIC] 📧 Sending Email via EmailJS...", emailConfig);

            // Template Params (Must match what user puts in EmailJS template)
            const templateParams = {
                health_score: score + '%',
                message: message,
                scan_time: new Date().toLocaleString(),
                total_lines: totalLines,
                total_todos: totalTodos
            };

            await emailjs.send(
                emailConfig.serviceId,
                emailConfig.templateId,
                templateParams,
                emailConfig.publicKey
            );

            console.log("[CRITIC] ✅ Email Sent Successfully!");
            setEmailStatus('success');
            setTimeout(() => setEmailStatus('idle'), 3000);
        } catch (err) {
            console.error("[CRITIC] ❌ Email Failed:", err);
            setEmailStatus('error');
            alert("Email Failed: " + JSON.stringify(err));
            setTimeout(() => setEmailStatus('idle'), 5000);
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right duration-500 relative">

            {/* Email Config Modal */}
            {showEmailSettings && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowEmailSettings(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                            <Mail className="text-indigo-500" /> Email Alert Setup
                        </h3>
                        <p className="text-xs text-slate-400 mb-6 font-medium">
                            Configure EmailJS to receive Critical Health Alerts.
                            <br />Get keys at <a href="https://www.emailjs.com" target="_blank" className="text-indigo-400 hover:underline">emailjs.com</a>
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Service ID</label>
                                <input
                                    type="text"
                                    value={emailConfig.serviceId}
                                    onChange={e => setEmailConfig({ ...emailConfig, serviceId: e.target.value })}
                                    placeholder="service_xxxxx"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Template ID</label>
                                <input
                                    type="text"
                                    value={emailConfig.templateId}
                                    onChange={e => setEmailConfig({ ...emailConfig, templateId: e.target.value })}
                                    placeholder="template_xxxxx"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Public Key</label>
                                <input
                                    type="text"
                                    value={emailConfig.publicKey}
                                    onChange={e => setEmailConfig({ ...emailConfig, publicKey: e.target.value })}
                                    placeholder="user_xxxxx"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none font-mono"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setShowEmailSettings(false)}
                                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={() => setShowEmailSettings(false)}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-lg shadow-indigo-500/20"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`bg-orange-500/10 border ${error ? 'border-rose-500/50' : 'border-orange-500/20'} rounded-3xl p-8 flex justify-between items-center relative overflow-hidden`}>
                <div className="relative z-10 w-full flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-1 flex items-center gap-3">
                            Code Reviewer Status
                            {isScanning && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded animate-pulse">SCANNING...</span>}
                            {error && <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded uppercase">API ERROR</span>}
                        </h2>
                        <div className="flex items-center gap-4 text-slate-500 text-xs font-bold tracking-widest uppercase">
                            <span>System Debt & Architecture Guard</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="flex items-center gap-1.5">
                                <Clock size={12} className="text-orange-500" />
                                Next Auto-Scan: <span className="text-orange-400">{nextScanTime}</span>
                            </span>

                            <div className="ml-4 flex items-center gap-2">
                                <button
                                    onClick={() => sendEmailAlert(healthScore)}
                                    disabled={emailStatus === 'sending'}
                                    className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-2 ${emailStatus === 'success' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                                            emailStatus === 'error' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' :
                                                'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500'
                                        }`}
                                    title="Test Email Alert"
                                >
                                    {emailStatus === 'sending' ? <RefreshCw size={12} className="animate-spin" /> :
                                        emailStatus === 'success' ? <Check size={12} /> :
                                            <ShieldAlert size={12} />}

                                    {emailStatus === 'sending' ? 'Sending...' :
                                        emailStatus === 'success' ? 'Sent!' :
                                            'Test Alert'}
                                </button>
                                <button
                                    onClick={() => setShowEmailSettings(true)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
                                    title="Configure Email Settings"
                                >
                                    <Settings size={14} />
                                </button>
                            </div>

                        </div>
                        {error && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-2 opacity-80">{error}</p>}
                    </div>
                    <div className="text-right">
                        <div className={`text-4xl font-black transition-all duration-500 ${error ? 'text-rose-500' : 'text-emerald-500'}`}>{healthScore}%</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {lastScanned ? `Last Scan: ${lastScanned}` : 'Health Score'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Lines', value: totalLines, icon: Code, color: 'text-blue-500' },
                    { label: 'Unresolved TODOs', value: totalTodos.toString(), icon: FileText, color: 'text-amber-500' },
                    { label: 'Critical Bloat', value: offenders.filter(f => f.risk === 'High').length + ' Files', icon: ShieldAlert, color: 'text-rose-500' }
                ].map((stat, i) => (
                    <div key={i} className={`bg-slate-900 border ${error ? 'border-rose-900/50' : 'border-slate-800'} p-6 rounded-2xl`}>
                        <stat.icon size={20} className={`${stat.color} mb-4`} />
                        <div className="text-xl font-black text-white">{stat.value}</div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Bloat Report */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">File Bloat Report (Authentic)</h3>
                    <button
                        onClick={handleScan}
                        disabled={isScanning}
                        className={`text-[10px] font-black transition-all uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl ${isScanning
                            ? 'bg-orange-500/20 text-orange-400 cursor-wait'
                            : error
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300'}`}
                    >
                        <RefreshCw size={12} className={isScanning ? "animate-spin" : ""} />
                        {isScanning ? "Scanning Codebase..." : error ? "Try Reconnecting Hub" : "Run Decouple Audit"}
                    </button>
                </div>
                <div className="divide-y divide-slate-800">
                    {offenders.length === 0 && !isScanning && (
                        <div className="p-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                            No Significant Bloat Detected in SRC
                        </div>
                    )}
                    {offenders.map((file, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg bg-slate-800 ${file.risk === 'High' ? 'text-rose-500' : 'text-slate-400'}`}>
                                    <FileText size={16} />
                                </div>
                                <div className={isScanning ? "opacity-50 blur-[1px] transition-all duration-300" : "transition-all duration-300"}>
                                    <div className="text-sm font-black text-white tracking-tight">{file.name}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{file.lines.toLocaleString()} Lines • {file.todos} TODOs</div>
                                </div>
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-tighter ${file.risk === 'High' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                    file.risk === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                    }`}>
                                    {file.risk} Risk
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewerModule;
