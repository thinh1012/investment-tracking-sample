
import React from 'react';
import { Download, X, Trash2, Clock } from 'lucide-react';

interface BackupToastProps {
    isBackupDue: boolean;
    showCleanupReminder: boolean;
    onBackup: () => void;
    onDismissBackup: () => void;
    onDismissCleanup: () => void;
}

export const BackupToast: React.FC<BackupToastProps> = ({
    isBackupDue,
    showCleanupReminder,
    onBackup,
    onDismissBackup,
    onDismissCleanup
}) => {
    if (!isBackupDue && !showCleanupReminder) return null;

    return (
        <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-50">
            {isBackupDue && (
                <div className="bg-slate-900 border border-emerald-500/30 text-white p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm animate-in slide-in-from-right duration-500">
                    <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                        <Download className="text-emerald-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-emerald-400">Backup Due</h4>
                        <p className="text-slate-300 text-sm mt-1 mb-3">
                            It's been 12 hours. Keep your data safe!
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={onBackup}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold transition-colors"
                            >
                                Download Now
                            </button>
                            <button
                                onClick={onDismissBackup}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-400 transition-colors flex items-center gap-1"
                            >
                                <Clock size={12} /> Snooze 1h
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCleanupReminder && (
                <div className="bg-slate-900 border border-amber-500/30 text-white p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm animate-in slide-in-from-right duration-500 delay-150">
                    <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                        <Trash2 className="text-amber-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-amber-400">Cleanup Reminder</h4>
                        <p className="text-slate-300 text-sm mt-1">
                            You've done 10 backups recently. Check your logic and delete old files to save space on your computer.
                        </p>
                        <button
                            onClick={onDismissCleanup}
                            className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-400 transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
