import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Wallet } from 'lucide-react';
import { ScoutReport } from '../../services/database/types';

interface Props {
    scoutReport: ScoutReport | null;
}

export const ChainInformation: React.FC<Props> = ({ scoutReport }) => {
    const [monitoredChains, setMonitoredChains] = useState<string[]>(() => {
        const saved = localStorage.getItem('monitored_chains');
        return saved ? JSON.parse(saved) : ["ethereum", "solana", "sui", "arbitrum"];
    });
    const [newChainSlug, setNewChainSlug] = useState('');

    useEffect(() => {
        localStorage.setItem('monitored_chains', JSON.stringify(monitoredChains));
    }, [monitoredChains]);

    const handleAddChain = (e: React.FormEvent) => {
        e.preventDefault();
        const slug = newChainSlug.trim().toLowerCase();
        if (slug && !monitoredChains.includes(slug)) {
            setMonitoredChains([...monitoredChains, slug]);
            setNewChainSlug('');
            // Trigger a refresh event if needed, or rely on next harvest
            window.dispatchEvent(new CustomEvent('monitored_chains_updated'));
        }
    };

    const handleRemoveChain = (slug: string) => {
        setMonitoredChains(monitoredChains.filter(c => c !== slug));
        window.dispatchEvent(new CustomEvent('monitored_chains_updated'));
    };

    const stats = scoutReport?.chainStats || {};

    return (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <Layers size={18} />
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Chain Information Hub</h2>
                </div>

                <form onSubmit={handleAddChain} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add chain slug (e.g. solana)..."
                        value={newChainSlug}
                        onChange={(e) => setNewChainSlug(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-indigo-500 transition-all w-48"
                    />
                    <button type="submit" className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        <Plus size={16} />
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {monitoredChains.map((chain) => {
                    const data = stats[chain];
                    const displayName = (() => {
                        const m: Record<string, string> = {
                            'hyperliquid-l1': 'Hyperliquid',
                            'hyperliquid': 'Hyperliquid',
                            'plasma': 'Plasma (XPL)',
                            'ethereum': 'Ethereum',
                            'solana': 'Solana',
                            'arbitrum': 'Arbitrum',
                            'sui': 'Sui'
                        };
                        return m[chain.toLowerCase()] || chain.toUpperCase();
                    })();

                    return (
                        <div key={chain} className="group relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-white/5 p-4 hover:border-indigo-500/30 transition-all duration-300">
                            {/* Removal Button */}
                            <button
                                onClick={() => handleRemoveChain(chain)}
                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>

                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[120px]">{displayName}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Ecosystem Pulse</p>
                                </div>
                                {data && (
                                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${data.change24h >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {data.change24h >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {Math.abs(data.change24h).toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            {!data ? (
                                <div className="flex flex-col items-center justify-center py-4 space-y-2 opacity-30">
                                    <Activity size={24} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Harvesting...</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 flex items-center gap-1">
                                                <Wallet size={10} /> Total TVL
                                            </span>
                                            <span className="text-lg font-mono font-black text-slate-800 dark:text-white leading-none">
                                                ${(data.tvl / 1e9).toFixed(2)}B
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                        {(() => {
                                            const formatValue = (val: number) => {
                                                if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
                                                if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
                                                if (val >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
                                                return `$${val.toFixed(0)}`;
                                            };
                                            return (
                                                <>
                                                    <div>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 flex items-center gap-1">
                                                            <DollarSign size={8} /> Revenue
                                                        </span>
                                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                                            {formatValue(data.revenue24h)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 flex items-center justify-end gap-1">
                                                            Fees <Activity size={8} />
                                                        </span>
                                                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                                                            {formatValue(data.fees24h)}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Background Pulse Decor */}
                            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
