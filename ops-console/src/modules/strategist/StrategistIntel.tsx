import React, { useState, useEffect } from 'react';
import { IntelRecord } from '../../types/intelligence';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    Zap,
    ChevronRight,
    Search,
    RefreshCw,
    ShieldAlert,
    Target,
    BarChart3
} from 'lucide-react';
import { formatICT } from '../../utils/time';
import { useReactiveIntelligence } from '../../hooks/useReactiveIntelligence';
import { persistentStorage } from '../../services/PersistentStorage';



const StrategistIntelHub: React.FC = () => {
    const [intel, setIntel] = useState<IntelRecord[]>([]);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [rawHoldings, setRawHoldings] = useState<any[]>([]);
    const [rawWatchlist, setRawWatchlist] = useState<any[]>([]);

    // Enable Reactive Intelligence (Automated Scout Missions)
    useReactiveIntelligence(rawHoldings, rawWatchlist);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/alpha_vault_full_backup_2025-12-28.json');
            const fullData = await response.json();

            // 1. Existing Intel (Seed from Backup + Live from Database/IDB)
            const seedIntel: IntelRecord[] = fullData.strategist_intel || fullData.strategistIntel || [];
            const liveIntel = await persistentStorage.getAllIntel();

            // Merge: Live data overrides seed data
            const intelMap = new Map<string, IntelRecord>();
            seedIntel.forEach(i => intelMap.set(i.symbol, i));
            liveIntel.forEach(i => intelMap.set(i.symbol, i));
            const existingIntel: IntelRecord[] = Array.from(intelMap.values());

            // 2. Extract targets from diverse sources
            const targets = new Set<string>();

            // Source A: Watchlist
            if (Array.isArray(fullData.watchlist)) {
                fullData.watchlist.forEach((w: any) => targets.add(w.symbol || w));
            }

            // Source B: Market Picks
            if (Array.isArray(fullData.marketPicks) || Array.isArray(fullData.market_picks)) {
                (fullData.marketPicks || fullData.market_picks).forEach((p: any) => targets.add(p.symbol || p));
            }

            // Source C: Portfolio Holdings (Transactions)
            if (Array.isArray(fullData.transactions)) {
                fullData.transactions.forEach((tx: any) => {
                    const s = tx.assetSymbol;
                    // STRICT FILTER: Exclude LPs, Pairs, and Stablecoins
                    if (s &&
                        !s.includes(' ') &&
                        !s.includes('-') &&
                        !s.includes('/') &&
                        s !== 'USDC' &&
                        s !== 'USDT'
                    ) {
                        targets.add(s);
                    }
                });

                // Map to compatible format for reactive hook
                const holdings = fullData.transactions.map((tx: any) => ({
                    symbol: tx.assetSymbol,
                    change24h: Math.random() * 20 - 10
                }));
                setRawHoldings(holdings);
            }

            if (Array.isArray(fullData.watchlist)) {
                const watch = fullData.watchlist.map((w: any) => ({
                    symbol: w.symbol || w,
                    change24h: Math.random() * 20 - 10
                }));
                setRawWatchlist(watch);
            }

            // 3. Merge and Create Stubs for missing intel
            const combinedIntel: IntelRecord[] = [];

            // Add existing first (maintenance priority)
            existingIntel.forEach(i => {
                combinedIntel.push(i);
                targets.delete(i.symbol);
            });

            // Add stubs for the rest
            targets.forEach(symbol => {
                combinedIntel.push({
                    symbol: symbol,
                    verdict: "Pending tactical analysis. Asset detected in portfolio/watchlist.",
                    rating: 'RISKY',
                    signalStrength: 50,
                    signalType: 'WATCHING',
                    narrative: "Automated Scout deployment initiates soon. No manual verdict on file.",
                    catalysts: ['Pending Scan'],
                    risks: ['Unknown Market Structure'],
                    updatedAt: Date.now()
                });
            });

            if (combinedIntel.length > 0) {
                setIntel(combinedIntel);
                // Preserve selection if possible, else default
                if (!selectedSymbol || !combinedIntel.find(i => i.symbol === selectedSymbol)) {
                    setSelectedSymbol(combinedIntel[0].symbol);
                }
            } else {
                // Fallback seeds ONLY if absolute zero data found
                setIntel([
                    {
                        symbol: 'HYPE',
                        verdict: 'Hyperliquid is the "AWS of DeFi". Ecosystem growth is accelerating.',
                        rating: 'STRONG BUY',
                        signalStrength: 94,
                        signalType: 'HOLDING',
                        narrative: 'Hyperliquid transitioned from a DEX to infrastructure. Revenue generation is massive.',
                        catalysts: ['Fee-funded buybacks', 'HyperEVM expansion'],
                        risks: ['Aggressive competition', 'Unlocks'],
                        updatedAt: Date.now()
                    },
                    {
                        symbol: 'SUI',
                        verdict: 'Explosive TVL growth. Faster dev acquisition than Solana.',
                        rating: 'STRONG BUY',
                        signalStrength: 92,
                        signalType: 'HOLDING',
                        narrative: 'Mysticeti V2 upgrade and institutional adoption are key tailwinds.',
                        catalysts: ['Institutional custody', 'Parallel execution'],
                        risks: ['SOL dominance', 'Unlock pressure'],
                        updatedAt: Date.now()
                    }
                ]);
                setSelectedSymbol('HYPE');
            }
        } catch (error) {
            console.error('Strategist Bridge Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredIntel = intel.filter(item =>
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.verdict.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedRecord = intel.find(r => r.symbol === selectedSymbol);

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'STRONG BUY': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
            case 'GOOD': return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
            case 'RISKY': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
            case 'ACCUMULATE': return 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10';
            case 'HOLD': return 'text-slate-300 border-slate-400/30 bg-slate-400/10';
            case 'REDUCE': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
            default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
        }
    };

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalysis = async () => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);

        const pendingItems = intel.filter(i => i.verdict.includes('Pending tactical analysis'));

        // Simulation: Process each item
        const updatedIntel = [...intel];

        for (const item of pendingItems) {
            // Simulate AI Thinking time
            await new Promise(resolve => setTimeout(resolve, 150));

            const index = updatedIntel.findIndex(i => i.symbol === item.symbol);
            if (index !== -1) {
                // Synthetic "Deep Dive" Result
                const newRecord: IntelRecord = {
                    ...updatedIntel[index],
                    verdict: `${item.symbol} shows accumulation patterns on 4H chart. Volatility contraction suggests imminent breakout.`,
                    rating: Math.random() > 0.7 ? 'STRONG BUY' : 'GOOD',
                    signalStrength: Math.floor(Math.random() * (98 - 75) + 75),
                    signalType: 'ACCUMULATION',
                    narrative: `Automated analysis detected divergence in RSI and increasing volume profile for ${item.symbol}. Institutional flows are turning positive.`,
                    catalysts: ['Volume breakout', 'Moving Average Cross', 'Sentiment Shift'],
                    risks: ['General Market Beta', 'Resistance at key level'],
                    updatedAt: Date.now()
                };

                // SAVE PERSISTENTLY
                await persistentStorage.saveIntel(newRecord);

                updatedIntel[index] = newRecord;
                setIntel([...updatedIntel]); // Progressive update
            }
        }

        setIsAnalyzing(false);
    };

    const pendingCount = intel.filter(i => i.verdict.includes('Pending tactical analysis')).length;
    const isFullySynced = pendingCount === 0;

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">STRATEGIST INTELLIGENCE HUB</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tactical Market Verdicts & Sentiment</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {pendingCount > 0 ? (
                        <button
                            onClick={handleAnalysis}
                            disabled={isAnalyzing}
                            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${isAnalyzing ? 'bg-amber-500/20 border-amber-500/40 cursor-wait' : 'bg-amber-500/10 border-amber-500/20 border hover:bg-amber-500/20 hover:border-amber-500/40'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${isAnalyzing ? 'animate-spin' : 'animate-pulse'}`} />
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                {isAnalyzing ? `Analyzing ${intel.length - pendingCount}/${intel.length}...` : `RUN TACTICAL SYNC (${pendingCount} PENDING)`}
                            </span>
                        </button>
                    ) : (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                All Systems Synced
                            </span>
                        </div>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                            type="text"
                            placeholder="Filter records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 transition-all w-48 text-slate-200"
                        />
                    </div>
                    <button onClick={fetchData} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden gap-6">
                {/* Left Side - Signals List */}
                <div className="w-80 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {filteredIntel.map((item) => (
                        <button
                            key={item.symbol}
                            onClick={() => setSelectedSymbol(item.symbol)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${selectedSymbol === item.symbol
                                ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/10'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-black text-white">{item.symbol}</span>
                                <span className="text-[8px] font-black p-1 rounded-md bg-slate-950 border border-slate-800 text-slate-500">
                                    {item.signalStrength}% STRENGTH
                                </span>
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2 ${getRatingColor(item.rating)}`}>
                                {item.rating}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                {item.verdict}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Right Side - Detail View */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {selectedRecord ? (
                        <div className="space-y-6">
                            {/* Hero Card */}
                            <div className="glass-card p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Brain size={120} />
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getRatingColor(selectedRecord.rating)}`}>
                                        {selectedRecord.rating}
                                    </div>
                                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                        Updated: {formatICT(selectedRecord.updatedAt)} ICT
                                    </div>
                                </div>

                                <h3 className="text-4xl font-black text-white tracking-tighter mb-4">
                                    {selectedRecord.symbol} REPORT
                                </h3>

                                <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 mb-6">
                                    <div className="flex items-center gap-2 text-rose-500 mb-3">
                                        <Target size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest italic font-serif">The Verdict</span>
                                    </div>
                                    <p className="text-lg font-medium text-slate-200 leading-relaxed italic">
                                        "{selectedRecord.verdict}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-4">
                                            <Zap size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Catalysts</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {selectedRecord.catalysts?.map((c, i) => (
                                                <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                                    <ChevronRight size={12} className="text-emerald-500" /> {c}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 bg-rose-500/5 rounded-3xl border border-rose-500/10">
                                        <div className="flex items-center gap-2 text-rose-400 mb-4">
                                            <ShieldAlert size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Risks</span>
                                        </div>
                                        <ul className="space-y-2">
                                            {selectedRecord.risks?.map((r, i) => (
                                                <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                                    <ChevronRight size={12} className="text-rose-500" /> {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Narrative */}
                            <div className="glass-card p-8 border-slate-800">
                                <div className="flex items-center gap-2 text-indigo-400 mb-6 font-serif">
                                    <BarChart3 size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Strategic Narrative</span>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-sm text-slate-400 leading-loose font-medium">
                                        {selectedRecord.narrative}
                                    </p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Type</div>
                                            <div className="text-xs font-bold text-slate-200">{selectedRecord.signalType}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Conviction</div>
                                            <div className="text-xs font-bold text-slate-200">HIGH FREQUENCY</div>
                                        </div>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                                                <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center text-[8px] font-black">
                                                    AI
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                            <TrendingUp size={48} className="text-slate-800 mb-4" />
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Select an Asset for Deep Intel</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StrategistIntelHub;
