import { initDB } from './core';
import { ScoutReport } from './types';

export const ScoutService = {
    async saveReport(report: ScoutReport) {
        const db = await initDB();
        return db.put('scout_reports', report);
    },

    async getRecent(limit: number = 10): Promise<ScoutReport[]> {
        const db = await initDB();
        const reports = await db.getAll('scout_reports');
        return reports
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limit);
    },

    async getLatest(): Promise<ScoutReport | undefined> {
        const recent = await this.getRecent(1);
        return recent[0];
    }
};
