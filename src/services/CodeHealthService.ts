
import healthData from '../data/code-health.json';

export interface FileStats {
    name: string;
    lines: number;
    todos: number;
    size: number;
}

export interface CodeHealthReport {
    timestamp: number;
    totalFiles: number;
    totalLines: number;
    totalTodos: number;
    riskScore: number;
    topOffenders: FileStats[];
}

export const CodeHealthService = {
    getReport(): CodeHealthReport {
        // In a real app, this might fetch from an API. 
        // Here we import the build-time JSON.
        return healthData as CodeHealthReport;
    },

    getHealthStatus(score: number): { label: string; color: string } {
        if (score < 20) return { label: 'EXCELLENT', color: 'text-emerald-500' };
        if (score < 50) return { label: 'GOOD', color: 'text-blue-500' };
        if (score < 80) return { label: 'DEGRADED', color: 'text-orange-500' };
        return { label: 'CRITICAL', color: 'text-red-600' };
    }
};
