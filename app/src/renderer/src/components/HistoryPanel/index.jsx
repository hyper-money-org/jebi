import { useState, useEffect, useRef, useMemo } from 'react'

export default function HistoryPanel({ history, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Succeeded commands only, most recent first, deduplicated
  const allEntries = useMemo(() => {
    const seen = new Set()
    const result = []
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i]
      const cmd = typeof entry === 'string' ? entry : entry.c
      const ok  = typeof entry === 'string' ? true  : entry.ok
      if (ok && !seen.has(cmd)) { seen.add(cmd); result.push(cmd) }
    }
    return result
  }, [history])

  const filtered = useMemo(() => {
    if (!query.trim()) return allEntries
    const q = query.toLowerCase()
    return allEntries.filter((cmd) => cmd.toLowerCase().includes(q))
  }, [allEntries, query])

  // Reset selection when filter changes
  useEffect(() => { setSelected(0) }, [query])

  // Focus search input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Keyboard navigation — capture phase so arrow keys don't move the input cursor
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowUp' || (e.key === 'k' && e.ctrlKey)) {
        e.preventDefault()
        setSelected((s) => Math.max(0, s - 1))
        return
      }
      if (e.key === 'ArrowDown' || (e.key === 'j' && e.ctrlKey)) {
        e.preventDefault()
        setSelected((s) => Math.min(filtered.length - 1, s + 1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selected]) onSelect(filtered[selected])
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [filtered, selected, onClose, onSelect])

  // Scroll selected row into view
  useEffect(() => {
    const row = listRef.current?.children[selected]
    row?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div
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
      {/* Search input */}
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
          placeholder="Search history…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            caretColor: 'var(--accent)',
          }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
          ↑↓ · enter · esc
        </span>
      </div>

      {/* Command list */}
      <div ref={listRef} style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
        {filtered.length === 0 && (
          <div style={{
            padding: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
          }}>
            No matches
          </div>
        )}
        {filtered.map((cmd, i) => (
          <div
            key={i}
            onClick={() => onSelect(cmd)}
            onMouseEnter={() => setSelected(i)}
            style={{
              padding: '4px 12px',
              cursor: 'pointer',
              background: i === selected
                ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                : 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              userSelect: 'none',
            }}
          >
            <span style={{ color: 'var(--text-muted)', marginRight: 10, fontSize: 11, minWidth: 30, display: 'inline-block', textAlign: 'right' }}>
              {i + 1}
            </span>
            {highlightMatch(cmd, query)}
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
        {filtered.length} {filtered.length === allEntries.length ? 'commands' : `of ${allEntries.length} commands`}
      </div>
    </div>
  )
}

function highlightMatch(cmd, query) {
  if (!query.trim()) return cmd
  const idx = cmd.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return cmd
  return (
    <>
      {cmd.slice(0, idx)}
      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
        {cmd.slice(idx, idx + query.length)}
      </span>
      {cmd.slice(idx + query.length)}
    </>
  )
}
