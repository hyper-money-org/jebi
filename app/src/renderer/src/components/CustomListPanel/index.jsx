import { useState, useEffect, useRef } from 'react'

export default function CustomListPanel({ title, items: staticItems, itemsFrom, onSelectTemplate, cwd, onSelect, onClose }) {
  const [items, setItems] = useState(staticItems ?? [])
  const [loading, setLoading] = useState(!!itemsFrom)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!itemsFrom) return
    setLoading(true)
    window.electron.commands.runItemsFrom(itemsFrom, cwd).then((labels) => {
      const template = onSelectTemplate ?? '{label}'
      setItems(labels.map((label) => ({
        label,
        command: template.replace(/\{label\}/g, label),
      })))
      setLoading(false)
    })
  }, [itemsFrom, cwd, onSelectTemplate])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  const filtered = filter
    ? items.filter((item) => {
        const q = filter.toLowerCase()
        return (
          item.label.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q)
        )
      })
    : items

  useEffect(() => { setSelected(0) }, [filter])

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
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [filtered, selected, onSelect, onClose])

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
      {/* Header + search */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {title && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {title}
          </span>
        )}
        <input
          ref={inputRef}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          style={{
            flex: 1,
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
        {loading && (
          <div style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            No items match.
          </div>
        )}
        {filtered.map((item, i) => {
          const isSelected = i === selected
          return (
            <div
              key={i}
              data-idx={i}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelected(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                alignItems: 'center',
                gap: '0 8px',
                padding: '5px 14px',
                cursor: 'pointer',
                background: isSelected ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
                userSelect: 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: isSelected ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.label}
              </span>
              {item.description && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.description}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div style={{
          padding: '4px 14px',
          borderTop: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}>
          Enter → run · Esc → close
        </div>
      )}
    </div>
  )
}
