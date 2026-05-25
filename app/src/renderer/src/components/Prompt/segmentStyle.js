// Prevents mouse events from bubbling out of segment buttons into xterm handlers.
export function stopSegmentEvents(e) {
  e.stopPropagation()
  e.preventDefault()
}

function promptVar(tint, suffix) {
  const match = /^var\((--prompt-[^)]+)-tint\)$/.exec(tint)
  return match ? `var(${match[1]}-${suffix})` : null
}

// Neon glass pill: translucent tinted background + left border accent.
// compact/rowHeight used only in xterm decoration mode.
// minimal: strips background and border, showing only icon + colored text.
export function neonGlassStyle({ tint, compact, rowHeight, onClick, minimal }) {
  const bg = promptVar(tint, 'bg')
  const textColor = '#ffffff'
  const surface = bg ?? `color-mix(in srgb, ${tint} 24%, #10131a)`

  if (minimal) {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      lineHeight: 1,
      padding: '3px 6px',
      background: 'transparent',
      color: `color-mix(in srgb, ${tint} 82%, #ffffff)`,
      border: 'none',
      flexShrink: 0,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-mono)',
      fontWeight: 800,
      textShadow: '0 0 1px rgba(255,255,255,0.45), 0 1px 1px rgba(0,0,0,0.65)',
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none',
    }
  }
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    lineHeight: 1,
    padding: '5px 10px',
    background: `linear-gradient(90deg, color-mix(in srgb, ${tint} 38%, #10131a) 0%, ${surface} 100%)`,
    color: textColor,
    borderLeft: `4px solid color-mix(in srgb, ${tint} 94%, #ffffff)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, ${tint} 18%, transparent)`,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-mono)',
    fontWeight: 800,
    textShadow: '0 0 1px rgba(255,255,255,0.35), 0 1px 1px rgba(0,0,0,0.7)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'background 0.15s ease, box-shadow 0.15s ease',
    userSelect: 'none',
  }
}

export function neonGlassHoverStyle(tint, minimal) {
  if (minimal) {
    return { opacity: 0.75 }
  }
  return {
    background: `linear-gradient(90deg, color-mix(in srgb, ${tint} 42%, var(--bg-elevated)) 0%, color-mix(in srgb, ${tint} 26%, var(--bg-elevated)) 100%)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2), -2px 0 8px color-mix(in srgb, ${tint} 24%, transparent)`,
  }
}
