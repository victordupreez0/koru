const { contextBridge } = require('electron');

// Expose a minimal, safe API to the renderer process.
// Never expose ipcRenderer or Node APIs directly.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
