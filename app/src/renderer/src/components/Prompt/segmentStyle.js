// Prevents mouse events from bubbling out of segment buttons into xterm handlers.
export function stopSegmentEvents(e) {
  e.stopPropagation()
  e.preventDefault()
}

// Flat neutral pill. accentBorder: true on CwdSegment only — draws the tab
// accent as the left border. All other segments use a dim neutral separator.
export function neonGlassStyle({ tint, onClick, minimal, accentBorder = false }) {
  if (minimal) {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      lineHeight: 1,
      padding: '3px 6px',
      background: 'transparent',
      color: 'var(--text-primary)',
      border: 'none',
      flexShrink: 0,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-mono)',
      fontWeight: 600,
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
    }
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    lineHeight: 1,
    padding: '5px 10px',
    background: 'color-mix(in srgb, var(--text-muted) 10%, var(--bg-elevated))',
    color: 'var(--text-primary)',
    borderLeft: accentBorder
      ? `3px solid color-mix(in srgb, ${tint} 75%, transparent)`
      : `3px solid color-mix(in srgb, ${tint} 35%, transparent)`,
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-mono)',
    fontWeight: 600,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'background 0.15s ease',
    userSelect: 'none',
  }
}

export function neonGlassHoverStyle(tint, minimal) {
  if (minimal) {
    return { opacity: 0.75 }
  }
  return {
    background: 'color-mix(in srgb, var(--text-muted) 8%, var(--bg-elevated))',
  }
}
