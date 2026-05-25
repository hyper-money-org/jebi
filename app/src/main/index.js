import { app, BrowserWindow, globalShortcut, ipcMain, shell } from 'electron'
import { join, isAbsolute, resolve } from 'path'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import { homedir } from 'os'
import net from 'net'

// ─── Model registry ──────────────────────────────────────────────────────────

const MODEL_REGISTRY = [
  {
    id: 'qwen2.5-1.5b',
    name: 'Qwen2.5 1.5B Instruct',
    description: 'Recommended · Fast · 1.1 GB',
    sizeBytes: 1_147_359_232,
    url: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    filename: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3 Mini 3.8B',
    description: 'Higher quality · 2.2 GB',
    sizeBytes: 2_365_587_456,
    url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    filename: 'phi3-mini-4k-instruct-q4.gguf',
  },
  {
    id: 'llama3.2-1b',
    name: 'Llama 3.2 1B',
    description: 'Smallest · Fastest · 770 MB',
    sizeBytes: 804_782_080,
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    filename: 'llama3.2-1b-instruct-q4_k_m.gguf',
  },
]

const activeDownloads = new Map()

function aiSettingsPath() {
  return join(homedir(), '.config', 'term', 'settings.json')
}

// ─── Go core lifecycle ────────────────────────────────────────────────────────

let coreProcess = null

function coreBinaryPath() {
  const bin = process.platform === 'win32' ? 'term-core.exe' : 'term-core'
  if (app.isPackaged) {
    return join(process.resourcesPath, bin)
  }
  return join(app.getAppPath(), '..', 'core', bin)
}

function startCore() {
  const bin = coreBinaryPath()
  const env = { ...process.env }
  if (app.isPackaged) env.RESOURCES_PATH = process.resourcesPath
  coreProcess = spawn(bin, [], { stdio: 'pipe', env })
  coreProcess.stdout.on('data', d => console.log('[core]', d.toString().trim()))
  coreProcess.stderr.on('data', d => console.error('[core]', d.toString().trim()))
  coreProcess.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`[core] exited unexpectedly: code=${code} signal=${signal}`)
    }
    coreProcess = null
  })
}

function stopCore() {
  if (coreProcess) {
    coreProcess.kill('SIGTERM')
    coreProcess = null
  }
}

// Poll until the Go server accepts TCP connections, then resolve.
function waitForCore(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    function attempt() {
      const sock = net.createConnection(port, '127.0.0.1')
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error', () => {
        sock.destroy()
        if (Date.now() - start > timeout) return reject(new Error('core did not start in time'))
        setTimeout(attempt, 100)
      })
    }
    attempt()
  })
}

// ─── Window management ────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0d0d0d',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  })

  // Intercept Cmd+Shift+D before Chromium's internal shortcut handling swallows it.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.meta && input.shift && !input.alt && !input.control) {
      const k = input.key.toLowerCase()
      if (k === 'd') { event.preventDefault(); win.webContents.send('app-shortcut', 'split-down') }
      if (k === 'c') { event.preventDefault(); win.webContents.send('app-shortcut', 'copy') }
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('open-path', (_, path) => shell.openPath(path))

// Lists folders/files at dirPath. Used by the InputBar file-path autosuggest.
// Resolves '~' against the user's home dir; relative paths must be resolved
// against cwd by the caller (this handler doesn't know about per-pane cwd).
// Returns [] silently on any error so the dropdown just stays empty.
ipcMain.handle('list-files', async (_, dirPath) => {
  if (typeof dirPath !== 'string' || dirPath === '') return []
  let abs = dirPath
  if (abs === '~' || abs.startsWith('~/')) {
    abs = abs === '~' ? homedir() : join(homedir(), abs.slice(2))
  }
  if (!isAbsolute(abs)) return []
  abs = resolve(abs)
  try {
    const entries = await fs.readdir(abs, { withFileTypes: true })
    return entries.map((e) => ({ name: e.name, isDir: e.isDirectory() }))
  } catch {
    return []
  }
})

// ─── AI IPC handlers ─────────────────────────────────────────────────────────

