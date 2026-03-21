/**
 * ScoutMonitor.tsx
 * 
 * A dashboard panel to monitor the remote Scout service from the Vault UI.
 * Shows health status, mission schedule, and recent activity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Satellite, RefreshCw, CheckCircle, AlertCircle, Clock,
    Zap, Activity, Server, ChevronDown, ChevronRight,
    Play, Pause, ExternalLink
} from 'lucide-react';
import { SCOUT_URL, IS_REMOTE_SCOUT } from '../../config/scoutConfig';

interface Mission {
    label: string;
    url: string;
    frequency: number;
    successRate: number;
    lastSuccessAt: string | null;
    lastValue: string | null;
    recordCount: number;
}

interface MissionHealth {
    status: string;
    totalMissions: number;
    healthy: number;
    degraded: number;
    failing: number;
    missions: Mission[];
}

interface SchedulerStatus {
    running: boolean;
    heartbeat?: string;
    totalMissions?: number;
    completed?: number;
    queued?: number;
}

interface ScoutStats {
    totalRecords: number;
    uniqueLabels: number;
    oldestRecord: string | null;
    newestRecord: string | null;
    databaseSizeApprox: string;
}

export const ScoutMonitor: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [missionHealth, setMissionHealth] = useState<MissionHealth | null>(null);
    const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
    const [stats, setStats] = useState<ScoutStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            // Health check
            const healthRes = await fetch(`${SCOUT_URL}/health`, { signal: AbortSignal.timeout(5000) });
            setIsOnline(healthRes.ok);

            if (healthRes.ok) {
                // Fetch mission health
                const [missionsRes, schedulerRes, statsRes] = await Promise.all([
                    fetch(`${SCOUT_URL}/health/missions`).catch(() => null),
                    fetch(`${SCOUT_URL}/scheduler/status`).catch(() => null),
                    fetch(`${SCOUT_URL}/intel/stats`).catch(() => null)
                ]);

                if (missionsRes?.ok) {
                    const data = await missionsRes.json();
                    setMissionHealth(data);
                }

                if (schedulerRes?.ok) {
                    const data = await schedulerRes.json();
                    setSchedulerStatus(data);
                }

                if (statsRes?.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                }
            }
            setLastRefresh(new Date());
        } catch (e) {
            setIsOnline(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Listen for expand event from Sidebar "Wake Scout" button
    useEffect(() => {
        const handleExpandEvent = () => {
            setIsExpanded(true);
            fetchStatus(); // Refresh data when panel is opened
        };

        window.addEventListener('expand-scout-monitor', handleExpandEvent);
        return () => window.removeEventListener('expand-scout-monitor', handleExpandEvent);
    }, [fetchStatus]);

    const toggleScheduler = async (start: boolean) => {
        try {
            await fetch(`${SCOUT_URL}/scheduler/${start ? 'start' : 'stop'}`, { method: 'POST' });
            setTimeout(fetchStatus, 1000);
        } catch (e) {
            console.error('[ScoutMonitor] Failed to toggle scheduler:', e);
        }
    };

    const getStatusColor = (rate: number) => {
        if (rate >= 70) return 'text-emerald-400';
        if (rate > 0) return 'text-indigo-400';
        return 'text-rose-400';
    };

    return (
        <div className={`bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden ${className}`}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <Satellite className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-slate-200">Scout Monitor</span>
                    {IS_REMOTE_SCOUT && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
                            Remote
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    {loading ? (
                        <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                    ) : isOnline === null ? (
                        <span className="text-xs text-slate-500">Checking...</span>
                    ) : isOnline ? (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-xs text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            Offline
                        </span>
                    )}

                    {/* Quick Stats */}
                    {missionHealth && !isExpanded && (
                        <span className="text-xs text-slate-400">
                            {missionHealth.healthy}/{missionHealth.totalMissions} healthy
                        </span>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); fetchStatus(); }}
                        className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-slate-700/50 p-4 space-y-4">
                    {/* Connection Info */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                            <Server className="w-3 h-3 inline mr-1" />
                            {SCOUT_URL}
                        </span>
                        {lastRefresh && (
                            <span className="text-slate-500">
                                Updated {lastRefresh.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* Scheduler Status */}
                    {schedulerStatus && (
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <Activity className={`w-4 h-4 ${schedulerStatus.running ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <div>
                                    <div className="text-sm font-medium text-slate-200">
                                        Watchtower {schedulerStatus.running ? 'Active' : 'Paused'}
                                    </div>
                                    {schedulerStatus.queued !== undefined && (
                                        <div className="text-xs text-slate-400">
                                            {schedulerStatus.queued} queued • {schedulerStatus.completed || 0} completed
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => toggleScheduler(!schedulerStatus.running)}
                                className={`p-2 rounded-lg transition-colors ${schedulerStatus.running
                                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                                    }`}
                            >
                                {schedulerStatus.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                        </div>
                    )}

                    {/* Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-cyan-400">{stats.uniqueLabels}</div>
                                <div className="text-xs text-slate-500">Metrics</div>
                            </div>
                            <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-purple-400">{stats.totalRecords.toLocaleString()}</div>
                                <div className="text-xs text-slate-500">Records</div>
                            </div>
                            <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-slate-300">{stats.databaseSizeApprox}</div>
                                <div className="text-xs text-slate-500">DB Size</div>
                            </div>
                        </div>
                    )}

                    {/* Mission Health Summary */}
                    {missionHealth && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Mission Health</span>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-emerald-400">✓ {missionHealth.healthy}</span>
                                    <span className="text-indigo-400">⚠ {missionHealth.degraded}</span>
                                    <span className="text-rose-400">✗ {missionHealth.failing}</span>
                                </div>
                            </div>

                            {/* Mission List (first 5) */}
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {missionHealth.missions.slice(0, 10).map(m => (
                                    <div
                                        key={m.label}
                                        className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/30 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${m.successRate >= 70 ? 'bg-emerald-400' :
                                                m.successRate > 0 ? 'bg-indigo-400' : 'bg-rose-400'
                                                }`} />
                                            <span className="text-slate-300 font-mono">{m.label}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <span>{m.lastValue || '---'}</span>
                                            <span className={getStatusColor(m.successRate)}>{m.successRate}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {missionHealth.missions.length > 10 && (
                                <div className="text-xs text-center text-slate-500 pt-1">
                                    +{missionHealth.missions.length - 10} more missions
                                </div>
                            )}
                        </div>
                    )}

                    {/* Open Scout Dashboard Link */}
                    <a
                        href={SCOUT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 text-sm transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open Scout Dashboard
                    </a>
                </div>
            )}
        </div>
    );
};

export default ScoutMonitor;
