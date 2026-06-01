import { useState, useEffect, useRef, useMemo } from 'react'

// ─── Loaders ─────────────────────────────────────────────────────────────────

async function loadNpmScripts(cwd, files) {
  if (!files.includes('package.json')) return []
  const content = await window.electron.fs.readFile(`${cwd}/package.json`)
  if (!content) return []
  try {
    const pkg = JSON.parse(content)
    const scripts = pkg.scripts ?? {}
    const pm = files.includes('yarn.lock') ? 'yarn'
      : files.includes('pnpm-lock.yaml') ? 'pnpm'
      : 'npm'
    const runCmd = pm === 'npm' ? 'npm run' : pm
    return Object.entries(scripts).map(([name, cmd]) => ({
      id: `npm:${name}`,
      label: name,
      command: `${runCmd} ${name}`,
      description: cmd,
      source: pm,
    }))
  } catch {
    return []
  }
}

async function loadMakeTargets(cwd, files) {
  if (!files.includes('Makefile') && !files.includes('makefile')) return []
  const name = files.includes('Makefile') ? 'Makefile' : 'makefile'
  const content = await window.electron.fs.readFile(`${cwd}/${name}`)
  if (!content) return []
  const targets = []
  const seen = new Set()
  for (const line of content.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9][a-zA-Z0-9_\-.]*)\s*:(?!=)/)
    if (m && !seen.has(m[1])) {
      seen.add(m[1])
      targets.push({ id: `make:${m[1]}`, label: m[1], command: `make ${m[1]}`, description: '', source: 'make' })
    }
  }
  return targets
}

function loadGoCommands(files) {
  if (!files.includes('go.mod')) return []
  return [
    { id: 'go:run',   label: 'run',          command: 'go run .',       description: 'Run the package',      source: 'go' },
    { id: 'go:test',  label: 'test',         command: 'go test ./...',  description: 'Run all tests',        source: 'go' },
    { id: 'go:build', label: 'build',        command: 'go build ./...', description: 'Build all packages',   source: 'go' },
    { id: 'go:vet',   label: 'vet',          command: 'go vet ./...',   description: 'Run static analysis',  source: 'go' },
  ]
}

function loadCargoCommands(files) {
  if (!files.includes('Cargo.toml')) return []
  return [
    { id: 'cargo:run',   label: 'run',   command: 'cargo run',   description: 'Run the binary',    source: 'cargo' },
    { id: 'cargo:test',  label: 'test',  command: 'cargo test',  description: 'Run all tests',     source: 'cargo' },
    { id: 'cargo:build', label: 'build', command: 'cargo build', description: 'Compile the crate', source: 'cargo' },
    { id: 'cargo:check', label: 'check', command: 'cargo check', description: 'Check without build', source: 'cargo' },
  ]
}

function loadPythonCommands(files) {
  if (!files.includes('pyproject.toml') && !files.includes('setup.py') && !files.includes('requirements.txt')) return []
  return [
    { id: 'py:run',   label: 'run',    command: 'python3 main.py',    description: 'Run main.py',       source: 'python' },
    { id: 'py:test',  label: 'test',   command: 'pytest',             description: 'Run tests',         source: 'python' },
    { id: 'py:install', label: 'install', command: 'pip install -r requirements.txt', description: 'Install dependencies', source: 'python' },
  ].filter((c) => {
    if (c.id === 'py:run') return files.includes('main.py')
    if (c.id === 'py:install') return files.includes('requirements.txt')
    return true
  })
}

const SOURCE_COLORS = {
  npm:    '#cb3837',
  yarn:   '#2c8ebb',
  pnpm:   '#f69220',
  make:   '#6d8086',
  go:     '#00acd7',
  cargo:  '#ce422b',
  python: '#3572a5',
}

const SOURCE_LABELS = {
  npm: 'npm', yarn: 'yarn', pnpm: 'pnpm',
  make: 'make', go: 'go', cargo: 'cargo', python: 'python',
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RunPanel({ cwd, onSelect, onClose }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!cwd) return
    let cancelled = false
    async function load() {
      const entries = await window.electron.fs.listDir(cwd)
      const files = entries.map((e) => e.name)
      const [npm, make, go, cargo, python] = await Promise.all([
        loadNpmScripts(cwd, files),
        loadMakeTargets(cwd, files),
        Promise.resolve(loadGoCommands(files)),
        Promise.resolve(loadCargoCommands(files)),
        Promise.resolve(loadPythonCommands(files)),
      ])
      if (!cancelled) setItems([...npm, ...make, ...go, ...cargo, ...python])
    }
    load()
    return () => { cancelled = true }
  }, [cwd])

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setSelected(0) }, [query])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      item.command.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    )
  }, [items, query])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowUp') {
        e.preventDefault(); setSelected((s) => Math.max(0, s - 1)); return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault(); setSelected((s) => Math.min(filtered.length - 1, s + 1)); return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selected]) onSelect(filtered[selected].command)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [filtered, selected, onClose, onSelect])

  useEffect(() => {
    listRef.current?.children[selected]?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      maxHeight: '50%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
      boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
      zIndex: 20,
      overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search scripts…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13,
            caretColor: 'var(--accent)',
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
          ↑↓ · enter · esc
        </span>
      </div>

      {/* List */}
      <div ref={listRef} style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
        {items.length === 0 && (
          <div style={{ padding: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            No scripts found in this directory
          </div>
        )}
        {items.length > 0 && filtered.length === 0 && (
          <div style={{ padding: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            No matches
          </div>
        )}
        {filtered.map((item, i) => (
          <div
            key={item.id}
            onClick={() => onSelect(item.command)}
            onMouseEnter={() => setSelected(i)}
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 140px 1fr',
              alignItems: 'center',
              gap: '0 10px',
              padding: '4px 12px',
              cursor: 'pointer',
              background: i === selected
                ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                : 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              userSelect: 'none',
            }}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: SOURCE_COLORS[item.source] ?? 'var(--text-muted)',
              textTransform: 'uppercase',
            }}>
              {SOURCE_LABELS[item.source] ?? item.source}
            </span>
            <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.description}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '3px 12px',
        borderTop: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
        color: 'var(--text-muted)', fontSize: 11, flexShrink: 0, fontFamily: 'var(--font-mono)',
      }}>
        {filtered.length} {filtered.length === items.length ? 'scripts' : `of ${items.length} scripts`}
      </div>
    </div>
  )
}
