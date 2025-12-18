import React, { useState } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';
import { X, Cloud, Lock, LogIn, Upload, Download, AlertTriangle, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';


import { BackupService } from '../services/db';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onRestore?: (data: any) => void; // Callback when data is downloaded
}

export const CloudSyncModal: React.FC<Props> = ({ isOpen, onClose, onRestore }) => {
    const { user, isLoading, error, status, signIn, signUp, signOut, uploadVault, downloadVault } = useCloudSync();

    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Auth Password
    const [isSignUp, setIsSignUp] = useState(false);

    // Sync State
    const [syncPassword, setSyncPassword] = useState(''); // Encryption Password
    const [showPassword, setShowPassword] = useState(false);


    const handleUpload = async () => {
        try {
            const data = await BackupService.createFullBackup();
            await uploadVault(syncPassword, data);
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
                    <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                        <Cloud size={20} className="text-indigo-500" />
                        Cloud Vault
                    </h2>
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

                            <button
                                onClick={() => isSignUp ? signUp(email, password) : signIn(email, password)}
                                disabled={isLoading || !email || !password}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {isLoading ? <RefreshCw className="animate-spin mx-auto" /> : (isSignUp ? 'Create Vault Account' : 'Open Vault')}
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
                                        value={syncPassword}
                                        onChange={e => setSyncPassword(e.target.value)}
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
                                <p className="text-[10px] text-orange-500 flex items-start gap-1 mt-1">
                                    <AlertTriangle size={10} className="mt-0.5" />
                                    Warning: If you lose this password, your cloud data is gone forever. We cannot recover it.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleUpload}
                                    disabled={!syncPassword || isLoading}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all disabled:opacity-50"
                                >
                                    <Upload size={24} />
                                    <span className="font-bold">Backup</span>
                                    <span className="text-[10px] opacity-70">PC → Cloud</span>
                                </button>

                                <button
                                    onClick={async () => {
                                        const data = await downloadVault(syncPassword);
                                        if (data && onRestore) onRestore(data);
                                    }}
                                    disabled={!syncPassword || isLoading}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all disabled:opacity-50"
                                >
                                    <Download size={24} />
                                    <span className="font-bold">Restore</span>
                                    <span className="text-[10px] opacity-70">Cloud → PC</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
