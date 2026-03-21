/**
 * [AUTO_SCOUT_REGISTRATION_SERVICE]
 * Automatically registers new assets with Scout for price tracking.
 * 
 * Features:
 * - Detects when user adds a new asset
 * - Filters out LP tokens (they don't have tradeable prices)
 * - Handles ambiguous symbols via disambiguation modal
 * - Creates Scout missions automatically
 * - Saves user choices for future transactions
 */

import { ScoutAliasService, AmbiguousTokenOption, ResolutionResult } from './scout/ScoutAliasService';
import { SCOUT_URL } from '../config/scoutConfig';

// LP token patterns - these don't have individual prices
const LP_PATTERNS = ['LP', 'PRJX', 'SWAP', 'MMT', 'UNI-V2', 'UNI-V3', 'CAKE-LP', 'SLP'];

// Types for Scout mission configuration
interface ScoutMission {
    id: string;
    label: string;
    url: string;
    selector: string;
    frequency: number;
    minWait: string;
    maxWait: string;
    reactionDelay: string;
    fallbacks?: Array<{ url: string; selector: string }>;
}

interface RegistrationResult {
    success: boolean;
    requiresDisambiguation: boolean;
    ambiguousOptions?: AmbiguousTokenOption[];
    message: string;
    missionId?: string;
}

class AutoScoutRegistrationServiceClass {
    private pendingRegistrations: Map<string, ResolutionResult> = new Map();

    /**
     * Check if a symbol represents an LP token (non-tradeable).
     */
    isLPToken(symbol: string): boolean {
        const upperSymbol = symbol.toUpperCase();
        return LP_PATTERNS.some(pattern => upperSymbol.includes(pattern));
    }

