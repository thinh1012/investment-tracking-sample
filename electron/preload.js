const { contextBridge, ipcRenderer } = require('electron');

try {
    contextBridge.exposeInMainWorld('electronAPI', {
        openExternal: (url) => ipcRenderer.invoke('open-external', url),
        saveBackupToDisk: (data, filename) => ipcRenderer.invoke('save-backup-to-disk', { data, filename }),
        sendEmail: (config, message) => ipcRenderer.invoke('send-email', { config, message }),
        sqlIntel: {
            get: (symbol) => ipcRenderer.invoke('sql-intel-get', symbol),
            getAll: () => ipcRenderer.invoke('sql-intel-get-all'),
            save: (intel) => ipcRenderer.invoke('sql-intel-save', intel)
        },
        projectLedger: {
            getLogs: () => ipcRenderer.invoke('get-project-logs')
        },
        scout: {
            refill: () => ipcRenderer.invoke('scout-refill'),
            setDelay: (min, max) => ipcRenderer.invoke('scout-set-delay', { min, max }),
            getGoogleNews: (symbol) => ipcRenderer.invoke('scout-get-google-news', symbol),
            // [IPC BRIDGE]: Broadcast data to other windows (Ops Console -> Vault)
            broadcast: (data) => ipcRenderer.invoke('scout-broadcast', data),
            // [IPC BRIDGE]: Listen for data from other windows
            onBroadcast: (callback) => ipcRenderer.on('scout-broadcast-receive', (event, data) => callback(data)),

            // [VISIBLE SCOUT] Manual Trigger
            startMission: (url, type, data) => ipcRenderer.invoke('start-scout', { url, type, data }),

            // [SQL ANALYST BRIDGE]
            sqlTableAll: (tableName) => ipcRenderer.invoke('sql-table-all', tableName)
        },
        // [PHASE 74] Wake Scout Satellite from UI
        wakeScoutSatellite: () => ipcRenderer.invoke('wake-scout-satellite'),

        // [PHASE 28] Environment Bridge for Renderer access
        env: {
            VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
            TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
            TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
        },
        testSupabase: () => ipcRenderer.invoke('supabase-test')
    });
    console.log("[PRELOAD] 🚀 electronAPI Bridge successfully exposed.");
} catch (e) {
    console.error("[PRELOAD] ❌ Bridge failure:", e);
}
