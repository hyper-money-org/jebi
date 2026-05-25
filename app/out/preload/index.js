"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  openPath: (path) => electron.ipcRenderer.invoke("open-path", path),
  listFiles: (dirPath) => electron.ipcRenderer.invoke("list-files", dirPath),
  onAppShortcut: (cb) => {
    const handler = (_, name) => cb(name);
    electron.ipcRenderer.on("app-shortcut", handler);
    return () => electron.ipcRenderer.removeListener("app-shortcut", handler);
  },
  ai: {
    getConfig: () => electron.ipcRenderer.invoke("ai:get-config"),
    saveConfig: (cfg) => electron.ipcRenderer.invoke("ai:save-config", cfg),
    listModels: (activePath) => electron.ipcRenderer.invoke("ai:list-models", activePath),
    startDownload: (modelId) => electron.ipcRenderer.invoke("ai:start-download", modelId),
    cancelDownload: (modelId) => electron.ipcRenderer.invoke("ai:cancel-download", modelId),
    onProgress: (cb) => {
      const handler = (_, data) => cb(data);
      electron.ipcRenderer.on("ai:download-progress", handler);
      return () => electron.ipcRenderer.removeListener("ai:download-progress", handler);
    },
    onComplete: (cb) => {
      const handler = (_, data) => cb(data);
      electron.ipcRenderer.on("ai:download-complete", handler);
      return () => electron.ipcRenderer.removeListener("ai:download-complete", handler);
    },
    onError: (cb) => {
      const handler = (_, data) => cb(data);
      electron.ipcRenderer.on("ai:download-error", handler);
      return () => electron.ipcRenderer.removeListener("ai:download-error", handler);
    }
  }
});
