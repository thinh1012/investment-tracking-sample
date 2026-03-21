// Load environment variables FIRST (fixes Supabase connection in Electron)
require('./env-loader');

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'electron_startup.log');
function bootLog(msg) {
    try {
        fs.appendFileSync(logFile, `[${new Date().toLocaleTimeString()}] ${msg}\n`);
    } catch (e) { }
}

bootLog(`BOOT: Start. PID: ${process.pid}`);
bootLog(`ARGV: ${JSON.stringify(process.argv)}`);
bootLog(`ENV_RUN_AS_NODE: ${process.env.ELECTRON_RUN_AS_NODE}`);

// ---------------------------------------------------------
// STANDARD STARTUP (Safe Zone)
// ---------------------------------------------------------

bootLog("SAFE ZONE: Proceeding to load app...");

// ---------------------------------------------------------
// STANDARD STARTUP (Safe Zone)
// ---------------------------------------------------------

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');

// [PHASE 20] Environment Guard: If ELECTRON_RUN_AS_NODE=1, ipcMain will be undefined
if (!ipcMain || !app) {
    const errorMsg = `CRITICAL: Electron modules (ipcMain/app) are undefined. Check ELECTRON_RUN_AS_NODE environment variable.`;
    bootLog(errorMsg);
    console.error(errorMsg);
    process.exit(1);
}
const https = require('https');
const StealthScout = require('./services/StealthScout'); // [NEW] Visible Scout Service
const scoutLauncher = require('./services/ScoutLauncher'); // [PHASE_74] Detached Scout Commander
let Database;
try {
    Database = require('better-sqlite3');
} catch (e) {
    console.error("FAILED TO LOAD SQLITE:", e);
    Database = null;
}

const isHQ = process.argv.includes('--hq');
let db;
let tray = null;
let mainWindow = null;

// [RESILIENCE] Catch all main process crashes
process.on('uncaughtException', (err) => {
    bootLog(`FATAL_CRASH (Uncaught): ${err.message}\n${err.stack}`);
    console.error("FATAL_CRASH:", err);
});

process.on('unhandledRejection', (reason, p) => {
    bootLog(`FATAL_CRASH (Rejection): ${reason}`);
    console.error("FATAL_REJECTION:", reason);
});

