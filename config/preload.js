const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadUrl: (url) => ipcRenderer.send('load-url', url)
})