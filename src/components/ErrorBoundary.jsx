import React from 'react';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        if (confirm("Warning: This will clear all local settings and might resolve startup crashes. Your transactions are safe in the database. Continue?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 text-rose-600 mb-4">
                            <AlertCircle size={32} />
                            <h1 className="text-2xl font-bold">Something went wrong</h1>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            The application encountered an unexpected error and had to stop.
                            This prevents further data corruption.
                        </p>

                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-400 overflow-auto max-h-48 mb-6 border border-slate-200 dark:border-slate-700">
                            {this.state.error?.toString()}
                            {this.state.error?.stack && (
                                <div className="mt-2 text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}...
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                <RotateCcw size={18} />
                                Reload App
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800 px-4 py-3 rounded-lg font-medium transition-colors"
                            >
                                <Trash2 size={18} />
                                Reset Data
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
