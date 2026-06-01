import { useState, useEffect, useRef, useMemo } from 'react'
import { ALL_COMMANDS, filterByPrefix } from '../../commands/registry'

export default function SlashCommandPanel({ query, onSelect, onClose }) {
  const filtered = useMemo(() => filterByPrefix(query), [query])
  const [selected, setSelected] = useState(0)
  const panelRef = useRef(null)

  // Reset selection when filter changes
  useEffect(() => { setSelected(0) }, [query])

  // Group filtered commands by section, preserving registry order
  const groups = useMemo(() => {
    const map = new Map()
    for (const cmd of filtered) {
      if (!map.has(cmd.section)) map.set(cmd.section, [])
      map.get(cmd.section).push(cmd)
    }
    return [...map.entries()]
  }, [filtered])

  // Flat list for keyboard index tracking
  const flatItems = useMemo(() => filtered, [filtered])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key === 'ArrowUp') {
        e.preventDefault(); setSelected((s) => Math.max(0, s - 1)); return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault(); setSelected((s) => Math.min(flatItems.length - 1, s + 1)); return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (flatItems[selected]) onSelect(flatItems[selected])
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [flatItems, selected, onSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    const el = panelRef.current?.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  if (filtered.length === 0) return null

  let idx = 0

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '50%',
        overflowY: 'auto',
        background: 'var(--bg-surface)',
        borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
        zIndex: 50,
      }}
    >
      {groups.map(([section, cmds]) => (
        <div key={section}>
          {/* Section header */}
          <div style={{
            padding: '5px 12px 2px',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {section}
          </div>

          {/* Commands in section */}
          {cmds.map((cmd) => {
            const itemIdx = idx++
            const isSelected = itemIdx === selected
            return (
              <div
                key={cmd.id}
                data-idx={itemIdx}
                onClick={() => onSelect(cmd)}
                onMouseEnter={() => setSelected(itemIdx)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  alignItems: 'center',
                  gap: '0 8px',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                    : 'transparent',
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
                  {highlightQuery('/' + cmd.id, query)}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {cmd.description}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function highlightQuery(label, query) {
  if (!query) return label
  const idx = label.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return label
  return (
    <>
      {label.slice(0, idx)}
      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
        {label.slice(idx, idx + query.length)}
      </span>
      {label.slice(idx + query.length)}
    </>
  )
}
