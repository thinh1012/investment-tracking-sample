import React, { useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';
import { X, Cloud, Lock, LogIn, Upload, Download, AlertTriangle, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';


import { BackupService } from '../services/db';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onRestore?: (data: any) => void; // Callback when data is downloaded
    sync: any; // Passed from parent to share state
}

export const CloudSyncModal: React.FC<Props> = ({ isOpen, onClose, onRestore, sync }) => {
    const { user, isLoading, error, status, syncKey, setSyncKey, signIn, signUp, signOut, uploadVault, downloadVault, inspectVault } = sync;

    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Auth Password
    const [isSignUp, setIsSignUp] = useState(false);

    // Sync State
    const [showPassword, setShowPassword] = useState(false);
    const [localIsEmpty, setLocalIsEmpty] = useState(false);
    const [vaultStats, setVaultStats] = useState<any>(null);

    // Detect empty state and inspect vault on open
    React.useEffect(() => {
        if (isOpen) {
            BackupService.isLocalDataEmpty().then(setLocalIsEmpty);
            if (syncKey && user) {
                inspectVault().then(setVaultStats);
            }
        }
    }, [isOpen, syncKey, user]);


    const handleUpload = async () => {
        try {
            const data = await BackupService.createFullBackup();
            await uploadVault(data);
        } catch (e) {
            console.error("Failed to gather data for upload", e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col">
                        <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                            <Cloud size={20} className="text-indigo-500" />
                            Cloud Vault
                        </h2>
                        {user && syncKey && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                                <RefreshCw size={10} className="animate-spin" /> Auto-Sync Active
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Error / Status Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}
                    {status && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-center gap-2">
                            <Check size={16} /> {status}
                        </div>
                    )}

                    {/* VIEW 1: AUTHENTICATION */}
                    {!user ? (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="inline-flex p-3 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 mb-3">
                                    <LogIn size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Sign In to your Vault</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Use your email to access your personal cloud locker.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <input
                                    type="password"
                                    placeholder="Account Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <button
                                onClick={() => isSignUp ? signUp(email, password) : signIn(email, password)}
                                disabled={isLoading || !email || !password}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <RefreshCw className="animate-spin" /> : (isSignUp ? 'Create Vault Account' : 'Open Vault')}
                            </button>

                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="w-full text-xs text-slate-500 hover:text-indigo-500 transition-colors"
                            >
                                {isSignUp ? 'Already have a vault? Sign In' : 'Need a vault? Create Account'}
                            </button>
                        </div>
                    ) : (
                        /* VIEW 2: SYNC CONTROLS */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    {user.email}
                                </div>
                                <button
                                    onClick={signOut}
                                    className="text-xs text-rose-500 hover:underline"
                                >
                                    Sign Out
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                    <Lock size={12} /> Sync Password (The Key)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your private encryption password"
                                        value={syncKey}
                                        onChange={e => setSyncKey(e.target.value)}
                                        className="w-full p-3 pr-10 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-wider"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {vaultStats ? (
                                    <div className="mt-3 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-indigo-500 uppercase tracking-tighter mb-2">
                                            <span>Cloud Vault Blueprint</span>
                                            <span>{new Date(vaultStats.updated_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-500/10 text-center">
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{vaultStats.transactionCount}</div>
                                                <div className="text-[8px] text-slate-400 uppercase">Tx</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-500/10 text-center">
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{vaultStats.watchlistCount}</div>
                                                <div className="text-[8px] text-slate-400 uppercase">Watch</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-500/10 text-center">
                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{vaultStats.picksCount}</div>
                                                <div className="text-[8px] text-slate-400 uppercase">Picks</div>
                                            </div>
                                        </div>
                                        {localIsEmpty && vaultStats.transactionCount > 0 && (
                                            <div className="mt-2 text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                                                <Check size={10} /> Data detected! Click Restore to hydrate.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-orange-500 flex items-start gap-1 mt-1 leading-relaxed">
                                        <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                                        <span>This password is the <strong>only way</strong> to unlock your data. It is stored for this session only.</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        if (localIsEmpty) {
                                            if (confirm("Your local vault is empty. Are you sure you want to upload zeros to the cloud? This will overwrite your cloud backup.")) {
                                                handleUpload();
                                            }
                                        } else {
                                            handleUpload();
                                        }
                                    }}
                                    disabled={!syncKey || isLoading}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all disabled:opacity-50 ${localIsEmpty
                                        ? 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-400'
                                        : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                        }`}
                                >
                                    <RefreshCw size={24} className={isLoading ? "animate-spin" : ""} />
                                    <span className="font-bold">Save to Cloud</span>
                                    <span className="text-[10px] opacity-70">{localIsEmpty ? "Wipe Warning" : "Upload Local"}</span>
                                </button>

                                <button
                                    onClick={async () => {
                                        const data = await downloadVault();
                                        if (data && onRestore) onRestore(data);
                                    }}
                                    disabled={!syncKey || isLoading}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all disabled:opacity-50 ${localIsEmpty
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 scale-105 ring-2 ring-emerald-500/20'
                                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                        }`}
                                >
                                    <Download size={24} />
                                    <span className="font-bold">Restore Data</span>
                                    <span className="text-[10px] opacity-70">{localIsEmpty ? "Recommended" : "Force Download"}</span>
                                </button>
                            </div>

                            {syncKey && (
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] text-center font-medium">
                                    ✨ Auto-Sync is protecting your data in the background.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
