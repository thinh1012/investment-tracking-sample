import React, { useState } from 'react';
import { usePoolSearch, Pool, PoolFilters } from '../../hooks/usePoolSearch';
import { Search, ExternalLink } from 'lucide-react';

export const PoolScreener: React.FC = () => {
    const { pools, isLoading, error, searchPools } = usePoolSearch();
    const [tokenA, setTokenA] = useState('SOL');
    const [tokenB, setTokenB] = useState('USDC');
    const [filters, setFilters] = useState<PoolFilters>({
        chain: 'all',
        minTVL: undefined,
        minAPR: undefined
    });

    const handleSearch = () => {
        searchPools(tokenA, tokenB, filters);
    };

    const formatNumber = (num: number) => {
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    };

    const formatAPR = (apr: number) => {
        return `${apr.toFixed(2)}%`;
    };

    const formatFeeTier = (fee: number) => {
        if (fee === 0) return 'N/A';
        return `${(fee * 100).toFixed(2)}%`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-white">Pool Screener</h2>
                <p className="text-slate-400 mt-1">Find the best liquidity pools across DEXs</p>
            </div>

            {/* Search Form */}
            <div className="bg-slate-800/50 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Token Inputs */}
                    <div className="flex items-center gap-2 flex-1">
                        <input
                            type="text"
                            value={tokenA}
                            onChange={(e) => setTokenA(e.target.value.toUpperCase())}
                            placeholder="Token A"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-slate-400">—</span>
                        <input
                            type="text"
                            value={tokenB}
                            onChange={(e) => setTokenB(e.target.value.toUpperCase())}
                            placeholder="Token B"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !tokenA || !tokenB}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Search className="w-5 h-5" />
                        {isLoading ? 'Searching...' : 'Find Pools'}
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Chain</label>
                        <select
                            value={filters.chain}
                            onChange={(e) => setFilters({ ...filters, chain: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="all">All Chains</option>
                            <option value="ethereum">Ethereum</option>
                            <option value="solana">Solana</option>
                            <option value="sui">Sui</option>
                            <option value="hyperevm">HyperEVM</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Min TVL</label>
                        <input
                            type="number"
                            value={filters.minTVL || ''}
                            onChange={(e) => setFilters({ ...filters, minTVL: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="e.g., 1000000"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1.5">Min APR (%)</label>
                        <input
                            type="number"
                            value={filters.minAPR || ''}
                            onChange={(e) => setFilters({ ...filters, minAPR: e.target.value ? parseFloat(e.target.value) : undefined })}
                            placeholder="e.g., 10"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-4">
                    <p className="text-rose-400 text-sm">{error}</p>
                </div>
            )}

            {/* Results */}
            {!isLoading && pools.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-white">
                            Found {pools.length} pool{pools.length !== 1 && 's'}
                        </h3>
                        <p className="text-xs text-slate-400">Sorted by 30d volume</p>
                    </div>

                    <div className="space-y-2">
                        {pools.map((pool, idx) => (
                            <PoolCard key={`${pool.protocol}-${pool.address}-${idx}`} pool={pool} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && pools.length === 0 && tokenA && tokenB && (
                <div className="bg-slate-800/30 rounded-xl p-12 text-center">
                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No pools found. Try searching for a different pair.</p>
                </div>
            )}
        </div>
    );
};

/* Pool Card Component */
const PoolCard: React.FC<{ pool: Pool }> = ({ pool }) => {
    const formatNumber = (num: number) => {
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    };

    const formatAPR = (apr: number) => `${apr.toFixed(2)}%`;
    const formatFeeTier = (fee: number) => fee === 0 ? 'N/A' : `${(fee * 100).toFixed(3)}%`;

    return (
        <div className="bg-slate-800/50 hover:bg-slate-800/70 transition-colors rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-white">{pool.pair}</h4>
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded font-medium">
                            {pool.protocol}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {pool.chain.charAt(0).toUpperCase() + pool.chain.slice(1)} • Fee: {formatFeeTier(pool.feeTier)}
                    </p>
                </div>

                {pool.url && (
                    <a
                        href={pool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-indigo-400 transition-colors ml-2"
                        title="Open on DEX"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <p className="text-xs text-slate-500 mb-0.5">30d Volume</p>
                    <p className="text-sm text-white font-semibold">{formatNumber(pool.volume30d)}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-0.5">TVL</p>
                    <p className="text-sm text-white font-semibold">{formatNumber(pool.tvl)}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-0.5">APR</p>
                    <p className="text-sm text-emerald-400 font-semibold">{formatAPR(pool.apr)}</p>
                </div>
            </div>

            {pool.source && (
                <p className="text-xs text-slate-600 mt-2">Source: {pool.source}</p>
            )}
        </div>
    );
};
