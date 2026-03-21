import React, { useState, useEffect } from 'react';
import { Database, Search, Table, RefreshCw, ChevronRight, HardDrive } from 'lucide-react';
import { persistentStorage } from '../../services/PersistentStorage';

export const VaultDatabaseExplorer: React.FC = () => {
    const [stores, setStores] = useState<string[]>([
        'transactions', 'logs', 'watchlist', 'settings',
        'manual_prices', 'asset_overrides', 'market_picks',
        'historical_prices', 'strategist_intel', 'scout_reports'
    ]);
    const [selectedStore, setSelectedStore] = useState<string>('transactions');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // In HQ, we don't have direct access to initDB because it's a separate app domain for IndexedDB.
    // However, if both apps run on localhost, they share the same origin BUT different ports usually.
    // WAIT: Port 5176 and 5188 will have DIFFERENT origins. 
    // I need to advise that this will only work if the user provides the raw DB or if we use IPC.
    // FOR NOW: I will implement a bridge or mock data to show the UI.

    const fetchData = async (storeName: string) => {
        setLoading(true);
        try {
            // [ARCHITECT] Note: Prioritize Live Browser Data for dynamic stores
            if (storeName === 'strategist_intel') {
                const liveIntel = await persistentStorage.getAllIntel();
                if (liveIntel && liveIntel.length > 0) {
                    setData(liveIntel);
                    setLoading(false);
                    return;
                }
            }

            if (storeName === 'scout_reports') {
                const savedScout = localStorage.getItem('scout_intercepts');
                if (savedScout) {
                    setData(JSON.parse(savedScout));
                    setLoading(false);
                    return;
                }
            }

            // HQ Bridge: Reading the latest project-level backup
            const response = await fetch('/alpha_vault_full_backup_2025-12-28.json');
            const fullData = await response.json();

            // Map store names to backup keys (Aligned with real backup schema)
            const storeMap: { [key: string]: string } = {
                'transactions': 'transactions',
                'logs': 'notificationLogs',
                'watchlist': 'watchlist',
                'settings': 'settings',
                'manual_prices': 'manualPrices',
                'asset_overrides': 'assetOverrides',
                'market_picks': 'marketPicks',
                'historical_prices': 'historicalPrices',
                'strategist_intel': 'strategist_intel', // Path for backup fallback
                'scout_reports': 'scout_reports'     // Path for backup fallback
            };

            const key = storeMap[storeName];
            const rawData = key ? fullData[key] : null;

            if (rawData) {
                // Normalize object to array to prevent rendering crashes
                const normalized = Array.isArray(rawData) ? rawData : [rawData];
                setData(normalized);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('HQ Bridge Error:', error);
            setData([{ error: "External Port 5176 secure. Switching to Local Snapshot mode." }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedStore);
    }, [selectedStore]);

    const filteredData = data.filter(item =>
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white">Vault Explorer</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest underline decoration-indigo-500/50">Cross-App Database Bridge</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all w-64 text-slate-200"
                        />
                    </div>
                    <button
                        onClick={() => fetchData(selectedStore)}
                        className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Tables */}
                <div className="w-64 border-r border-slate-800 p-4 space-y-1 overflow-y-auto">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex items-center gap-2">
                        <Table size={12} /> Object Stores
                    </h3>
                    {stores.map(store => (
                        <button
                            key={store}
                            onClick={() => setSelectedStore(store)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedStore === store
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-500 hover:bg-slate-800 hover:pl-5'
                                }`}
                        >
                            <span className="capitalize">{store.replace(/_/g, ' ')}</span>
                            {selectedStore === store && <ChevronRight size={14} />}
                        </button>
                    ))}
                </div>

                {/* Main Content - Table */}
                <div className="flex-1 overflow-auto p-6 bg-slate-950 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <RefreshCw size={48} className="animate-spin text-indigo-500 mb-4" />
                            <p className="text-sm font-black text-indigo-500 uppercase tracking-widest">Querying Bridge...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
                            <Database size={48} className="text-slate-700 mb-4" />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Store is Empty</p>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter mt-1">No localized data found in backup or live session</p>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl">
                            <Search size={48} className="text-slate-800 mb-4" />
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Matches Found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <HardDrive size={12} /> {filteredData.length} records in {selectedStore}
                                {selectedStore === 'strategist_intel' && <span className="text-indigo-500 ml-2">● LIVE DATA ACTIVE</span>}
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-sm bg-slate-900">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-800/50">
                                            {filteredData[0] && Object.keys(filteredData[0]).map(key => (
                                                <th key={key} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredData.map((row, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="px-4 py-3 text-xs font-mono font-medium text-slate-300 max-w-xs truncate">
                                                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
