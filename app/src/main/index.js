import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'

app.setName('jebi')
import { join, isAbsolute, resolve } from 'path'
import { spawn, execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
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

function safeSend(sender, channel, payload) {
  if (!sender.isDestroyed()) sender.send(channel, payload)
}

function sendToFocused(channel, payload) {
  const win = BrowserWindow.getFocusedWindow()
  if (win && !win.webContents.isDestroyed()) win.webContents.send(channel, payload)
}

function buildAppMenu() {
  const template = [
    {
      label: 'jebi',
      submenu: [
        { label: 'About jebi', role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences…',
          accelerator: 'Cmd+,',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'preferences'),
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'Cmd+N', click: createWindow },
        {
          label: 'New Tab',
          accelerator: 'Cmd+T',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'new-tab'),
        },
        {
          label: 'Close Tab',
          accelerator: 'Cmd+W',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'close-tab'),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Copy Last Output',
          accelerator: 'Cmd+Shift+C',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'copy'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Clear Screen',
          accelerator: 'Cmd+K',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'clear'),
        },
        { type: 'separator' },
        {
          label: 'Split Right',
          accelerator: 'Cmd+D',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'split-right'),
        },
        {
          label: 'Split Down',
          accelerator: 'Cmd+Shift+D',
          registerAccelerator: false,
          click: () => sendToFocused('app-shortcut', 'split-down'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

function aiSettingsPath() {
  return join(homedir(), '.config', 'jebi', 'settings.json')
}

// ─── Go core lifecycle ────────────────────────────────────────────────────────

let coreProcess = null
let corePort = 7070

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

function coreBinaryPath() {
  const bin = process.platform === 'win32' ? 'term-core.exe' : 'term-core'
  if (app.isPackaged) {
    return join(process.resourcesPath, bin)
  }
  return join(app.getAppPath(), '..', 'core', bin)
}

function startCore(port) {
  const bin = coreBinaryPath()
  const env = { ...process.env }
  if (app.isPackaged) env.RESOURCES_PATH = process.resourcesPath
  coreProcess = spawn(bin, ['--port', String(port)], { stdio: 'pipe', env })
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

function stopCoreAndWait() {
  return new Promise(resolve => {
    if (!coreProcess) return resolve()
    const proc = coreProcess
    proc.once('exit', resolve)
    proc.kill('SIGTERM')
    coreProcess = null
    // Fallback: resolve after 5s if exit never fires
    setTimeout(resolve, 5000)
  })
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
  const iconBase = app.isPackaged ? process.resourcesPath : join(__dirname, '../../build')
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(join(iconBase, 'icon.png'))
  }

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0d0d0d',
    icon: join(iconBase, 'icon.icns'),
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

ipcMain.handle('core:port', () => corePort)
ipcMain.handle('logo-script-path', () =>
  app.isPackaged
    ? join(process.resourcesPath, 'logo-cube.py')
    : join(__dirname, '../../resources/logo-cube.py')
)

ipcMain.handle('open-path', (_, path) => shell.openPath(path))
ipcMain.handle('open-external', (_, url) => shell.openExternal(url))

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

ipcMain.handle('fs:list-dir', async (_, dirPath) => {
  if (typeof dirPath !== 'string' || dirPath === '') return []
  let abs = dirPath
  if (abs === '~' || abs.startsWith('~/')) {
    abs = abs === '~' ? homedir() : join(homedir(), abs.slice(2))
  }
  if (!isAbsolute(abs)) return []
  abs = resolve(abs)
  try {
    const entries = await fs.readdir(abs, { withFileTypes: true })
    const results = await Promise.all(entries.map(async (e) => {
      try {
        const stat = await fs.stat(join(abs, e.name))
        return { name: e.name, isDir: e.isDirectory(), size: stat.size, mtime: stat.mtimeMs, mode: stat.mode }
      } catch {
        return { name: e.name, isDir: e.isDirectory(), size: 0, mtime: 0, mode: 0 }
      }
    }))
    return results.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  } catch {
    return []
  }
})

ipcMain.handle('fs:read-file', async (_, filePath) => {
  if (typeof filePath !== 'string' || filePath === '') return null
  let abs = filePath
  if (abs === '~' || abs.startsWith('~/')) {
    abs = abs === '~' ? homedir() : join(homedir(), abs.slice(2))
  }
  if (!isAbsolute(abs)) return null
  abs = resolve(abs)
  try {
    const stat = await fs.stat(abs)
    if (stat.size > 5 * 1024 * 1024) return null // skip files > 5 MB
    return await fs.readFile(abs, 'utf8')
  } catch {
    return null
  }
})

ipcMain.handle('fs:write-file', async (_, filePath, content) => {
  if (typeof filePath !== 'string' || filePath === '') return { ok: false, error: 'Invalid path' }
  let abs = filePath
  if (abs === '~' || abs.startsWith('~/')) {
    abs = abs === '~' ? homedir() : join(homedir(), abs.slice(2))
  }
  if (!isAbsolute(abs)) return { ok: false, error: 'Path must be absolute' }
  abs = resolve(abs)
  try {
    await fs.writeFile(abs, content, 'utf8')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// ─── User commands IPC handlers ──────────────────────────────────────────────

function userCommandsPath() {
  return join(homedir(), '.config', 'jebi', 'commands.json')
}

ipcMain.handle('commands:load', async () => {
  try {
    const data = await fs.readFile(userCommandsPath(), 'utf8')
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

ipcMain.handle('commands:run-items-from', async (_, { command, cwd }) => {
  try {
    const { stdout } = await execFileAsync('/bin/sh', ['-c', command], {
      cwd: cwd || homedir(),
      timeout: 8000,
    })
    return stdout
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  } catch {
    return []
  }
})

ipcMain.handle('commands:save', async (_, commands) => {
  const path = userCommandsPath()
  await fs.mkdir(join(homedir(), '.config', 'jebi'), { recursive: true })
  await fs.writeFile(path, JSON.stringify(commands, null, 2), 'utf8')
  return { ok: true }
})

// ─── Ports IPC handler ───────────────────────────────────────────────────────

ipcMain.handle('ports:list', async () => {
  try {
    const { stdout } = await execFileAsync('lsof', ['-iTCP', '-sTCP:LISTEN', '-P', '-n'], {
      timeout: 5000,
    })
    const lines = stdout.split('\n').slice(1)
    const seen = new Set()
    const ports = []
    for (const line of lines) {
      if (!line.trim()) continue
      const parts = line.trim().split(/\s+/)
      if (parts.length < 9) continue
      const command = parts[0]
      const pid = parts[1]
      // NAME column is second-to-last; last is "(LISTEN)"
      const nameField = parts[parts.length - 2]
      const portMatch = nameField.match(/:(\d+)$/)
      if (!portMatch) continue
      const port = parseInt(portMatch[1])
      const addr = nameField.slice(0, nameField.lastIndexOf(':'))
      const key = `${pid}:${port}`
      if (seen.has(key)) continue
      seen.add(key)
      ports.push({ command, pid, port, addr })
    }
    return ports.sort((a, b) => a.port - b.port)
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
  const dir = join(homedir(), '.config', 'jebi')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(aiSettingsPath(), JSON.stringify({ ...existing, llm: llmConfig }, null, 2))
  // 3. Restart core on the same port
  await stopCoreAndWait()
  startCore(corePort)
  await waitForCore(corePort)
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

  // Duplicate download guard
  if (activeDownloads.has(modelId)) return { ok: false, error: 'Already downloading' }

  const modelsDir = join(app.getPath('userData'), 'models')
  await fs.mkdir(modelsDir, { recursive: true })
  const destPath = join(modelsDir, model.filename)
  const tmpPath = destPath + '.tmp'

  const controller = new AbortController()
  activeDownloads.set(modelId, controller)

  try {
    const response = await fetch(model.url, { signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const totalHeader = response.headers.get('content-length')
    const total = totalHeader ? parseInt(totalHeader, 10) : 0
    let received = 0
    let lastReport = Date.now()
    let lastBytes = 0

    const fileHandle = await fs.open(tmpPath, 'w')
    const writer = fileHandle.createWriteStream()

    try {
      for await (const chunk of response.body) {
        if (controller.signal.aborted) break
        const ok = writer.write(chunk)
        if (!ok) await new Promise(r => writer.once('drain', r))
        received += chunk.length

        const now = Date.now()
        if (now - lastReport >= 250) {
          const elapsed = (now - lastReport) / 1000
          const speedBps = (received - lastBytes) / elapsed
          lastReport = now
          lastBytes = received
          safeSend(event.sender, 'ai:download-progress', { modelId, bytesReceived: received, totalBytes: total, speedBps })
        }
      }

      await new Promise((resolve, reject) => {
        writer.end((err) => err ? reject(err) : resolve())
      })
    } finally {
      await fileHandle.close().catch(() => {})
    }

    if (!controller.signal.aborted) {
      await fs.rename(tmpPath, destPath)
      safeSend(event.sender, 'ai:download-complete', { modelId, path: destPath })
      return { ok: true, path: destPath }
    } else {
      await fs.unlink(tmpPath).catch(() => {})
      return { ok: false, error: 'Cancelled' }
    }
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => {})
    if (!controller.signal.aborted) {
      safeSend(event.sender, 'ai:download-error', { modelId, error: err.message })
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
  Menu.setApplicationMenu(buildAppMenu())
  corePort = await getFreePort()
  startCore(corePort)
  try {
    await waitForCore(corePort)
  } catch (e) {
    console.error('[core] failed to start:', e)
  }
  createWindow()
})

app.on('before-quit', () => {
  stopCore()
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
