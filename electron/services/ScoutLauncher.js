/**
 * ScoutLauncher.js - Detached Commander Pattern
 * 
 * This service launches the sibling Scout Satellite project as an independent,
 * detached process. It does NOT access Scout's code or database.
 * 
 * The goal is "zero friction" for the user: start HQ, and Scout comes up automatically.
 * 
 * [PHASE 100] Updated to handle both development and packaged (production) environments.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Determines the correct path to the Scout Satellite folder.
 * - In development: /investment-tracking/satellite/
 * - In production (packaged): resources/satellite/
 */
function getScoutPath() {
    if (app.isPackaged) {
        // Production: Satellite is bundled as an extraResource
        return path.join(process.resourcesPath, 'satellite');
    } else {
        // Development: Satellite is a sibling folder
        return path.resolve(__dirname, '..', '..', 'satellite');
    }
}

/**
 * Launches the Scout Satellite as a detached, visible process.
 * This function can be called multiple times - each call spawns a new instance.
 * 
 * [REMOTE_SCOUT] If VITE_SCOUT_URL is set to a remote server, we skip launching
 * local Scout since the remote server (e.g., Ubuntu) is running Scout.
 */
function launch() {
    // Check if Scout is configured to run remotely (e.g., on Ubuntu)
    const scoutUrl = process.env.VITE_SCOUT_URL || '';
    if (scoutUrl && !scoutUrl.includes('localhost') && !scoutUrl.includes('127.0.0.1')) {
        console.log('[SCOUT_LAUNCHER] Remote Scout configured:', scoutUrl);
        console.log('[SCOUT_LAUNCHER] Skipping local Scout launch (Ubuntu Scout runs independently)');
        return;
    }

    const SCOUT_PROJECT_DIR = getScoutPath();
    const SCOUT_ENTRY_POINT = path.join(SCOUT_PROJECT_DIR, 'server.js');

    console.log('[SCOUT_LAUNCHER] Attempting to launch Scout...');
    console.log('[SCOUT_LAUNCHER] Scout directory:', SCOUT_PROJECT_DIR);
    console.log('[SCOUT_LAUNCHER] Is Packaged:', app.isPackaged);

    if (!fs.existsSync(SCOUT_PROJECT_DIR)) {
        console.warn('[SCOUT_LAUNCHER] ⚠️ Scout project not found at:', SCOUT_PROJECT_DIR);
        console.warn('[SCOUT_LAUNCHER] The Satellite will need to be started manually.');
        return;
    }

    if (!fs.existsSync(SCOUT_ENTRY_POINT)) {
        console.warn('[SCOUT_LAUNCHER] ⚠️ Scout entry point (server.js) not found.');
        return;
    }

    console.log('[SCOUT_LAUNCHER] 🚀 Launching Scout Satellite...');

    try {
        const isWindows = process.platform === 'win32';

        if (app.isPackaged) {
            // Production Mode: Use bundled portable Node.js
            const nodePath = path.join(process.resourcesPath, 'portable-node', 'node.exe');

            if (!fs.existsSync(nodePath)) {
                console.warn('[SCOUT_LAUNCHER] ⚠️ Bundled Node.js not found at:', nodePath);
                return;
            }

            const child = spawn(nodePath, [SCOUT_ENTRY_POINT], {
                cwd: SCOUT_PROJECT_DIR,
                detached: true,
                stdio: 'ignore',
                windowsHide: false
            });

            child.unref();
            console.log('[SCOUT_LAUNCHER] ✅ Scout Satellite launched (Production Mode, PID:', child.pid, ')');
        } else {
            // Development Mode: Use npm run desktop for the full experience
            const command = isWindows
                ? `cmd.exe /k "cd /d ${SCOUT_PROJECT_DIR} && npm run desktop"`
                : `cd ${SCOUT_PROJECT_DIR} && npm run desktop`;

            const child = spawn(command, [], {
                cwd: SCOUT_PROJECT_DIR,
                detached: true,
                stdio: 'ignore',
                shell: true,
                windowsHide: false
            });

            child.unref();
            console.log('[SCOUT_LAUNCHER] ✅ Scout Satellite launched (Dev Mode, PID:', child.pid, ')');
        }

    } catch (err) {
        console.error('[SCOUT_LAUNCHER] ❌ Failed to launch Scout:', err.message);
    }
}

module.exports = {
    launch
};
