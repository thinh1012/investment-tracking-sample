/**
 * [SCOUT_WATCHTOWER] - Protocol Tracking & Market Picks Management
 * Provides protocol monitoring, picks management, and watchtower scheduling.
 */

// Tracked protocols storage (slug -> url)
const trackedProtocols: Map<string, string> = new Map();
const marketPicks: { symbol: string; slug: string }[] = [];
let watchtowerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Get all tracked protocol slugs as an array
 */
export function getTrackedProtocols(): string[] {
    return Array.from(trackedProtocols.keys());
}

/**
 * Get tracked protocols as Map (for internal use)
 */
export function getTrackedProtocolsMap(): Map<string, string> {
    return new Map(trackedProtocols);
}

/**
 * Track a new protocol - returns true on success
 */
export function trackProtocol(slug: string, url?: string): boolean {
    if (!slug) return false;
    trackedProtocols.set(slug, url || '');
    console.log(`[WATCHTOWER] Tracking protocol: ${slug}`);
    return true;
}

/**
 * Get all market picks
 */
export function getAllPicks(): { symbol: string; slug: string }[] {
    return [...marketPicks];
}

/**
 * Ingest user notes and extract protocol references
 */
export function ingestUserNotes(
    noteContent: string,
    onProtocolFound: (slug: string, url: string) => void
): string[] {
    const discovered: string[] = [];

    // Simple URL extraction pattern
    const urlPattern = /https?:\/\/[^\s]+/g;
    const matches = noteContent.match(urlPattern) || [];

    for (const url of matches) {
        try {
            const urlObj = new URL(url);
            const slug = urlObj.hostname.replace('www.', '').split('.')[0];

            if (slug && !trackedProtocols.has(slug)) {
                onProtocolFound(slug, url);
                discovered.push(slug);
            }
        } catch {
            // Skip invalid URLs
        }
    }

    return discovered;
}

/**
 * Start the watchtower cycle with a callback
 */
export function startWatchtower(onCycle: () => void): void {
    if (watchtowerInterval) {
        console.log('[WATCHTOWER] Already running.');
        return;
    }

    console.log('[WATCHTOWER] 🔭 Starting watchtower...');

    // Run immediately
    onCycle();

    // Then run every 30 minutes
    watchtowerInterval = setInterval(onCycle, 30 * 60 * 1000);
}

/**
 * Stop the watchtower
 */
export function stopWatchtower(): void {
    if (watchtowerInterval) {
        clearInterval(watchtowerInterval);
        watchtowerInterval = null;
        console.log('[WATCHTOWER] 🛑 Stopped.');
    }
}
