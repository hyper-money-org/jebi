import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  openPath: (path) => ipcRenderer.invoke('open-path', path),
  listFiles: (dirPath) => ipcRenderer.invoke('list-files', dirPath),
  fs: {
    listDir: (dirPath) => ipcRenderer.invoke('fs:list-dir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
  },
  ports: {
    list: () => ipcRenderer.invoke('ports:list'),
  },
  commands: {
    load: () => ipcRenderer.invoke('commands:load'),
    save: (cmds) => ipcRenderer.invoke('commands:save', cmds),
  },
  onAppShortcut: (cb) => {
    const handler = (_, name) => cb(name)
    ipcRenderer.on('app-shortcut', handler)
    return () => ipcRenderer.removeListener('app-shortcut', handler)
  },
  ai: {
    getConfig: () => ipcRenderer.invoke('ai:get-config'),
    saveConfig: (cfg) => ipcRenderer.invoke('ai:save-config', cfg),
    listModels: (activePath) => ipcRenderer.invoke('ai:list-models', activePath),
    startDownload: (modelId) => ipcRenderer.invoke('ai:start-download', modelId),
    cancelDownload: (modelId) => ipcRenderer.invoke('ai:cancel-download', modelId),
    onProgress: (cb) => {
      const handler = (_, data) => cb(data)
      ipcRenderer.on('ai:download-progress', handler)
      return () => ipcRenderer.removeListener('ai:download-progress', handler)
    },
    onComplete: (cb) => {
      const handler = (_, data) => cb(data)
      ipcRenderer.on('ai:download-complete', handler)
      return () => ipcRenderer.removeListener('ai:download-complete', handler)
    },
    onError: (cb) => {
      const handler = (_, data) => cb(data)
      ipcRenderer.on('ai:download-error', handler)
      return () => ipcRenderer.removeListener('ai:download-error', handler)
    },
  },
})