// Initialize Database
if (Database) {
    try {
        const dbPath = path.join(app.getPath('userData'), 'intelligence.db');
        db = new Database(dbPath);
        db.exec(`
            CREATE TABLE IF NOT EXISTS strategist_intel (
                symbol TEXT PRIMARY KEY,
                metrics TEXT,
                verdict TEXT,
                rating TEXT,
                updatedAt INTEGER
            )
        `);
        db.exec(`
            CREATE TABLE IF NOT EXISTS scout_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                displayTime TEXT,
                sourceUrl TEXT,
                label TEXT,
                metricValue TEXT,
                dataType TEXT,
                fullPayload TEXT
            )
        `);
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
} else {
    console.warn("RUNNING IN NO-SQL MODE (Database Binary Mismatch)");
}

// SQL Intel Bridge
ipcMain.handle('sql-intel-save', (event, intel) => {
    try {
        const { symbol, metrics, verdict, rating, updatedAt } = intel;
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO strategist_intel (symbol, metrics, verdict, rating, updatedAt)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(symbol.toUpperCase(), JSON.stringify(metrics), verdict, rating, updatedAt);
        return true;
    } catch (e) {
        return false;
    }
});

ipcMain.handle('sql-intel-get', (event, symbol) => {
    try {
        const stmt = db.prepare('SELECT * FROM strategist_intel WHERE symbol = ?');
        const row = stmt.get(symbol.toUpperCase());
        if (row) {
            return {
                ...row,
                metrics: JSON.parse(row.metrics)
            };
        }
        return null;
    } catch (e) {
        return null;
    }
});

ipcMain.handle('sql-table-all', (event, tableName) => {
    try {
        if (!db) return [];
        const allowed = ['scout_metrics', 'scout_reports', 'strategist_intel'];
        if (!allowed.includes(tableName)) {
            console.error(`[SQL_BRIDGE] Blocked unauthorized table access: ${tableName}`);
            return [];
        }

        const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY ${tableName === 'strategist_intel' ? 'updatedAt' : 'timestamp'} DESC`);
        const rows = stmt.all();

        // Auto-parse JSON columns for frontend convenience
        return rows.map(row => {
            const parsed = { ...row };
            if (tableName === 'strategist_intel' && row.metrics) {
                try { parsed.metrics = JSON.parse(row.metrics); } catch (e) { }
            }
            if (tableName === 'scout_reports' && row.dominance) {
                try { parsed.dominance = JSON.parse(row.dominance); } catch (e) { }
            }
            return parsed;
        });
    } catch (e) {
        console.error(`[SQL_BRIDGE] Failed to fetch ${tableName}:`, e);
        return [];
    }
});

// Data Persistence Bridge (Backups)
ipcMain.handle('save-backup-to-disk', async (event, { data, filename }) => {
    try {
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const filePath = path.join(backupDir, filename);
        fs.writeFileSync(filePath, data, 'utf-8');
        bootLog(`[BACKUP] 💾 Backup saved to disk: ${filePath}`);
        return { success: true, path: filePath };
    } catch (e) {
        bootLog(`[BACKUP_ERROR] Failed to save backup: ${e.message}`);
        return { success: false, error: e.message };
    }
});

// Supabase Diagnostic Bridge
ipcMain.handle('supabase-test', async () => {
    try {
        bootLog(`[SUPABASE_TEST] 📡 Starting Main Process Test...`);
        const { createClient } = require('@supabase/supabase-js');
        const url = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_ANON_KEY;

        if (!url || !key) {
            bootLog(`[SUPABASE_TEST] ❌ Missing credentials in main process.`);
            return { success: false, error: 'Missing credentials' };
        }

        const client = createClient(url, key);
        const { data, error } = await client.from('user_vaults').select('count', { count: 'exact', head: true });

        if (error) {
            bootLog(`[SUPABASE_TEST] ❌ Query failed: ${error.message}`);
            return { success: false, error: error.message };
        }

        bootLog(`[SUPABASE_TEST] ✅ Successful connection to Supabase.`);
        return { success: true, message: 'Main Process connection successful.' };
    } catch (e) {
        bootLog(`[SUPABASE_TEST] 💥 Exception: ${e.message}`);
        return { success: false, error: e.message };
    }
});

// Project Ledger Bridge (MoM)
ipcMain.handle('get-project-logs', async () => {
    try {
        const logPath = 'c:\\Users\\ducth\\.gemini\\antigravity\\brain\\51ba8aaf-668d-4253-84e7-42bb4d67d0ad\\task.md';

        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf-8');
            if (!content) return "ERROR: File was empty";
            return content;
        }

        return `ERROR: File not found at ${logPath}`;
    } catch (e) {
        console.error("[LEDGER] Read Error:", e);
        return `ERROR: Exception reading file: ${e.message}`;
    }
});

// Data Scout Bridge
// Data Scout Bridge
const scoutAgent = require('./services/ScoutAgent');

ipcMain.handle('scout-refill', async () => {
    // REAL AGENTIC SCRAPING
    const results = await scoutAgent.runMission();

    // [DATA_COURIER] DEAD DROP PROTOCOL
    // Save to disk so that if the UI is closed, the data survives.
    // The UI will pick this up on next launch via 'scout-retrieve-packet'.
    const packetPath = path.join(app.getPath('userData'), 'scout_packet.json');
    try {
        fs.writeFileSync(packetPath, JSON.stringify(results), 'utf-8');
        console.log(`[DATA_COURIER] 📦 Package secured at: ${packetPath}`);
    } catch (e) {
        console.error("[DATA_COURIER] Failed to save packet:", e);
    }

    return {
        success: true,
        message: `Agentic Harvest Complete. Captured: ${Object.keys(results).join(', ')}`,
        data: results
    };
});

ipcMain.handle('scout-retrieve-packet', async () => {
    const packetPath = path.join(app.getPath('userData'), 'scout_packet.json');
    if (fs.existsSync(packetPath)) {
        try {
            const content = fs.readFileSync(packetPath, 'utf-8');
            const data = JSON.parse(content);
            // Burn after reading (consume the packet)
            fs.unlinkSync(packetPath);
            console.log("[DATA_COURIER] 📬 Package delivered to Renderer.");
            return { success: true, data };
        } catch (e) {
            console.error("[DATA_COURIER] Failed to retrieve packet:", e);
            return { success: false };
        }
    }
    return { success: false, message: "No package found." };
});

ipcMain.handle('scout-set-delay', (event, { min, max }) => {
    scoutAgent.setDelayRange(min, max);
    return true;
});

ipcMain.handle('scout-get-google-news', async (event, symbol) => {
    return new Promise((resolve) => {
        console.log(`[ELECTRON] Fetching CryptoPanic News for: ${symbol}`);
        const url = `https://cryptopanic.com/news/rss/?currency=${symbol}`;

        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(`[ELECTRON] CryptoPanic API Error: ${res.statusCode}`);
                    resolve("");
                } else {
                    resolve(data)
                }
            });
        });

        req.on('error', (err) => {
            console.error("[ELECTRON] CryptoPanic Network Error:", err);
            resolve("");
        });
    });
});

