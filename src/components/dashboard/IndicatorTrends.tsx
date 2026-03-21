import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { SCOUT_URL } from '../../config/scoutConfig';

interface TrendData {
    label: string;
    current: number;
    change1d: number | null;
    change2d: number | null;
    change5d: number | null;
    change7d: number | null;
    timestamp?: number;
}

interface IndicatorTrendsProps {
    className?: string;
}

const SATELLITE_URL = SCOUT_URL;
const STORAGE_KEY = 'indicatorTrends_collapsed';

// Display label mapping
const LABEL_DISPLAY: Record<string, string> = {
    'BTC_DOM': 'BTC.D',
    'USDT_DOM': 'USDT.D',
    'USDC_DOM': 'USDC.D',
    'BTC.D': 'BTC.D',
    'USDT.D': 'USDT.D',
    'USDC.D': 'USDC.D',
    'OTHERS': 'OTHERS.D'
};

// Helper to format time ago
const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const ChangeBadge: React.FC<{ value: number | null; label: string }> = ({ value, label }) => {
    if (value === null) {
        return (
            <span className="text-xs text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                {label}: ---
            </span>
        );
    }

    const isPositive = value > 0;
    const isNeutral = value === 0;
    const color = isNeutral
        ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
        : isPositive
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
            : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30';

    return (
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${color}`}>
            {label}: {isPositive ? '+' : ''}{value.toFixed(2)}%
        </span>
    );
};

const TrendIcon: React.FC<{ change1d: number | null }> = ({ change1d }) => {
    if (change1d === null || change1d === 0) {
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
    return change1d > 0
        ? <TrendingUp className="w-4 h-4 text-emerald-500" />
        : <TrendingDown className="w-4 h-4 text-rose-500" />;
};

export const IndicatorTrends: React.FC<IndicatorTrendsProps> = ({ className = '' }) => {
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    });

    const toggleCollapsed = () => {
        const newValue = !isCollapsed;
        setIsCollapsed(newValue);
        try {
            localStorage.setItem(STORAGE_KEY, String(newValue));
        } catch { }
    };

    const fetchTrends = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${SATELLITE_URL}/intel/trends`);
            if (!res.ok) throw new Error('Failed to fetch trends');

            const data = await res.json();
            if (data.status === 'success' && Array.isArray(data.trends)) {
                setTrends(data.trends);
                setLastUpdated(new Date());
            }
        } catch (err: any) {
            setError('Satellite offline');
            console.warn('[IndicatorTrends] Failed to fetch:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrends();
        // Refresh every 5 minutes
        const interval = setInterval(fetchTrends, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading && trends.length === 0) {
        return (
            <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 ${className}`}>
                <div className="flex items-center gap-2 text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading indicator trends...</span>
                </div>
            </div>
        );
    }

    if (error && trends.length === 0) {
        return (
            <div className={`bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 ${className}`}>
                <div className="flex items-center gap-2 text-indigo-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 ${className}`}>
            {/* Header with Collapse Toggle */}
            <div className="flex items-center justify-between">
                <button
                    onClick={toggleCollapsed}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                    {/* Colorful Bar Chart Icon (Mimic emoji) */}
                    <span className="text-sm">📊</span>
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                        Indicator Trends
                    </span>
                    {trends.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-medium">
                            ({trends.length} indicators)
                        </span>
                    )}
                </button>
                <button
                    onClick={fetchTrends}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Refresh trends"
                >
                    <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Collapsible Content */}
            {!isCollapsed && (
                <>
                    {/* Trends Grid */}
                    <div className="space-y-3 mt-3">
                        {trends.map((trend) => {
                            const isStale = trend.timestamp && (Date.now() - trend.timestamp > 15 * 60 * 1000);
                            return (
                                <div
                                    key={trend.label}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <TrendIcon change1d={trend.change1d} />
                                        <div>
                                            <span className="font-bold text-slate-800 dark:text-white">
                                                {LABEL_DISPLAY[trend.label] || trend.label}
                                            </span>
                                            {/* [PHASE 81] Monospace font for terminal aesthetic */}
                                            <span className={`ml-2 text-lg font-semibold font-mono ${isStale ? 'text-indigo-500' : 'text-cyan-400'}`}>
                                                {trend.current?.toFixed(2)}%
                                            </span>
                                            {trend.timestamp && (
                                                <span className={`ml-2 text-xs ${isStale ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                    {formatTimeAgo(trend.timestamp)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                        <ChangeBadge value={trend.change1d} label="1D" />
                                        <ChangeBadge value={trend.change2d ?? null} label="2D" />
                                        <ChangeBadge value={trend.change5d ?? null} label="5D" />
                                        <ChangeBadge value={trend.change7d} label="7D" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    {lastUpdated && (
                        <div className="mt-3 text-xs text-slate-400 text-right">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default IndicatorTrends;

