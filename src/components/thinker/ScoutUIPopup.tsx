/**
 * ScoutUIPopup.tsx
 * 
 * A full-featured Scout UI popup that syncs data from the remote Ubuntu Scout.
 * Shows missions, scheduler status, logs, and controls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Satellite, RefreshCw, Activity, Server, Play, Pause,
    Clock, CheckCircle, AlertTriangle, XCircle, Zap, Terminal,
    Radio, Settings, List, MessageSquare, ExternalLink
} from 'lucide-react';
import { SCOUT_URL, IS_REMOTE_SCOUT } from '../../config/scoutConfig';

interface Mission {
    id: string;
    label: string;
    url: string;
    selector: string;
    frequency: number;
    successRate?: number;
    lastValue?: string;
    lastSuccessAt?: string;
}

interface SchedulerStatus {
    running: boolean;
    heartbeat?: string;
    totalMissions?: number;
    completed?: number;
    queued?: number;
    nextRun?: string;
}

interface TelegramLog {
    id: number;
    timestamp: number;
    direction: string;
    command: string;
    message: string;
}

interface ScoutUIPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScoutUIPopup: React.FC<ScoutUIPopupProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'status' | 'missions' | 'logs'>('status');
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [scheduler, setScheduler] = useState<SchedulerStatus | null>(null);
    const [logs, setLogs] = useState<TelegramLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            // Health check
            const healthRes = await fetch(`${SCOUT_URL}/health`, { signal: AbortSignal.timeout(5000) });
            setIsOnline(healthRes.ok);

            if (healthRes.ok) {
                // Fetch all data in parallel
                const [presetsRes, schedulerRes, statsRes, logsRes, healthMissionsRes] = await Promise.all([
                    fetch(`${SCOUT_URL}/presets`).catch(() => null),
                    fetch(`${SCOUT_URL}/scheduler/status`).catch(() => null),
                    fetch(`${SCOUT_URL}/intel/stats`).catch(() => null),
                    fetch(`${SCOUT_URL}/telegram/log?limit=20`).catch(() => null),
                    fetch(`${SCOUT_URL}/health/missions`).catch(() => null)
                ]);

                if (presetsRes?.ok) {
                    const data = await presetsRes.json();
                    // Merge with health data if available
                    if (healthMissionsRes?.ok) {
                        const healthData = await healthMissionsRes.json();
                        const healthMap = new Map(healthData.missions?.map((m: any) => [m.label, m]) || []);
                        setMissions(data.map((p: any) => ({
                            ...p,
                            ...(healthMap.get(p.label) || {})
                        })));
                    } else {
                        setMissions(data);
                    }
                }

                if (schedulerRes?.ok) {
                    setScheduler(await schedulerRes.json());
                }

                if (statsRes?.ok) {
                    const data = await statsRes.json();
                    setStats(data.stats);
                }

                if (logsRes?.ok) {
                    const data = await logsRes.json();
                    setLogs(data.logs || []);
                }
            }
        } catch (e) {
            setIsOnline(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchAllData();
            const interval = setInterval(fetchAllData, 30000);
            return () => clearInterval(interval);
        }
    }, [isOpen, fetchAllData]);

    const toggleScheduler = async () => {
        if (!scheduler) return;
        try {
            await fetch(`${SCOUT_URL}/scheduler/${scheduler.running ? 'stop' : 'start'}`, { method: 'POST' });
            setTimeout(fetchAllData, 1000);
        } catch (e) {
            console.error('[ScoutUI] Failed to toggle scheduler');
        }
    };

    const prioritizeMission = async (label: string) => {
        try {
            await fetch(`${SCOUT_URL}/missions/prioritize/${label}`, { method: 'POST' });
            fetchAllData();
        } catch (e) {
            console.error('[ScoutUI] Failed to prioritize mission');
        }
    };

    if (!isOpen) {
        return null;
    }

    console.log('[ScoutUIPopup] Rendering popup, isOpen:', isOpen);

    const getStatusIcon = (rate?: number) => {
        if (rate === undefined) return <Clock className="w-3 h-3 text-slate-500" />;
        if (rate >= 70) return <CheckCircle className="w-3 h-3 text-emerald-400" />;
        if (rate > 0) return <AlertTriangle className="w-3 h-3 text-indigo-400" />;
        return <XCircle className="w-3 h-3 text-rose-400" />;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-cyan-900/50 to-purple-900/50 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Satellite className="w-6 h-6 text-cyan-400" />
                        <div>
                            <h2 className="text-lg font-bold text-white">Scout Satellite</h2>
                            <div className="flex items-center gap-2 text-xs">
                                {IS_REMOTE_SCOUT && (
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-300">REMOTE</span>
                                )}
                                <span className="text-slate-400">{SCOUT_URL}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Status */}
                        {loading ? (
                            <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                        ) : isOnline ? (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Online
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs">
                                <span className="w-2 h-2 rounded-full bg-rose-400" />
                                Offline
                            </span>
                        )}
                        <button
                            onClick={fetchAllData}
                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700">
                    {[
                        { id: 'status', label: 'Status', icon: Activity },
                        { id: 'missions', label: 'Missions', icon: List },
                        { id: 'logs', label: 'Telegram Logs', icon: MessageSquare }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                    <a
                        href={SCOUT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-2 px-6 py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open Web UI
                    </a>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                    {activeTab === 'status' && (
                        <div className="space-y-6">
                            {/* Scheduler Control */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${scheduler?.running ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                                        <Activity className={`w-6 h-6 ${scheduler?.running ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200">
                                            Watchtower {scheduler?.running ? 'Active' : 'Paused'}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {scheduler?.queued || 0} queued • {scheduler?.completed || 0} completed today
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleScheduler}
                                    disabled={!isOnline}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${scheduler?.running
                                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'
                                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                                        } disabled:opacity-50`}
                                >
                                    {scheduler?.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    {scheduler?.running ? 'Pause' : 'Start'}
                                </button>
                            </div>

                            {/* Stats Grid */}
                            {stats && (
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                                        <div className="text-2xl font-bold text-cyan-400">{stats.uniqueLabels}</div>
                                        <div className="text-xs text-slate-500 mt-1">Metrics</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                                        <div className="text-2xl font-bold text-purple-400">{stats.totalRecords?.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500 mt-1">Records</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                                        <div className="text-2xl font-bold text-emerald-400">{missions.length}</div>
                                        <div className="text-xs text-slate-500 mt-1">Missions</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
                                        <div className="text-2xl font-bold text-slate-300">{stats.databaseSizeApprox}</div>
                                        <div className="text-xs text-slate-500 mt-1">DB Size</div>
                                    </div>
                                </div>
                            )}

                            {/* Server Info */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <h4 className="font-medium text-slate-300 mb-3 flex items-center gap-2">
                                    <Server className="w-4 h-4" />
                                    Server Info
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Endpoint:</span>
                                        <span className="ml-2 text-slate-300 font-mono">{SCOUT_URL}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Mode:</span>
                                        <span className="ml-2 text-purple-400">{IS_REMOTE_SCOUT ? 'Ubuntu Remote' : 'Local'}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Oldest Record:</span>
                                        <span className="ml-2 text-slate-300">
                                            {stats?.oldestRecord ? new Date(stats.oldestRecord).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Newest Record:</span>
                                        <span className="ml-2 text-slate-300">
                                            {stats?.newestRecord ? new Date(stats.newestRecord).toLocaleString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'missions' && (
                        <div className="space-y-2">
                            {missions.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    {loading ? 'Loading missions...' : 'No missions configured'}
                                </div>
                            ) : (
                                missions.map(m => (
                                    <div
                                        key={m.id || m.label}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(m.successRate)}
                                            <div>
                                                <div className="font-mono text-sm text-slate-200">{m.label}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-xs">{m.url}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm text-slate-300">{m.lastValue || '---'}</div>
                                                <div className="text-xs text-slate-500">every {m.frequency}h</div>
                                            </div>
                                            <button
                                                onClick={() => prioritizeMission(m.label)}
                                                className="p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
                                                title="Run Now"
                                            >
                                                <Zap className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-2">
                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    {loading ? 'Loading logs...' : 'No Telegram activity yet'}
                                </div>
                            ) : (
                                logs.map(log => (
                                    <div
                                        key={log.id}
                                        className={`p-3 rounded-lg border ${log.direction === 'INBOUND'
                                            ? 'bg-slate-800/50 border-slate-700'
                                            : 'bg-cyan-900/20 border-cyan-700/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-medium ${log.direction === 'INBOUND' ? 'text-slate-400' : 'text-cyan-400'
                                                }`}>
                                                {log.direction === 'INBOUND' ? '📥 User' : '📤 Scout'}
                                                {log.command && <span className="ml-2 font-mono">{log.command}</span>}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-300 whitespace-pre-wrap font-mono">
                                            {log.message?.slice(0, 200)}{log.message?.length > 200 ? '...' : ''}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoutUIPopup;
