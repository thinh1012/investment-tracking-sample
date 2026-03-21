import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isHQ = process.argv.includes('--hq');
let db;

// Initialize Database
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
} catch (error) {
    console.error("[SQL] Database initialization failed:", error);
}

// IPC Handlers
ipcMain.handle('sql-intel-get', (event, symbol) => {
    try {
        const row = db.prepare('SELECT * FROM strategist_intel WHERE symbol = ?').get(symbol);
        if (!row) return undefined;
        return {
            ...row,
            metrics: JSON.parse(row.metrics)
        };
    } catch (e) {
        return undefined;
    }
});

ipcMain.handle('sql-intel-get-all', () => {
    try {
        const rows = db.prepare('SELECT * FROM strategist_intel').all();
        return rows.map(row => ({
            ...row,
            metrics: JSON.parse(row.metrics)
        }));
    } catch (e) {
        return [];
    }
});

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

// Project Ledger Bridge
ipcMain.handle('get-project-logs', async () => {
    try {
        // Targeted read from the known Brain Artifact location
        const logPath = 'c:\\Users\\ducth\\.gemini\\antigravity\\brain\\61ce86d8-3a0c-4c8a-b497-31e450a98ed1\\task.md';
        if (fs.existsSync(logPath)) {
            return fs.readFileSync(logPath, 'utf-8');
        }
        return null;
    } catch (e) {
        console.error("[LEDGER] Read Error:", e);
        return null;
    }
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        backgroundColor: '#020617',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, '../public/vite.svg'),
        title: isHQ ? 'Alpha Vault | Digital HQ' : 'Alpha Vault | Dashboard'
    });

    let url = process.env.VITE_DEV_SERVER_URL;
    if (isHQ) {
        url = 'http://localhost:5188';
    }
    // Fallback if env not set (production or manual launch)
    if (!url) {
        url = isHQ ? 'http://localhost:5188' : 'http://localhost:5173';
    }

    // In this environment, we rely on the dev server being up.
    // The previous logic had file:// fallback, let's keep it purely simple for now correctly.
    // But since we removed file:// fallback from my new code, let's add it back if needed.
    // For now, assuming localhost is running via .bat

    mainWindow.loadURL(url);

    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (db) {
        db.close();
    }
});
