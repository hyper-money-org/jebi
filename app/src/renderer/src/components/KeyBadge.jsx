// Renders macOS-style keyboard shortcut badges with consistent icon sizing.

function CmdIcon() {
  return (
    <div style={{ fontSize: 16, marginTop: 1 }}>⌘</div>
  )
}

function ShiftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3L4 11h5v10h6V11h5L12 3z"/>
    </svg>
  )
}

function OptIcon() {
  return (
    <div style={{ fontSize: 14, marginTop: -1 }}>⌥</div>
  )
}

export default function KeyBadge({ keys = [], style = {} }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: '10px',
    borderRadius: 4,
    padding: '2px 7px',
    flexShrink: 0,
    lineHeight: 1,
    ...style,
  }

  return (
    <span style={base}>
      {keys.map((k, i) => {
        if (k === 'cmd')   return <CmdIcon key={i} />
        if (k === 'shift') return <ShiftIcon key={i} />
        if (k === 'opt')   return <OptIcon key={i} />
        return <span key={i} style={{ fontSize: 12, marginTop: 1 }}>{k}</span>
      })}
    </span>
  )
}