    /**
     * Check if Scout is currently online.
     */
    async isScoutOnline(): Promise<boolean> {
        try {
            const response = await fetch(`${SCOUT_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Check if a symbol is already being tracked by Scout.
     */
    async isAlreadyTracked(symbol: string): Promise<boolean> {
        try {
            const response = await fetch(`${SCOUT_URL}/presets`);
            if (!response.ok) return false;

            const presets = await response.json();
            const label = `${symbol.toUpperCase()}_PRICE`;
            return presets.some((preset: ScoutMission) => preset.label === label);
        } catch {
            return false;
        }
    }

    /**
     * Attempt to register a new asset with Scout.
     * Returns information about whether disambiguation is needed.
     */
    async attemptRegistration(symbol: string): Promise<RegistrationResult> {
        console.log(`[AUTO-SCOUT] 🔍 Checking registration for: ${symbol}`);

        // Step 1: Filter LP tokens
        if (this.isLPToken(symbol)) {
            console.log(`[AUTO-SCOUT] ⏭️ Skipping ${symbol} (LP token)`);
            return {
                success: false,
                requiresDisambiguation: false,
                message: 'LP tokens do not have individual prices'
            };
        }

        // Step 2: Check if Scout is online
        const scoutOnline = await this.isScoutOnline();
        if (!scoutOnline) {
            console.log(`[AUTO-SCOUT] ⚠️ Scout offline, queuing ${symbol} for later`);
            return {
                success: false,
                requiresDisambiguation: false,
                message: 'Scout service is offline. Registration queued for later.'
            };
        }

        // Step 3: Check if already tracked
        const alreadyTracked = await this.isAlreadyTracked(symbol);
        if (alreadyTracked) {
            console.log(`[AUTO-SCOUT] ✅ ${symbol} already tracked`);
            return {
                success: true,
                requiresDisambiguation: false,
                message: `${symbol} is already being tracked by Scout`
            };
        }

        // Step 4: Resolve with confidence check
        const resolution = await ScoutAliasService.resolveWithConfidence(symbol);
        console.log(`[AUTO-SCOUT] Resolution result:`, resolution);

        // Store resolution for later use
        this.pendingRegistrations.set(symbol.toUpperCase(), resolution);

        // Step 5: Check if disambiguation is needed
        if (resolution.requiresConfirmation && resolution.alternatives && resolution.alternatives.length > 1) {
            console.log(`[AUTO-SCOUT] 🔀 Disambiguation required for ${symbol}`);
            return {
                success: false,
                requiresDisambiguation: true,
                ambiguousOptions: resolution.alternatives,
                message: `Multiple tokens use the symbol "${symbol}". Please select the correct one.`
            };
        }

        // Step 6: Auto-register if high confidence
        if (resolution.confidence === 'high' && resolution.primary) {
            return await this.registerMission(symbol, resolution.primary.coingeckoId!, resolution.primary.cmcSlug!);
        }

        // Step 7: Medium/low confidence but no alternatives - proceed with warning
        if (resolution.primary) {
            console.log(`[AUTO-SCOUT] ⚠️ Proceeding with ${resolution.confidence} confidence for ${symbol}`);
            return await this.registerMission(symbol, resolution.primary.coingeckoId!, resolution.primary.cmcSlug!);
        }

        // Step 8: Unknown symbol - can't register
        console.log(`[AUTO-SCOUT] ❌ Unknown symbol: ${symbol}`);
        return {
            success: false,
            requiresDisambiguation: false,
            message: `Unknown token: ${symbol}. Please add to aliases manually.`
        };
    }

    /**
     * Complete registration after user disambiguation.
     */
    async completeRegistrationWithChoice(symbol: string, choice: AmbiguousTokenOption): Promise<RegistrationResult> {
        console.log(`[AUTO-SCOUT] ✅ User selected: ${choice.name} for ${symbol}`);

        // Clear pending registration
        this.pendingRegistrations.delete(symbol.toUpperCase());

        // Register the mission
        return await this.registerMission(symbol, choice.coingeckoId, choice.cmcSlug);
    }

    /**
     * Skip registration for a symbol.
     */
    skipRegistration(symbol: string): void {
        console.log(`[AUTO-SCOUT] ⏭️ User skipped registration for ${symbol}`);
        this.pendingRegistrations.delete(symbol.toUpperCase());
    }

    /**
     * Create and register a Scout mission.
     */
    private async registerMission(symbol: string, coingeckoId: string, cmcSlug: string): Promise<RegistrationResult> {
        const mission: ScoutMission = {
            id: Date.now().toString(),
            label: `${symbol.toUpperCase()}_PRICE`,
            url: `https://coinmarketcap.com/currencies/${cmcSlug}/`,
            selector: "[data-test='text-cdp-price-display']",
            frequency: 2, // Every 2 Watchtower cycles (12 hours)
            minWait: "3000",
            maxWait: "8000",
            reactionDelay: "2000",
            fallbacks: [
                {
                    url: `https://www.coingecko.com/en/coins/${coingeckoId}`,
                    selector: ".no-wrap"
                }
            ]
        };

        try {
            const response = await fetch(`${SCOUT_URL}/presets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mission)
            });

            if (!response.ok) {
                throw new Error(`Failed to register mission: ${response.status}`);
            }

            console.log(`[AUTO-SCOUT] ✅ Mission registered: ${mission.label}`);

            // Trigger initial scrape
            try {
                await fetch(`${SCOUT_URL}/missions/run/${mission.id}`, { method: 'POST' });
                console.log(`[AUTO-SCOUT] 🚀 Initial scrape triggered for ${symbol}`);
            } catch {
                console.log(`[AUTO-SCOUT] ⚠️ Could not trigger initial scrape, will run on next cycle`);
            }

            return {
                success: true,
                requiresDisambiguation: false,
                message: `${symbol} registered for price tracking`,
                missionId: mission.id
            };
        } catch (error: any) {
            console.error(`[AUTO-SCOUT] ❌ Registration failed:`, error);
            return {
                success: false,
                requiresDisambiguation: false,
                message: `Failed to register ${symbol}: ${error.message}`
            };
        }
    }

    /**
     * Get pending disambiguation for a symbol.
     */
    getPendingDisambiguation(symbol: string): ResolutionResult | undefined {
        return this.pendingRegistrations.get(symbol.toUpperCase());
    }

    /**
     * Check if a symbol needs disambiguation.
     */
    async needsDisambiguation(symbol: string): Promise<boolean> {
        const resolution = await ScoutAliasService.resolveWithConfidence(symbol);
        return resolution.requiresConfirmation && (resolution.alternatives?.length ?? 0) > 1;
    }
}

export const AutoScoutRegistrationService = new AutoScoutRegistrationServiceClass();
