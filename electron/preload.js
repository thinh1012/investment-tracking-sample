const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    sendEmail: (config, message) => ipcRenderer.invoke('send-email', { config, message })
});
