import { useState } from 'react'
import cIcon from '../../assets/c.png'
import { neonGlassStyle, neonGlassHoverStyle, stopSegmentEvents } from './segmentStyle'

export default function CSegment({ version, onClick, rowHeight, iconSize, minimal }) {
  const [hovered, setHovered] = useState(false)
  const tint = 'var(--prompt-c-tint)'
  const base = neonGlassStyle({ tint, onClick, minimal })
  const style = hovered ? { ...base, ...neonGlassHoverStyle(tint, minimal) } : base

  return (
    <button tabIndex={-1} onClick={onClick} onMouseDown={stopSegmentEvents} onPointerDown={stopSegmentEvents}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            title={`C/C++ ${version}`} style={style}>
      <img src={cIcon} style={{ width: 14, height: 14, flexShrink: 0 }} alt="" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '12ch' }}>{version}</span>
    </button>
  )
}
