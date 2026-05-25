"use strict";
const electron = require("electron");
const path = require("path");
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
const net = require("net");
const MODEL_REGISTRY = [
  {
    id: "qwen2.5-1.5b",
    name: "Qwen2.5 1.5B Instruct",
    description: "Recommended · Fast · 1.1 GB",
    sizeBytes: 1147359232,
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    filename: "qwen2.5-1.5b-instruct-q4_k_m.gguf"
  },
  {
    id: "phi3-mini",
    name: "Phi-3 Mini 3.8B",
    description: "Higher quality · 2.2 GB",
    sizeBytes: 2365587456,
    url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
    filename: "phi3-mini-4k-instruct-q4.gguf"
  },
  {
    id: "llama3.2-1b",
    name: "Llama 3.2 1B",
    description: "Smallest · Fastest · 770 MB",
    sizeBytes: 804782080,
    url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
    filename: "llama3.2-1b-instruct-q4_k_m.gguf"
  }
];
const activeDownloads = /* @__PURE__ */ new Map();
function safeSend(sender, channel, payload) {
  if (!sender.isDestroyed()) sender.send(channel, payload);
}
function aiSettingsPath() {
  return path.join(os.homedir(), ".config", "term", "settings.json");
}
let coreProcess = null;
function coreBinaryPath() {
  const bin = process.platform === "win32" ? "term-core.exe" : "term-core";
  if (electron.app.isPackaged) {
    return path.join(process.resourcesPath, bin);
  }
  return path.join(electron.app.getAppPath(), "..", "core", bin);
}
function startCore() {
  const bin = coreBinaryPath();
  const env = { ...process.env };
  if (electron.app.isPackaged) env.RESOURCES_PATH = process.resourcesPath;
  coreProcess = child_process.spawn(bin, [], { stdio: "pipe", env });
  coreProcess.stdout.on("data", (d) => console.log("[core]", d.toString().trim()));
  coreProcess.stderr.on("data", (d) => console.error("[core]", d.toString().trim()));
  coreProcess.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM") {
      console.error(`[core] exited unexpectedly: code=${code} signal=${signal}`);
    }
    coreProcess = null;
  });
}
function stopCore() {
  if (coreProcess) {
    coreProcess.kill("SIGTERM");
    coreProcess = null;
  }
}
function stopCoreAndWait() {
  return new Promise((resolve2) => {
    if (!coreProcess) return resolve2();
    const proc = coreProcess;
    proc.once("exit", resolve2);
    proc.kill("SIGTERM");
    coreProcess = null;
    setTimeout(resolve2, 5e3);
  });
}
function waitForCore(port, timeout = 1e4) {
  return new Promise((resolve2, reject) => {
    const start = Date.now();
    function attempt() {
      const sock = net.createConnection(port, "127.0.0.1");
      sock.once("connect", () => {
        sock.destroy();
        resolve2();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error("core did not start in time"));
        setTimeout(attempt, 100);
      });
    }
    attempt();
  });
}
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#0d0d0d",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true
    }
  });
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.meta && input.shift && !input.alt && !input.control) {
      const k = input.key.toLowerCase();
      if (k === "d") {
        event.preventDefault();
        win.webContents.send("app-shortcut", "split-down");
      }
      if (k === "c") {
        event.preventDefault();
        win.webContents.send("app-shortcut", "copy");
      }
    }
  });
  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.ipcMain.handle("open-path", (_, path2) => electron.shell.openPath(path2));
