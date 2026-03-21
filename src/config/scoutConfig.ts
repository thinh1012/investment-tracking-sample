/**
 * Scout Configuration
 * Centralized configuration for Satellite Scout service URL.
 * 
 * When Scout runs on Ubuntu (production):
 *   VITE_SCOUT_URL=http://192.168.1.131:4000
 * 
 * When Scout runs locally (development):
 *   VITE_SCOUT_URL=http://localhost:4000 (or omit for default)
 */

export const SCOUT_URL = import.meta.env.VITE_SCOUT_URL || 'http://localhost:4000';

// Debug: Log Scout URL on startup
console.log('[SCOUT_CONFIG] 🛰️ SCOUT_URL =', SCOUT_URL, '| Remote:', !SCOUT_URL.includes('localhost'));

/**
 * Whether the Scout is running remotely (on Ubuntu).
 * When remote, we don't try to wake up the scheduler since it runs on its own.
 */
export const IS_REMOTE_SCOUT = !SCOUT_URL.includes('localhost');

/**
 * Get the full Scout API endpoint
 */
export function getScoutEndpoint(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SCOUT_URL}${cleanPath}`;
}
