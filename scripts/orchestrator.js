const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// [ARCHITECT] SYSTEM ORCHESTRATOR
// Purpose: One command to launch the entire Digital HQ ecosystem.
// 1. Vault Server (Port 5173) -> Root
// 2. Ops Console Server (Port 5174) -> /ops-console
// 3. Electron HQ (Desktop App) -> Root

const rootDir = path.resolve(__dirname, '..');
const opsDir = path.join(rootDir, 'ops-console');
const logDir = path.join(rootDir, '.system_logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function log(prefix, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${prefix}] ${message}`);
}

function startService(name, command, args, cwd) {
    log('SYSTEM', `Igniting ${name}...`);

    // Windows compatibility: npm is a batch file
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const cleanEnv = { ...process.env, FORCE_COLOR: 'true' };
    delete cleanEnv.ELECTRON_RUN_AS_NODE; // CRITICAL: Stop Electron from booting as Node

    const service = spawn(cmd, args, {
        cwd: cwd,
        env: cleanEnv,
        stdio: 'pipe',
        shell: true
    });

    const logFile = fs.createWriteStream(path.join(logDir, `${name.replace(' ', '_').toLowerCase()}.log`));

    service.stdout.on('data', (data) => {
        logFile.write(data);
        // Only verify "Local" URLs in console to verify startup, keep rest silent to reduce noise
        const output = data.toString();
        if (output.includes('Local:')) {
            log(name.toUpperCase(), `Online at ${output.trim().split('Local:')[1].trim()}`);
        }
    });

    service.stderr.on('data', (data) => {
        logFile.write(data);
        const output = data.toString();
        // Warn only on critical errors
        if (output.includes('Error') && !output.includes('node_modules')) {
            console.error(`[${name}] ⚠️ ${output.trim()}`);
        }
    });

    service.on('close', (code) => {
        log('SYSTEM', `${name} stopped with code ${code}`);
    });

    return service;
}

// --- SEQUENCE START ---

log('SYSTEM', '🚀 Initializing Alpha Vault Digital HQ...');

// 1. Start Vault (Frontend 1)
const vault = startService('Vault Core', 'npm', ['run', 'dev'], rootDir);

// 2. Start Ops Console (Frontend 2)
const ops = startService('Ops Console', 'npm', ['run', 'dev'], opsDir);

// 3. Wait for engines to warm up/bind ports
log('SYSTEM', 'Waiting for network protocols (5s)...');

setTimeout(() => {
    log('SYSTEM', '🖥️  Launching Desktop Environment...');

    const cleanEnv = { ...process.env, FORCE_COLOR: 'true' };
    delete cleanEnv.ELECTRON_RUN_AS_NODE;

    // 4. Start Electron (Desktop)
    // We inherit stdio here so the user can interact/close it from the main terminal
    const electron = spawn('npm.cmd', ['run', 'start-hq'], {
        cwd: rootDir,
        env: cleanEnv,
        stdio: 'inherit',
        shell: true
    });

    electron.on('close', () => {
        log('SYSTEM', '🛑 Desktop Closed. Shutting down servers...');
        vault.kill();
        ops.kill();
        process.exit(0);
    });

}, 5000);
