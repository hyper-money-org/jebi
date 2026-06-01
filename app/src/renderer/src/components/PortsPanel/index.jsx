import { useState, useEffect, useRef } from 'react'

// Well-known dev port colors
function portColor(port) {
  if (port === 80 || port === 443 || port === 8080 || port === 8443) return '#60a5fa' // blue - http
  if (port === 3000 || port === 3001 || port === 5173 || port === 4173) return '#34d399' // green - dev servers
  if (port === 5432 || port === 3306 || port === 27017 || port === 6379) return '#f59e0b' // amber - databases
  if (port === 22 || port === 21 || port === 25) return '#a78bfa' // purple - system
  if (port >= 8000 && port < 9000) return '#60a5fa'
  if (port >= 3000 && port < 4000) return '#34d399'
  return 'var(--text-muted)'
}

function addrLabel(addr) {
  if (addr === '*' || addr === '0.0.0.0' || addr === '[::]') return 'all interfaces'
  if (addr === '127.0.0.1' || addr === '[::1]') return 'localhost'
  return addr
}

export default function PortsPanel({ onSelect, onKill, onClose }) {
  const [ports, setPorts] = useState(null) // null = loading
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    window.electron.ports.list().then((data) => {
      setPorts(data)
      setSelected(0)
    })
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [ports])

  const filtered = ports === null ? [] : ports.filter((p) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      String(p.port).includes(q) ||
      p.command.toLowerCase().includes(q) ||
      p.pid.includes(q)
    )
  })

  useEffect(() => { setSelected(0) }, [filter])

  // Scroll selected into view
  useEffect(() => {
    panelRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(0, s - 1)); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(filtered.length - 1, s + 1)); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selected]) onSelect(filtered[selected])
        return
      }
      if (e.key === 'Backspace' && !filter) {
        e.preventDefault()
        if (filtered[selected]) onKill(filtered[selected])
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [filtered, selected, filter, onSelect, onKill, onClose])

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
        zIndex: 50,
      }}
    >
      {/* Search bar */}
      <div style={{ padding: '6px 12px', borderBottom: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)', flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by port, process…"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* List */}
      <div ref={panelRef} style={{ overflowY: 'auto', flex: 1 }}>
        {ports === null && (
          <div style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        )}
        {ports !== null && filtered.length === 0 && (
          <div style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            No listening ports found.
          </div>
        )}
        {filtered.map((p, i) => {
          const isSelected = i === selected
          return (
            <div
              key={`${p.pid}:${p.port}`}
              data-idx={i}
              onClick={() => onSelect(p)}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px 130px 1fr 72px',
                alignItems: 'center',
                gap: '0 10px',
                padding: '5px 14px',
                cursor: 'pointer',
                background: isSelected ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                userSelect: 'none',
              }}
            >
              {/* Port */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                color: portColor(p.port),
              }}>
                :{p.port}
              </span>

              {/* Process name */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                fontWeight: isSelected ? 600 : 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {p.command}
              </span>

              {/* Address */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {addrLabel(p.addr)}
              </span>

              {/* PID */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'right',
              }}>
                pid {p.pid}
              </span>
            </div>
          )
        })}
      </div>

      {/* Footer hint */}
      {filtered.length > 0 && (
        <div style={{
          padding: '4px 14px',
          borderTop: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}>
          Enter → details · Backspace → kill · Esc → close
        </div>
      )}
    </div>
  )
}