electron.ipcMain.handle("list-files", async (_, dirPath) => {
  if (typeof dirPath !== "string" || dirPath === "") return [];
  let abs = dirPath;
  if (abs === "~" || abs.startsWith("~/")) {
    abs = abs === "~" ? os.homedir() : path.join(os.homedir(), abs.slice(2));
  }
  if (!path.isAbsolute(abs)) return [];
  abs = path.resolve(abs);
  try {
    const entries = await fs.promises.readdir(abs, { withFileTypes: true });
    return entries.map((e) => ({ name: e.name, isDir: e.isDirectory() }));
  } catch {
    return [];
  }
});
electron.ipcMain.handle("ai:get-config", async () => {
  try {
    const data = await fs.promises.readFile(aiSettingsPath(), "utf8");
    const json = JSON.parse(data);
    return json.llm ?? null;
  } catch {
    return null;
  }
});
electron.ipcMain.handle("ai:save-config", async (_, llmConfig) => {
  let existing = {};
  try {
    existing = JSON.parse(await fs.promises.readFile(aiSettingsPath(), "utf8"));
  } catch {
  }
  const dir = path.join(os.homedir(), ".config", "term");
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(aiSettingsPath(), JSON.stringify({ ...existing, llm: llmConfig }, null, 2));
  await stopCoreAndWait();
  startCore();
  await waitForCore(7070);
  return { ok: true };
});
electron.ipcMain.handle("ai:list-models", async (_, activePath) => {
  const modelsDir = path.join(electron.app.getPath("userData"), "models");
  return Promise.all(MODEL_REGISTRY.map(async (m) => {
    const fullPath = path.join(modelsDir, m.filename);
    let downloaded = false;
    try {
      await fs.promises.access(fullPath);
      downloaded = true;
    } catch {
    }
    return {
      ...m,
      downloaded,
      active: activePath === fullPath,
      path: fullPath
    };
  }));
});
electron.ipcMain.handle("ai:start-download", async (event, modelId) => {
  const model = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (!model) return { ok: false, error: "Unknown model" };
  if (activeDownloads.has(modelId)) return { ok: false, error: "Already downloading" };
  const modelsDir = path.join(electron.app.getPath("userData"), "models");
  await fs.promises.mkdir(modelsDir, { recursive: true });
  const destPath = path.join(modelsDir, model.filename);
  const tmpPath = destPath + ".tmp";
  const controller = new AbortController();
  activeDownloads.set(modelId, controller);
  try {
    const response = await fetch(model.url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const totalHeader = response.headers.get("content-length");
    const total = totalHeader ? parseInt(totalHeader, 10) : 0;
    let received = 0;
    let lastReport = Date.now();
    let lastBytes = 0;
    const fileHandle = await fs.promises.open(tmpPath, "w");
    const writer = fileHandle.createWriteStream();
    try {
      for await (const chunk of response.body) {
        if (controller.signal.aborted) break;
        const ok = writer.write(chunk);
        if (!ok) await new Promise((r) => writer.once("drain", r));
        received += chunk.length;
        const now = Date.now();
        if (now - lastReport >= 250) {
          const elapsed = (now - lastReport) / 1e3;
          const speedBps = (received - lastBytes) / elapsed;
          lastReport = now;
          lastBytes = received;
          safeSend(event.sender, "ai:download-progress", { modelId, bytesReceived: received, totalBytes: total, speedBps });
        }
      }
      await new Promise((resolve2, reject) => {
        writer.end((err) => err ? reject(err) : resolve2());
      });
    } finally {
      await fileHandle.close().catch(() => {
      });
    }
    if (!controller.signal.aborted) {
      await fs.promises.rename(tmpPath, destPath);
      safeSend(event.sender, "ai:download-complete", { modelId, path: destPath });
      return { ok: true, path: destPath };
    } else {
      await fs.promises.unlink(tmpPath).catch(() => {
      });
      return { ok: false, error: "Cancelled" };
    }
  } catch (err) {
    await fs.promises.unlink(tmpPath).catch(() => {
    });
    if (!controller.signal.aborted) {
      safeSend(event.sender, "ai:download-error", { modelId, error: err.message });
    }
    return { ok: false, error: err.message };
  } finally {
    activeDownloads.delete(modelId);
  }
});
electron.ipcMain.handle("ai:cancel-download", async (_, modelId) => {
  const controller = activeDownloads.get(modelId);
  if (controller) {
    controller.abort();
    activeDownloads.delete(modelId);
  }
  return { ok: true };
});
electron.app.whenReady().then(async () => {
  startCore();
  try {
    await waitForCore(7070);
  } catch (e) {
    console.error("[core] failed to start:", e);
  }
  createWindow();
});
electron.app.on("before-quit", () => {
  stopCore();
});
electron.app.on("browser-window-focus", () => {
  electron.globalShortcut.register("CommandOrControl+N", createWindow);
});
electron.app.on("browser-window-blur", () => {
  electron.globalShortcut.unregister("CommandOrControl+N");
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
