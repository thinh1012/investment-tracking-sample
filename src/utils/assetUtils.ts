/**
 * [ASSET_UTILS]
 * Centralized helpers for asset property identification and normalization.
 */

// Safe-listed macro metrics that should NOT be treated as LPs
const MACRO_METRICS = new Set(['USDT.D', 'USDC.D', 'BTC.D', 'ETH.D', 'OTHERS.D', 'TOTAL', 'TOTAL2', 'TOTAL3']);

// Generic tags to ignore during decomposition
const IGNORED_TAGS = new Set(['LP', 'UNI', 'V2', 'V3', 'SUSHI', 'CAKE', 'QUICK', 'MMT', 'PRJX', 'YB', 'SWAP', 'POOL']);

/**
 * [PHASE 69 + 71] Hardened LP Detection
 * Identifies if a symbol represents a Liquidity Pool or pair that needs decomposition.
 * 
 * Detection Rules:
 * - Starts with "LP-" (primary convention: LP-ETH-USDC)
 * - Ends with "-LP" (alternative format: ETH-USDC-LP)
 * - Known protocol prefixes (UNI-V2-, UNI-V3-)
 * - [PHASE 71] Contains dash "-" (e.g., SOL-USDC)
 * - [PHASE 71] Contains space " " (e.g., PUMP-HYPE PRJX 2)
 */
export function isLP(symbol: string | undefined): boolean {
    if (!symbol) return false;
    const s = symbol.toUpperCase().trim();

    // Shield macro metrics (e.g., USDT.D, BTC.D)
    if (MACRO_METRICS.has(s)) return false;
    if (s.endsWith('.D')) return false; // All dominance metrics

    // Rule 1: Starts with LP- (Primary system convention)
    if (s.startsWith('LP-')) return true;

    // Rule 2: Ends with -LP (Alternative format)
    if (s.endsWith('-LP')) return true;

    // Rule 3: Known LP protocol prefixes
    if (s.startsWith('UNI-V2-') || s.startsWith('UNI-V3-')) return true;

    // [PHASE 71] Rule 4: Contains dash (e.g., SOL-USDC, PUMP-HYPE)
    if (s.includes('-')) return true;

    // [PHASE 71] Rule 5: Contains space (e.g., PUMP-HYPE PRJX 2)
    if (s.includes(' ')) return true;

    return false;
}

/**
 * Normalizes symbols for consistent lookup
 */
export function normalizeSymbol(symbol: string): string {
    return symbol.toUpperCase().trim();
}

/**
 * [PHASE 70 + 71] LP Decomposition
 * Extracts underlying token symbols from an LP symbol.
 * Example: "LP-ETH-USDC" -> ["ETH", "USDC"]
 * Example: "UNI-V3-SOL-HYPE" -> ["SOL", "HYPE"]
 * Example: "SUI-USDC MMT" -> ["SUI", "USDC"]
 * Example: "PUMP-HYPE PRJX 2" -> ["PUMP", "HYPE"]
 */
export function decomposeLP(symbol: string | undefined): string[] {
    if (!symbol) return [];

    const s = symbol.toUpperCase().trim();

    // Split by both dashes and spaces
    const parts = s.split(/[-\s]+/);

    const tokens = parts.filter(part => {
        // Skip empty parts
        if (part.length === 0) return false;

        // Skip ignored tags
        if (IGNORED_TAGS.has(part)) return false;

        // Skip pure numbers (e.g., "1", "2", "3")
        if (/^\d+$/.test(part)) return false;

        return true;
    });

    // Return unique tokens
    return [...new Set(tokens)];
}
