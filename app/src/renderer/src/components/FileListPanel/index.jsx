import { useState, useEffect, useRef } from 'react'
import { getFileIconUrl, getFolderIconUrl } from '../../assets/file-icons/fileIcons'

function FileIcon({ name, isDir }) {
  const src = isDir ? getFolderIconUrl() : getFileIconUrl(name)
  if (!src) return <span style={{ width: 16, display: 'inline-block' }} />
  return <img src={src} alt="" style={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }} />
}

function formatSize(bytes, isDir) {
  if (isDir) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

function formatDate(mtime) {
  if (!mtime) return '—'
  const s = (Date.now() - mtime) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  if (s < 86400 * 30) return Math.floor(s / 86400) + 'd ago'
  if (s < 86400 * 365) return Math.floor(s / 86400 / 30) + 'mo ago'
  return Math.floor(s / 86400 / 365) + 'y ago'
}

function formatPerms(mode) {
  if (!mode) return '—'
  const b = mode & 0o777
  const c = (mask, ch) => (b & mask ? ch : '-')
  return (
    c(0o400, 'r') + c(0o200, 'w') + c(0o100, 'x') +
    c(0o040, 'r') + c(0o020, 'w') + c(0o010, 'x') +
    c(0o004, 'r') + c(0o002, 'w') + c(0o001, 'x')
  )
}

function parentDir(dir) {
  const clean = dir.replace(/\/$/, '')
  const idx = clean.lastIndexOf('/')
  if (idx <= 0) return '/'
  return clean.slice(0, idx)
}

function joinPath(dir, name) {
  return dir.replace(/\/$/, '') + '/' + name
}

const BACK_ENTRY = { name: '..', isDir: true, size: 0, mtime: 0, mode: 0, isMeta: true }

export default function FileListPanel({ cwd, onSelect, onPreview, onClose }) {
  const [currentDir, setCurrentDir] = useState(cwd)
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(0)
  const [panelWidth, setPanelWidth] = useState(800)
  const panelRef = useRef(null)
  const listRef = useRef(null)

  // Reset internal dir when shell cwd changes (e.g. user did cd externally)
  useEffect(() => { setCurrentDir(cwd) }, [cwd])

  useEffect(() => {
    if (!currentDir) return
    window.electron.fs.listDir(currentDir).then((data) => {
      setEntries(data)
      setSelected(0)
    })
  }, [currentDir])

  useEffect(() => {
    if (!panelRef.current) return
    const ro = new ResizeObserver((obs) => setPanelWidth(obs[0].contentRect.width))
    ro.observe(panelRef.current)
    return () => ro.disconnect()
  }, [])

  const navigate = (dir) => {
    setCurrentDir(dir)
    setSelected(0)
  }

  const allEntries = currentDir !== '/' ? [BACK_ENTRY, ...entries] : entries

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }

      if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        setSelected((s) => Math.max(0, s - 1))
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        setSelected((s) => Math.min(allEntries.length - 1, s + 1))
        return
      }

      const entry = allEntries[selected]
      if (!entry) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (entry.isMeta) return
        if (entry.isDir) navigate(joinPath(currentDir, entry.name))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (entry.isMeta) { navigate(parentDir(currentDir)); return }
        const full = { ...entry, fullPath: joinPath(currentDir, entry.name) }
        if (entry.isDir) onSelect(full)
        else onPreview?.(full)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [allEntries, selected, currentDir, onClose, onSelect])

  // Scroll selected row into view
  useEffect(() => {
    const row = listRef.current?.children[selected]
    row?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const showSize = panelWidth > 420
  const showDate = panelWidth > 580
  const showPerms = panelWidth > 740

  const gridCols = [
    '22px',
    '1fr',
    showSize ? '72px' : null,
    showDate ? '80px' : null,
    showPerms ? '100px' : null,
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '50%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '5px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
        flexShrink: 0,
        gap: 8,
      }}>
        <span style={{
          color: 'var(--accent)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {currentDir}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>
          ↑↓ navigate · → expand dir · enter select · esc close
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        gap: '0 8px',
        padding: '3px 12px',
        borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
        flexShrink: 0,
      }}>
        <span />
        <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Name</span>
        {showSize && <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'right' }}>Size</span>}
        {showDate && <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'right' }}>Modified</span>}
        {showPerms && <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Perms</span>}
      </div>

      {/* File rows */}
      <div ref={listRef} style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
        {allEntries.map((entry, i) => (
          <div
            key={entry.isMeta ? '..' : entry.name}
            onClick={() => {
              if (entry.isMeta) { navigate(parentDir(currentDir)); return }
              const full = { ...entry, fullPath: joinPath(currentDir, entry.name) }
              if (entry.isDir) onSelect(full)
              else onPreview?.(full)
            }}
            onMouseEnter={() => setSelected(i)}
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              alignItems: 'center',
              gap: '0 8px',
              padding: '3px 12px',
              cursor: 'pointer',
              background: i === selected
                ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                : 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              userSelect: 'none',
            }}
          >
            <FileIcon name={entry.name} isDir={entry.isDir} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: entry.isDir ? 'var(--accent)' : 'var(--text-primary)',
              opacity: entry.isMeta ? 0.6 : 1,
            }}>
              {entry.name}{entry.isDir && !entry.isMeta ? '/' : ''}
            </span>
            {showSize && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'right' }}>
                {entry.isMeta ? '' : formatSize(entry.size, entry.isDir)}
              </span>
            )}
            {showDate && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'right' }}>
                {entry.isMeta ? '' : formatDate(entry.mtime)}
              </span>
            )}
            {showPerms && (
              <span style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: '0.02em' }}>
                {entry.isMeta ? '' : formatPerms(entry.mode)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: '3px 12px',
        borderTop: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
        color: 'var(--text-muted)',
        fontSize: 11,
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
      }}>
        {entries.length} items
      </div>
    </div>
  )
}
