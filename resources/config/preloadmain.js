const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  setUsr: (usr) => ipcRenderer.send('set-usr', usr)
})