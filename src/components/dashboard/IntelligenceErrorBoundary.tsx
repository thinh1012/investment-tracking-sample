import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class IntelligenceErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[INTELLIGENCE_BOUNDARY] Error caught:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-red-500/30 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
                    <div className="bg-red-500/20 p-3 rounded-full text-red-400">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200">
                            {this.props.fallbackName || "Intelligence Module"} Unavailable
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm">
                            An error occurred while processing intelligence data. The rest of the dashboard remains operational.
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm border border-slate-600"
                    >
                        <RefreshCw size={14} />
                        Retry Module
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="text-[10px] text-red-500/50 mt-4 max-w-full overflow-hidden text-ellipsis italic">
                            {this.state.error?.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
