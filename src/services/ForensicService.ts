/**
 * ForensicService - Truth Reconciliation Workflow
 * 
 * [PHASE 65] Provides methods to flag suspicious data, fetch fidelity alerts,
 * and perform truth reconciliation against historical sources.
 */

import { ExternalScoutService } from './ExternalScoutService';
import { SCOUT_URL } from '../config/scoutConfig';

interface FidelityAlert {
    id: number;
    label: string;
    timestamp: number;
    outlier_value: string;
    status: 'PENDING' | 'CAPTURED' | 'RESOLVED';
    debug_screenshot?: string;
    debug_html?: string;
    created_at: number;
}

interface ReconciliationResult {
    alertId: number;
    label: string;
    scoutValue: number | null;
    truthValue: number | null;
    delta: number | null;
    severity: 'OK' | 'WARNING' | 'CRITICAL';
    suggestion: string;
}

class ForensicService {
    /**
     * Get all pending fidelity alerts from the Satellite
     */
    static async getPendingAlerts(): Promise<FidelityAlert[]> {
        try {
            const scoutUrl = SCOUT_URL;
            const response = await fetch(`${scoutUrl}/fidelity/alerts?status=PENDING`);
            const data = await response.json();

            if (data.status === 'success') {
                return data.alerts || [];
            }
            return [];
        } catch (err) {
            console.error('[FORENSIC] Failed to fetch alerts:', err);
            return [];
        }
    }

    /**
     * Flag a suspicious value for investigation
     */
    static async flagSuspiciousValue(label: string, value?: string, timestamp?: number): Promise<boolean> {
        try {
            const scoutUrl = SCOUT_URL;
            const response = await fetch(`${scoutUrl}/fidelity/flag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, value, timestamp })
            });
            const data = await response.json();
            return data.status === 'success';
        } catch (err) {
            console.error('[FORENSIC] Failed to flag value:', err);
            return false;
        }
    }

    /**
     * Request a debug snapshot for an alert
     */
    static async captureSnapshot(alertId: number, url: string, selector: string): Promise<boolean> {
        try {
            const scoutUrl = SCOUT_URL;
            const response = await fetch(`${scoutUrl}/fidelity/snapshot/${alertId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, selector })
            });
            const data = await response.json();
            return data.status === 'success';
        } catch (err) {
            console.error('[FORENSIC] Failed to capture snapshot:', err);
            return false;
        }
    }

    /**
     * Resolve an alert after investigation
     */
    static async resolveAlert(alertId: number, resolution: string): Promise<boolean> {
        try {
            const scoutUrl = SCOUT_URL;
            const response = await fetch(`${scoutUrl}/fidelity/resolve/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolution })
            });
            const data = await response.json();
            return data.status === 'success';
        } catch (err) {
            console.error('[FORENSIC] Failed to resolve alert:', err);
            return false;
        }
    }

    /**
     * Perform truth reconciliation for an alert
     * Compares the flagged value against a truth source (e.g., CoinGecko API)
     */
    static async reconcile(alert: FidelityAlert): Promise<ReconciliationResult> {
        // Parse the scout's recorded value
        const scoutValue = parseFloat(alert.outlier_value.replace(/[%,]/g, '')) || null;

        // For now, we'll use a placeholder for truth value
        // In production, this would query CoinMarketCap/CoinGecko historical API
        let truthValue: number | null = null;
        let suggestion = 'Unable to fetch truth source. Manual verification required.';

        // Calculate delta and severity
        let delta: number | null = null;
        let severity: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

        if (scoutValue !== null && truthValue !== null) {
            delta = Math.abs(scoutValue - truthValue);

            if (delta > 5) {
                severity = 'CRITICAL';
                suggestion = `Major discrepancy detected (Δ${delta.toFixed(2)}%). Selector may be incorrect.`;
            } else if (delta > 1) {
                severity = 'WARNING';
                suggestion = `Minor discrepancy (Δ${delta.toFixed(2)}%). May be timing-related.`;
            } else {
                suggestion = 'Values match within acceptable tolerance.';
            }
        }

        return {
            alertId: alert.id,
            label: alert.label,
            scoutValue,
            truthValue,
            delta,
            severity,
            suggestion
        };
    }
}

export { ForensicService };
export type { FidelityAlert, ReconciliationResult };