ipcMain.handle('ai:get-config', async () => {
  try {
    const data = await fs.readFile(aiSettingsPath(), 'utf8')
    const json = JSON.parse(data)
    return json.llm ?? null
  } catch { return null }
})

ipcMain.handle('ai:save-config', async (_, llmConfig) => {
  // 1. Read existing settings (or start fresh)
  let existing = {}
  try { existing = JSON.parse(await fs.readFile(aiSettingsPath(), 'utf8')) } catch {}
  // 2. Write merged settings
  const dir = join(homedir(), '.config', 'term')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(aiSettingsPath(), JSON.stringify({ ...existing, llm: llmConfig }, null, 2))
  // 3. Restart core
  stopCore()
  await new Promise(r => setTimeout(r, 300))
  startCore()
  await waitForCore(7070)
  return { ok: true }
})

ipcMain.handle('ai:list-models', async (_, activePath) => {
  const modelsDir = join(app.getPath('userData'), 'models')
  return Promise.all(MODEL_REGISTRY.map(async (m) => {
    const fullPath = join(modelsDir, m.filename)
    let downloaded = false
    try { await fs.access(fullPath); downloaded = true } catch {}
    return {
      ...m,
      downloaded,
      active: activePath === fullPath,
      path: fullPath,
    }
  }))
})

ipcMain.handle('ai:start-download', async (event, modelId) => {
  const model = MODEL_REGISTRY.find(m => m.id === modelId)
  if (!model) return { ok: false, error: 'Unknown model' }

  const modelsDir = join(app.getPath('userData'), 'models')
  await fs.mkdir(modelsDir, { recursive: true })
  const destPath = join(modelsDir, model.filename)
  const tmpPath = destPath + '.tmp'

  const controller = new AbortController()
  activeDownloads.set(modelId, controller)

  try {
    const response = await fetch(model.url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const total = parseInt(response.headers.get('content-length') ?? '0', 10)
    let received = 0
    let lastReport = Date.now()
    let lastBytes = 0

    const fileHandle = await fs.open(tmpPath, 'w')
    const writer = fileHandle.createWriteStream()

    for await (const chunk of response.body) {
      if (controller.signal.aborted) break
      writer.write(chunk)
      received += chunk.length

      const now = Date.now()
      if (now - lastReport >= 250) {
        const elapsed = (now - lastReport) / 1000
        const speedBps = (received - lastBytes) / elapsed
        lastReport = now
        lastBytes = received
        event.sender.send('ai:download-progress', { modelId, bytesReceived: received, totalBytes: total, speedBps })
      }
    }

    await new Promise((resolve, reject) => {
      writer.end((err) => err ? reject(err) : resolve())
    })
    await fileHandle.close()

    if (!controller.signal.aborted) {
      await fs.rename(tmpPath, destPath)
      event.sender.send('ai:download-complete', { modelId, path: destPath })
      return { ok: true, path: destPath }
    } else {
      await fs.unlink(tmpPath).catch(() => {})
      return { ok: false, error: 'Cancelled' }
    }
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => {})
    if (!controller.signal.aborted) {
      event.sender.send('ai:download-error', { modelId, error: err.message })
    }
    return { ok: false, error: err.message }
  } finally {
    activeDownloads.delete(modelId)
  }
})

ipcMain.handle('ai:cancel-download', async (_, modelId) => {
  const controller = activeDownloads.get(modelId)
  if (controller) { controller.abort(); activeDownloads.delete(modelId) }
  return { ok: true }
})

app.whenReady().then(async () => {
  startCore()
  try {
    await waitForCore(7070)
  } catch (e) {
    console.error('[core] failed to start:', e)
  }
  createWindow()
})

app.on('before-quit', () => {
  stopCore()
})

// Register Cmd+N only while a terminal window is focused so it doesn't
// fire as a system-wide shortcut when other apps are in the foreground.
app.on('browser-window-focus', () => {
  globalShortcut.register('CommandOrControl+N', createWindow)
})
app.on('browser-window-blur', () => {
  globalShortcut.unregister('CommandOrControl+N')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
