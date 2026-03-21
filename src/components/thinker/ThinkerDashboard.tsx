import React, { useState } from 'react';
import { Brain, FileText, TrendingUp, RefreshCw, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const THINKER_API = 'http://localhost:4001';

interface ThinkerDashboardProps { }

const ThinkerDashboard: React.FC<ThinkerDashboardProps> = () => {
    const { notify } = useNotification();
    const [brief, setBrief] = useState<string | null>(null);
    const [briefLoading, setBriefLoading] = useState(false);
    const [deliberation, setDeliberation] = useState<any>(null);
    const [deliberationLoading, setDeliberationLoading] = useState(false);
    const [symbol, setSymbol] = useState('');
    const [thinkerStatus, setThinkerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Check Thinker status on mount
    React.useEffect(() => {
        checkThinkerStatus();
    }, []);

    const checkThinkerStatus = async () => {
        setThinkerStatus('checking');
        try {
            const res = await fetch(`${THINKER_API}/api/status`);
            if (res.ok) {
                setThinkerStatus('online');
            } else {
                setThinkerStatus('offline');
            }
        } catch {
            setThinkerStatus('offline');
        }
    };

    const fetchDailyBrief = async () => {
        setBriefLoading(true);
        try {
            const res = await fetch(`${THINKER_API}/api/brief`);
            const data = await res.json();
            if (data.status === 'success') {
                setBrief(data.brief);
                notify.success('Daily Brief generated!');
            } else {
                notify.error('Failed to generate brief');
            }
        } catch (err: any) {
            notify.error(`Thinker error: ${err.message}`);
        } finally {
            setBriefLoading(false);
        }
    };

    const runDeliberation = async () => {
        if (!symbol.trim()) {
            notify.warning('Please enter a symbol');
            return;
        }
        setDeliberationLoading(true);
        try {
            const res = await fetch(`${THINKER_API}/api/deliberate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: symbol.toUpperCase() })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setDeliberation(data);
                notify.success(`Deliberation complete for ${symbol.toUpperCase()}`);
            } else {
                notify.error('Deliberation failed');
            }
        } catch (err: any) {
            notify.error(`Deliberation error: ${err.message}`);
        } finally {
            setDeliberationLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-xl text-purple-500 shadow-sm">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thinker AI</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered market analysis and deliberation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${thinkerStatus === 'online'
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : thinkerStatus === 'offline'
                                ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                            {thinkerStatus === 'online' ? <CheckCircle size={14} /> :
                                thinkerStatus === 'offline' ? <AlertCircle size={14} /> :
                                    <Loader2 size={14} className="animate-spin" />}
                            {thinkerStatus === 'online' ? 'Thinker Online' :
                                thinkerStatus === 'offline' ? 'Thinker Offline' : 'Checking...'}
                        </div>
                        <button
                            onClick={checkThinkerStatus}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                            title="Refresh Status"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Brief Panel */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText size={20} className="text-indigo-500" />
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Daily Brief</h2>
                        </div>
                        <button
                            onClick={fetchDailyBrief}
                            disabled={briefLoading || thinkerStatus === 'offline'}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            {briefLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            {briefLoading ? 'Generating...' : 'Generate Brief'}
                        </button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 min-h-[300px] max-h-[500px] overflow-auto">
                        {brief ? (() => {
                            // Parse the brief to extract sections
                            const lines = brief.split('\n');
                            let date = '';
                            let btcPrice = '', btcDom = '', usdtDom = '', fearGreed = '';
                            let dbStats = '';
                            let aiAnalysis = '';
                            let inAiSection = false;

                            // New sections
                            let lpInRange = 0, lpOutOfRange = 0;
                            let topGainers: { symbol: string; change: string }[] = [];
                            let topLosers: { symbol: string; change: string }[] = [];
                            let lthSOPR = '', sthSOPR = '', lthStatus = '', sthStatus = '';
                            let inLpSection = false, inMoversSection = false, inOnChainSection = false;

                            lines.forEach(line => {
                                // Date parsing
                                if (line.includes('**') && (line.includes('January') || line.includes('February') || line.includes('March') || line.includes('April') || line.includes('May') || line.includes('June') || line.includes('July') || line.includes('August') || line.includes('September') || line.includes('October') || line.includes('November') || line.includes('December'))) {
                                    date = line.replace(/\*\*/g, '').trim();
                                }

                                // Market snapshot
                                if (line.includes('BTC Price') && line.includes('|')) {
                                    const match = line.match(/\|\s*([0-9.,]+)\s*\|/);
                                    if (match) btcPrice = match[1];
                                }
                                if (line.includes('BTC Dominance') && !line.includes('USDT') && line.includes('|')) {
                                    // Match: | BTC Dominance | VALUE | TIME |
                                    const parts = line.split('|').map(p => p.trim());
                                    if (parts.length >= 3 && parts[2]) {
                                        btcDom = parts[2]; // Get the value column directly
                                    }
                                }
                                if (line.includes('USDT Dominance') && line.includes('|')) {
                                    const match = line.match(/\|\s*([A-Z0-9._]+)\s*\|/);
                                    if (match) usdtDom = match[1];
                                }
                                if (line.includes('Fear') && line.includes('Greed') && line.includes('|')) {
                                    const match = line.match(/\|\s*([0-9]+)\s*\|/);
                                    if (match) fearGreed = match[1];
                                }
                                if (line.includes('Database Stats')) {
                                    dbStats = line.replace(/\*\*/g, '').replace('Database Stats:', '').trim();
                                }

                                // LP Positions section
                                if (line.includes('LP POSITIONS')) {
                                    inLpSection = true;
                                }
                                if (inLpSection) {
                                    if (line.includes('In Range')) {
                                        const match = line.match(/\|\s*(\d+)\s*\|/);
                                        if (match) lpInRange = parseInt(match[1]);
                                    }
                                    if (line.includes('Out of Range')) {
                                        const match = line.match(/\|\s*(\d+)\s*\|/);
                                        if (match) lpOutOfRange = parseInt(match[1]);
                                    }
                                    if (line.includes('TOP MOVERS') || line.includes('ON-CHAIN') || line.includes('AI ANALYSIS')) {
                                        inLpSection = false;
                                    }
                                }

                                // Top Movers section
                                if (line.includes('TOP MOVERS')) {
                                    inMoversSection = true;
                                }
                                if (inMoversSection) {
                                    const gainerMatch = line.match(/\*\*(\w+)\*\*:\s*\+([0-9.]+)%/);
                                    if (gainerMatch) {
                                        topGainers.push({ symbol: gainerMatch[1], change: `+${gainerMatch[2]}%` });
                                    }
                                    const loserMatch = line.match(/\*\*(\w+)\*\*:\s*-([0-9.]+)%/);
                                    if (loserMatch) {
                                        topLosers.push({ symbol: loserMatch[1], change: `-${loserMatch[2]}%` });
                                    }
                                    if (line.includes('ON-CHAIN') || line.includes('AI ANALYSIS')) {
                                        inMoversSection = false;
                                    }
                                }

                                // BTC On-Chain section
                                if (line.includes('ON-CHAIN')) {
                                    inOnChainSection = true;
                                }
                                if (inOnChainSection) {
                                    if (line.includes('Long-Term')) {
                                        const match = line.match(/\|\s*([0-9.]+)\s*\|\s*(\w+)\s*\|/);
                                        if (match) {
                                            lthSOPR = match[1];
                                            lthStatus = match[2];
                                        }
                                    }
                                    if (line.includes('Short-Term')) {
                                        const match = line.match(/\|\s*([0-9.]+)\s*\|\s*(\w+)\s*\|/);
                                        if (match) {
                                            sthSOPR = match[1];
                                            sthStatus = match[2];
                                        }
                                    }
                                    if (line.includes('AI ANALYSIS')) {
                                        inOnChainSection = false;
                                    }
                                }

                                // AI Analysis section
                                if (line.includes('AI ANALYSIS')) {
                                    inAiSection = true;
                                }
                                if (inAiSection && !line.includes('AI ANALYSIS') && !line.startsWith('#') && !line.startsWith('---') && !line.includes('Generated by')) {
                                    aiAnalysis += line.replace(/\*\*/g, '').replace(/>/g, '').trim() + ' ';
                                }
                            });

                            const fearValue = parseInt(fearGreed) || 50;
                            const fearLabel = fearValue <= 20 ? 'Extreme Fear' : fearValue <= 40 ? 'Fear' : fearValue <= 60 ? 'Neutral' : fearValue <= 80 ? 'Greed' : 'Extreme Greed';
                            const fearColor = fearValue <= 25 ? 'text-rose-500' : fearValue <= 45 ? 'text-orange-500' : fearValue <= 55 ? 'text-slate-500' : fearValue <= 75 ? 'text-lime-500' : 'text-emerald-500';

                            const hasLpData = lpInRange > 0 || lpOutOfRange > 0;
                            const hasMovers = topGainers.length > 0 || topLosers.length > 0;
                            const hasOnChain = lthSOPR || sthSOPR;

                            return (
                                <div className="space-y-4">
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">📰</span>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-slate-200">Market Brief</div>
                                                <div className="text-xs text-slate-500">{date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                            </div>
                                        </div>
                                        {dbStats && <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{dbStats}</div>}
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* BTC Price */}
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl p-3 border border-orange-200 dark:border-orange-800/30">
                                            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">₿ BTC Price</div>
                                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                ${btcPrice ? Number(btcPrice.replace(/,/g, '')).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>

                                        {/* Fear & Greed */}
                                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                            <div className="text-xs text-slate-500 font-medium">😱 Fear & Greed</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-lg font-bold ${fearColor}`}>{fearGreed || 'N/A'}</span>
                                                <span className="text-xs text-slate-400">{fearLabel}</span>
                                            </div>
                                        </div>

                                        {/* BTC Dominance */}
                                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800/30">
                                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">📊 BTC Dominance</div>
                                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                {btcDom ? `${parseFloat(btcDom).toFixed(1)}%` : 'N/A'}
                                            </div>
                                        </div>

                                        {/* USDT Dominance */}
                                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800/30">
                                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">💵 USDT Dominance</div>
                                            <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                                {usdtDom && usdtDom !== 'VIEWPORT_FALLBACK' ? usdtDom : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* LP Status Card */}
                                    {hasLpData && (
                                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-cyan-600">🎯</span>
                                                <span className="font-bold text-cyan-700 dark:text-cyan-400 text-sm">LP Positions</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-500 text-lg">✅</span>
                                                    <span className="text-slate-700 dark:text-slate-300 text-sm"><strong>{lpInRange}</strong> in range</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-rose-500 text-lg">❌</span>
                                                    <span className="text-slate-700 dark:text-slate-300 text-sm"><strong>{lpOutOfRange}</strong> out of range</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Movers Card */}
                                    {hasMovers && (
                                        <div className="bg-gradient-to-r from-lime-50 to-rose-50 dark:from-lime-900/10 dark:to-rose-900/10 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span>📈</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">Top Movers (24h)</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {topGainers.length > 0 && (
                                                    <div>
                                                        <div className="text-xs text-emerald-600 font-medium mb-1">🟢 Gainers</div>
                                                        {topGainers.map((g, i) => (
                                                            <div key={i} className="text-sm text-slate-700 dark:text-slate-300">
                                                                <strong>{g.symbol}</strong> <span className="text-emerald-500">{g.change}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {topLosers.length > 0 && (
                                                    <div>
                                                        <div className="text-xs text-rose-600 font-medium mb-1">🔴 Losers</div>
                                                        {topLosers.map((l, i) => (
                                                            <div key={i} className="text-sm text-slate-700 dark:text-slate-300">
                                                                <strong>{l.symbol}</strong> <span className="text-rose-500">{l.change}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* BTC On-Chain Card */}
                                    {hasOnChain && (
                                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span>⛓️</span>
                                                <span className="font-bold text-yellow-700 dark:text-yellow-400 text-sm">BTC On-Chain (SOPR)</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <div className="text-xs text-slate-500">🐋 Long-Term Holders</div>
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">
                                                        {lthSOPR} <span className={lthStatus === 'Profit' ? 'text-emerald-500' : lthStatus === 'Loss' ? 'text-rose-500' : 'text-slate-400'}>({lthStatus})</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500">🐟 Short-Term Holders</div>
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">
                                                        {sthSOPR} <span className={sthStatus === 'Profit' ? 'text-emerald-500' : sthStatus === 'Loss' ? 'text-rose-500' : 'text-slate-400'}>({sthStatus})</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-slate-400 mt-2">SOPR &gt; 1 = Selling at profit | SOPR &lt; 1 = Selling at loss</div>
                                        </div>
                                    )}

                                    {/* AI Analysis */}
                                    {aiAnalysis.trim() && (
                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-4 border border-purple-200 dark:border-purple-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-purple-600">💡</span>
                                                <span className="font-bold text-purple-700 dark:text-purple-400 text-sm">AI Analysis</span>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {aiAnalysis.trim()}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        Generated by Thinker Intelligence Hub
                                    </div>
                                </div>
                            );
                        })()
                            : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                    <FileText size={32} />
                                    <p className="text-sm">Click "Generate Brief" to get your daily market summary</p>
                                </div>
                            )}
                    </div>
                </div>

                {/* Deliberation Panel */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={20} className="text-purple-500" />
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Bull/Bear Deliberation</h2>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="Enter symbol (e.g., BTC, ETH)"
                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onKeyDown={(e) => e.key === 'Enter' && runDeliberation()}
                        />
                        <button
                            onClick={runDeliberation}
                            disabled={deliberationLoading || thinkerStatus === 'offline'}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
                        >
                            {deliberationLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                            {deliberationLoading ? 'Analyzing...' : 'Deliberate'}
                        </button>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 min-h-[260px] max-h-[500px] overflow-auto">
                        {deliberation ? (() => {
                            // Extract data from nested synthesis object
                            const synthesis = deliberation.synthesis || {};
                            let verdict = synthesis.verdict || 'N/A';
                            let confidence = synthesis.confidence || 0;
                            let keyPoints: string[] = [];
                            let risks: string[] = [];
                            let actionItems: string[] = [];
                            let timeHorizon = '';
                            let reasoningText = '';

                            // Try to parse the reasoning JSON string if present
                            if (synthesis.reasoning && typeof synthesis.reasoning === 'string') {
                                try {
                                    // Remove markdown code block if present
                                    let cleanJson = synthesis.reasoning
                                        .replace(/```json\n?/g, '')
                                        .replace(/\n?```/g, '')
                                        .trim();

                                    // Try to extract just the JSON object if there's extra text
                                    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
                                    if (jsonMatch) {
                                        const parsed = JSON.parse(jsonMatch[0]);
                                        verdict = parsed.verdict || verdict;
                                        confidence = parsed.confidence || confidence;
                                        keyPoints = parsed.keyPoints || [];
                                        risks = parsed.risks || [];
                                        actionItems = parsed.actionItems || [];
                                        timeHorizon = parsed.timeHorizon || '';
                                        reasoningText = parsed.reasoning || '';
                                    }
                                } catch {
                                    // If parsing fails, show raw but truncated
                                    reasoningText = synthesis.reasoning.substring(0, 300) + '...';
                                }
                            }

                            const isBullish = verdict?.toLowerCase().includes('bull');
                            const isBearish = verdict?.toLowerCase().includes('bear');

                            return (
                                <div className="space-y-4">
                                    {/* Verdict Banner */}
                                    <div className={`p-4 rounded-xl flex items-center justify-between ${isBullish
                                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30'
                                        : isBearish
                                            ? 'bg-gradient-to-r from-rose-500/20 to-rose-600/10 border border-rose-500/30'
                                            : 'bg-gradient-to-r from-slate-500/20 to-slate-600/10 border border-slate-500/30'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {isBullish ? '🐂' : isBearish ? '🐻' : '⚖️'}
                                            </span>
                                            <div>
                                                <div className={`text-lg font-bold ${isBullish ? 'text-emerald-600 dark:text-emerald-400'
                                                    : isBearish ? 'text-rose-600 dark:text-rose-400'
                                                        : 'text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                    {verdict}
                                                </div>
                                                {timeHorizon && (
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                        {timeHorizon}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {confidence > 0 && (
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                                    {Math.round(confidence * 100)}%
                                                </div>
                                                <div className="text-xs text-slate-500">confidence</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Key Points */}
                                    {keyPoints.length > 0 && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-emerald-600">📈</span>
                                                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Key Bullish Points</span>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {keyPoints.map((point: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                        <span className="text-emerald-500 mt-0.5">•</span>
                                                        <span>{point}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Risks */}
                                    {risks.length > 0 && (
                                        <div className="bg-rose-50 dark:bg-rose-900/10 rounded-lg p-3 border border-rose-200 dark:border-rose-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-rose-600">⚠️</span>
                                                <span className="font-bold text-rose-700 dark:text-rose-400 text-sm">Key Risks</span>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {risks.map((risk: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                        <span className="text-rose-500 mt-0.5">•</span>
                                                        <span>{risk}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action Items */}
                                    {actionItems.length > 0 && (
                                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-indigo-600">💡</span>
                                                <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm">Action Items</span>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {actionItems.map((action: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                        <span className="text-indigo-500 mt-0.5">→</span>
                                                        <span>{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Reasoning Summary */}
                                    {reasoningText && (
                                        <div className="text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-200 dark:border-slate-700 pt-3">
                                            💭 {reasoningText}
                                        </div>
                                    )}

                                    {/* Full Agent Debate - Collapsible Sections */}
                                    {deliberation.agents && (
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                                📜 Full Debate Analysis
                                            </div>

                                            {/* Bull Case */}
                                            {deliberation.agents.bull && (
                                                <details className="mb-3 group">
                                                    <summary className="cursor-pointer bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2">
                                                        <span>🐂</span>
                                                        <span>Bull Case Analysis</span>
                                                        <span className="ml-auto text-xs opacity-60">Click to expand</span>
                                                    </summary>
                                                    <div className="mt-2 p-3 bg-emerald-50/50 dark:bg-emerald-900/5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30">
                                                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                            {deliberation.agents.bull}
                                                        </div>
                                                    </div>
                                                </details>
                                            )}

                                            {/* Bear Case */}
                                            {deliberation.agents.bear && (
                                                <details className="mb-3 group">
                                                    <summary className="cursor-pointer bg-rose-50 dark:bg-rose-900/10 px-3 py-2 rounded-lg text-sm font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2">
                                                        <span>🐻</span>
                                                        <span>Bear Case Analysis</span>
                                                        <span className="ml-auto text-xs opacity-60">Click to expand</span>
                                                    </summary>
                                                    <div className="mt-2 p-3 bg-rose-50/50 dark:bg-rose-900/5 rounded-lg border border-rose-200/50 dark:border-rose-800/30">
                                                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                            {deliberation.agents.bear}
                                                        </div>
                                                    </div>
                                                </details>
                                            )}

                                            {/* DeFi Analysis */}
                                            {deliberation.agents.defi && (
                                                <details className="mb-3 group">
                                                    <summary className="cursor-pointer bg-blue-50 dark:bg-blue-900/10 px-3 py-2 rounded-lg text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2">
                                                        <span>📊</span>
                                                        <span>DeFi/On-Chain Analysis</span>
                                                        <span className="ml-auto text-xs opacity-60">Click to expand</span>
                                                    </summary>
                                                    <div className="mt-2 p-3 bg-blue-50/50 dark:bg-blue-900/5 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                                                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                            {deliberation.agents.defi}
                                                        </div>
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })() : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                <Brain size={32} />
                                <p className="text-sm">Enter a symbol and click "Deliberate" for AI analysis</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            {thinkerStatus === 'offline' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-indigo-600 dark:text-indigo-500 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-indigo-800 dark:text-indigo-400">Thinker Service Offline</h3>
                            <p className="text-sm text-indigo-700 dark:text-indigo-500 mt-1">
                                Start the Thinker service to enable AI analysis:
                            </p>
                            <code className="block mt-2 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-xs font-mono text-indigo-800 dark:text-indigo-300">
                                cd thinker && npm start
                            </code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ThinkerDashboard;