// [IPC BRIDGE] Relay Scout Data to All Windows
ipcMain.handle('scout-broadcast', (event, data) => {
    bootLog("[IPC_BRIDGE] Broadcasting Scout Data to all windows...");
    BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('scout-broadcast-receive', data);
    });
    return true;
});

function createTray() {
    if (tray) return;
    try {
        let icon;
        const iconPath = path.join(__dirname, '../public/favicon.ico');

        if (fs.existsSync(iconPath)) {
            icon = nativeImage.createFromPath(iconPath);
        } else {
            bootLog("SYS_TRAY_WARNING: No icon found. Using transparent placeholder.");
            // 1x1 Transparent pixel
            icon = nativeImage.createFromBuffer(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
        }

        tray = new Tray(icon);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Alpha Vault Intelligence', enabled: false },
            { type: 'separator' },
            { label: 'Show Dashboard', click: () => { if (mainWindow) mainWindow.show(); } },
            { label: 'Wake Scout Satellite', click: () => { scoutLauncher.launch(); } },
            { label: 'Restart Agent', click: () => { app.relaunch(); app.exit(); } },
            { type: 'separator' },
            { label: 'Exit Full System', click: () => { app.isQuitting = true; app.quit(); } }
        ]);

        tray.setToolTip('Alpha Vault: Digital HQ');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        bootLog("SYS_TRAY: Initialized successfully.");
    } catch (e) {
        bootLog(`SYS_TRAY_ERROR: ${e.message}`);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#020617',
        title: isHQ ? "Digital HQ - Ops Console" : "Alpha Vault - Secure Terminal",
        icon: path.join(__dirname, '../public/favicon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false, // Disabled to allow Supabase API calls
            sandbox: false // Ensure access to process.env in preload
        }
    });

    // [FIX] Configure CSP to allow Supabase connections
    const { session } = require('electron');
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const csp = [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
            "connect-src 'self' http://localhost:* http://127.0.0.1:* http://192.168.1.131:* https://*.supabase.co https://supabase.co https://*.telegram.org https://api.telegram.org https://api.emailjs.com https://coinmarketcap.com https://www.tradingview.com https://api.coingecko.com https://api.binance.com wss://*.supabase.co https://api.dexscreener.com https://min-api.cryptocompare.com",
            "img-src 'self' data: blob: https://*",
            "font-src 'self' https://fonts.gstatic.com data:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        ].join('; ');

        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [csp]
            }
        });
    });

    const distPath = path.join(__dirname, '../dist/index.html');
    const hqUrl = process.env.VITE_HQ_SERVER_URL || 'http://127.0.0.1:5174';
    const targetUrl = `${hqUrl}?session=${Date.now()}`;

    // [INTELLIGENT_LOADER]:
    // Primary load attempt. Error handling is delegated to 'did-fail-load'.
    if (isHQ || process.env.NODE_ENV === 'development') {
        bootLog(`INIT_LOAD (DEV_SEARCH): ${targetUrl}`);
        mainWindow.loadURL(targetUrl);
    } else {
        bootLog(`INIT_LOAD (PROD): ${distPath}`);
        if (fs.existsSync(distPath)) {
            mainWindow.loadFile(distPath);
        } else {
            bootLog("FATAL: dist missing. Falling back to dev URL.");
            mainWindow.loadURL(targetUrl);
        }
    }

    // CONFIRM SCRIPT IS ACTIVE
    mainWindow.setTitle(isHQ ? "Digital HQ - Ops Console [ACTIVE]" : "Alpha Vault - Secure Terminal [ACTIVE]");

    mainWindow.webContents.on('did-finish-load', () => {
        bootLog(`LOAD_SUCCESS: Window ready.`);
    });

    // Handle Close vs Quit
    mainWindow.on('close', (event) => {
        // [SERVICE MODE]: Default behavior is to minimize to tray, NOT quit.
        // This ensures background agents (Scout) keep running.
        if (!process.env.IS_TEST && !app.isQuitting) {
            event.preventDefault(); // Don't kill app
            mainWindow.hide(); // Just hide window
            bootLog("WIN_STATE: Minimized to Tray (Background Mode)");
        }
        // If app.isQuitting is true (from Tray), we let it close naturally.
    });

    // ROBUST ERROR CATCHING
    let recoveryAttempted = false;
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        // Prevent recursive recovery loops
        if (recoveryAttempted) return;

        bootLog(`[LOAD_ERROR] Code: ${errorCode} | Desc: ${errorDescription} | URL: ${validatedURL}`);

        // If it's a connection error to the dev server, try falling back to the local build folder!
        if ((errorCode === -102 || errorCode === -105 || errorCode === -6) && validatedURL.includes('127.0.0.1')) {
            const distPath = path.join(__dirname, '../dist/index.html');
            if (fs.existsSync(distPath)) {
                recoveryAttempted = true;
                bootLog(`[RECOVERY_PIVOT] Dev server down. Switching to offline build: ${distPath}`);
                mainWindow.loadFile(distPath);
                return;
            }
        }

        // Only open DevTools if it's NOT a recovery attempt failing (to avoid distraction)
        if (!recoveryAttempted && !validatedURL.startsWith('data:')) {
            mainWindow.webContents.openDevTools();
        }
    });

    // PIPE RENDERER LOGS
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        bootLog(`[RENDERER] ${message} (${sourceId}:${line})`);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            require('electron').shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
    createWindow();
    createTray(); // Always create tray now

    // [PHASE_74] Launch independent Scout Satellite on startup
    scoutLauncher.launch();

    bootLog("MODE: Digital HQ Service (Tray Enabled)");

    // [SHELL] Open External Browser
    ipcMain.handle('open-external', async (event, url) => {
        if (url.startsWith('http')) {
            require('electron').shell.openExternal(url);
            return true;
        }
        return false;
    });

    // [PHASE 74] Wake Scout Satellite from UI
    ipcMain.handle('wake-scout-satellite', async () => {
        scoutLauncher.launch();
        return true;
    });

    // [SCOUT] Manual Mission Trigger (from Frontend Settings)
    ipcMain.handle('start-scout', async (event, { url, type, data }) => {
        bootLog(`[OPS_PROBE] start-scout handler ENTERED. URL: ${url}`);
        bootLog(`[CMD] User requested Scout Mission: ${type} -> ${url}`);

        const targetUrl = url || 'https://www.coinglass.com/bitcoin-etf';
        const targetType = type || 'GENERIC_PAGE_DATA';

        try {
            const results = await StealthScout.runMission(targetUrl, targetType, data || {});

            // Save results to DB if found
            if (results && !results.error && db) {
                const nowUnix = Date.now();
                const now = new Date();
                const displayTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

                try {
                    // 1. Save to Legacy Report (Overview)
                    db.prepare('INSERT INTO scout_reports (timestamp, scoutNote, dominance) VALUES (?, ?, ?)').run(
                        nowUnix,
                        `[VISIBLE_SCOUT] Data from ${targetUrl}: ${JSON.stringify(results.data)}`,
                        JSON.stringify({ note: 'Scout Data Extracted', source: targetUrl, type: results.type })
                    );

                    // 2. Save Structured Metrics (Granular)
                    const stmt = db.prepare(`
                        INSERT INTO scout_metrics (timestamp, displayTime, sourceUrl, label, metricValue, dataType, fullPayload)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);

                    // If the heuristic brain captured multiple pieces (chips), save them as individual signals
                    if (results.data && results.data.captured && Array.isArray(results.data.captured)) {
                        results.data.captured.forEach((chip, index) => {
                            // [VALUATION_PRIORITY]: The user likes Metric 1 the most (index 0)
                            // We save it as the PRIMARY_VALUE for the system to use, and HEURISTIC_CHIP for all.
                            const isPrimary = index === 0;

                            stmt.run(
                                nowUnix,
                                displayTime,
                                targetUrl,
                                isPrimary ? `${results.data.label || 'Metric'} (Primary Valuation)` : `${results.data.label || 'Metric'} (Signal ${index + 1})`,
                                String(chip),
                                isPrimary ? 'PRIMARY_VALUE' : 'HEURISTIC_CHIP',
                                JSON.stringify(results.data)
                            );
                        });
                    } else if (results.data && results.data.value) {
                        // Fallback for simple values
                        stmt.run(
                            nowUnix,
                            displayTime,
                            targetUrl,
                            results.data.label || 'Metric',
                            String(results.data.value),
                            'PRIMARY_VALUE',
                            JSON.stringify(results.data)
                        );
                    }
                } catch (dbErr) {
                    console.error("DB INSERT FAILED:", dbErr);
                }
                return results;
            }
            return results || { error: 'No data found' };
        } catch (scoutErr) {
            console.error("SCOUT RUN FAILED:", scoutErr);
            return { error: scoutErr.message };
        }
    });

    // [SCHEDULER] Background Agent Loop
    let lastScoutTrigger = 0;

    setInterval(() => {
        const now = new Date();
        const nowMs = now.getTime();
        const h = now.getHours();
        const m = now.getMinutes();

        // 1. Scout Global Refill (Every 6 Hours: 00:00, 06:00, 12:00, 18:00)
        // [STABILITY]: Only trigger if at least 30 mins passed to prevent interval double-fire
        if (m === 0 && (h % 6 === 0) && (nowMs - lastScoutTrigger > 1800 * 1000)) {
            bootLog(`[SCHEDULER] 🕵️ Scout Mission Autopilot Triggered at ${h}:${m}`);
            lastScoutTrigger = nowMs;
            if (mainWindow) {
                mainWindow.webContents.send('agent-command', { agent: 'scout', action: 'refill' });
            }
        }

        // 2. Critic Daily Audit (23:30)
        if (h === 23 && m === 30) {
            bootLog(`[SCHEDULER] 🧐 Critic Daily Audit Triggered at ${h}:${m}`);
            if (mainWindow) {
                mainWindow.webContents.send('agent-command', { agent: 'critic', action: 'audit' });
            }
        }
    }, 60000);

    bootLog("SCHEDULER: Background Agents Online.");


    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // [HQ MODE]: NEVER QUIT when all windows are closed.
    // We persist in the System Tray to keep Agents (Scout/Strategy) running.
    bootLog("[LIFECYCLE] All windows closed. HQ stays alive in Tray.");
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

app.on('will-quit', () => {
    if (db) {
        db.close();
    }
});
