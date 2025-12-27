import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite
const dbPath = path.join(app.getPath('userData'), 'intelligence.db');
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS strategist_intel (
        symbol TEXT PRIMARY KEY,
        metrics TEXT,
        verdict TEXT,
        rating TEXT,
        updatedAt INTEGER
    )
`);

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
        console.error("[SQL] Get error:", e);
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
        console.error("[SQL] GetAll error:", e);
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
        console.error("[SQL] Save error:", e);
        return false;
    }
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../public/vite.svg') // Use existing icon for now
    });

    // Load the built app
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    // Remove menu bar for cleaner app feel
    mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.openDevTools();
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
    console.log("[SQL] Closing intelligence database...");
    db.close();
});
