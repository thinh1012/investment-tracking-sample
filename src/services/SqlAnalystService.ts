import alasql from 'alasql';
import { initDB } from './database/core';
import { supabase } from './supabase';

export class SqlAnalystService {
    private static initialized = false;

    /**
     * Initializes the Global SQL Console
     */
    public static async init() {
        if (this.initialized) return;

        // 1. Expose global function
        (window as any).sql = this.runQuery;

        // 2. Expose Cloud Client
        (window as any).supabase = supabase;

        console.log("📊 [SQL ANALYST] Instant Analyst Ready. Usage:");
        console.log("   Local: sql('SELECT * FROM transactions')");
        console.log("   Cloud: await supabase.from('transactions').select('*')");
        this.initialized = true;
    }

    /**
     * Runs a SQL query, auto-loading tables if referenced
     * @param query SQL Query String
     * @param forceRefresh Whether to bypass cache and reload from DB
     */
    public static async runQuery(query: string, forceRefresh = false) {
        // Simple auto-loader logic based on our known tables
        const knownTables = [
            'transactions', 'watchlist', 'logs', 'market_picks',
            'settings', 'scout_reports', 'scout_sources', 'scout_metrics',
            'strategist_intel', 'manual_prices', 'asset_overrides',
            'historical_prices', 'manual_historical_prices'
        ];

        const sqliteTables = ['scout_metrics', 'scout_reports', 'strategist_intel'];

        for (const table of knownTables) {
            const isTargeted = query.toLowerCase().includes(table);
            const isSqlite = sqliteTables.includes(table);

            // Re-hydrate if:
            // 1. Not loaded yet
            // 2. forceRefresh requested
            // 3. It's a mission-critical SQLite table (always fresh)
            if (isTargeted && (!(alasql.tables[table]) || forceRefresh || isSqlite)) {
                console.log(`[SQL] 📥 ${forceRefresh || isSqlite ? 'Refreshing' : 'Loading'} table: ${table}...`);

                let data: any[] = [];

                // Check if it's a SQLite-backed table
                if (isSqlite && (window as any).electronAPI?.scout?.sqlTableAll) {
                    data = await (window as any).electronAPI.scout.sqlTableAll(table);
                } else {
                    // Default to IndexedDB
                    const db = await initDB();
                    try {
                        data = await db.getAll(table as any);
                    } catch (e) {
                        console.warn(`[SQL] Store ${table} not found in IndexedDB.`);
                        data = [];
                    }
                }

                if (alasql.tables[table]) {
                    alasql(`DROP TABLE ${table}`);
                }
                alasql(`CREATE TABLE ${table}`);
                (alasql.tables[table] as any).data = data;
            }
        }

        try {
            console.time('[SQL] Execution Time');
            const result = alasql(query);
            console.timeEnd('[SQL] Execution Time');
            console.table(result); // Nice visual output
            return result;
        } catch (e) {
            console.error('[SQL] Query Failed:', e);
            return { error: e };
        }
    }
}
