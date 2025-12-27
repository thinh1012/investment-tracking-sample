const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendEmail: (config, message) => ipcRenderer.invoke('send-email', { config, message }),
    sqlIntel: {
        get: (symbol) => ipcRenderer.invoke('sql-intel-get', symbol),
        getAll: () => ipcRenderer.invoke('sql-intel-get-all'),
        save: (intel) => ipcRenderer.invoke('sql-intel-save', intel)
    }
});
