
/**
 * [DATA_SCOUT] Ops Console Bridge
 * Connects the Dashboard to the underlying Scout Service via shared storage/events.
 */
/**
 * [DATA_SCOUT] Ops Console Bridge
 * Connects the Dashboard to the underlying Scout Service via shared storage/events.
 * Implements direct DB access to 'crypto-investment-db' to bypass package isolation.
 */
export const scoutService = {
    getTrackedProtocols(): string[] {
        const stored = localStorage.getItem('scout_tracked_protocols');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        // Default fallback if nothing in storage yet
        return ['pendle', 'pump', 'yield-basis'];
    },

    async getReport(): Promise<any> {
        // In a real implementation, this might fetch from an API or DB
        // For Ops Console, we'll try to read the latest report from DB if possible
        // or return a stub.
        return null;
    },

    /**
     * [AGENT_COMMAND]: Injects high-fidelity data from a browser-agent scouting mission.
     * Uses raw IndexedDB to write to the shared Vault database.
     */
    async injectAgenticReport(report: any) {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.open('crypto-investment-db', 14);

            request.onerror = (event) => {
                console.error("[SCOUT_BRIDGE] DB Open Error:", request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                const db = request.result;
                try {
                    const tx = db.transaction(['scout_reports'], 'readwrite');
                    const store = tx.objectStore('scout_reports');

                    // 1. Get current data (for merging) or use fallback
                    // We'll just create a new entry for now with merged data
                    const scoutReport = {
                        timestamp: Date.now(),
                        stables: { totalCap: 0, change24h: 0 }, // Stub defaults
                        ecosystems: {},
                        sentiment: { value: 50, label: 'Neutral' },
                        dominance: { btc: 0, usdt: 0, usdc: 0, others: 0, othersMarketCap: 0 },
                        ...report, // Merge incoming Agentic Data
                        scoutNote: report.scoutNote || "🚀 [AGENTIC_HARVEST]: Ops Console Injection."
                    };

                    // Put Request
                    const putReq = store.put(scoutReport);

                    putReq.onsuccess = () => {
                        console.log("[SCOUT_BRIDGE] Agentic Report Injected Successfully.");
                        window.dispatchEvent(new Event('strategist_intel_updated'));
                        resolve();
                    };

                    putReq.onerror = () => {
                        console.error("[SCOUT_BRIDGE] Put Failure:", putReq.error);
                        reject(putReq.error);
                    };

                } catch (e) {
                    console.error("[SCOUT_BRIDGE] Transaction Failure (Store might fail if version mismatch):", e);
                    reject(e);
                }
            };
        });
    }
};
