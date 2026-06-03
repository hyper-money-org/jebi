import { useState } from 'react'
import rustIcon from '../../assets/rust.png'
import { neonGlassStyle, neonGlassHoverStyle, stopSegmentEvents } from './segmentStyle'

export default function RustSegment({ version, onClick, rowHeight, iconSize, minimal }) {
  const [hovered, setHovered] = useState(false)
  const tint = 'var(--prompt-rust-tint)'
  const base = neonGlassStyle({ tint, onClick, minimal })
  const style = hovered ? { ...base, ...neonGlassHoverStyle(tint, minimal) } : base

  return (
    <button tabIndex={-1} onClick={onClick} onMouseDown={stopSegmentEvents} onPointerDown={stopSegmentEvents}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            title={`Rust ${version}`} style={style}>
      <img src={rustIcon} style={{ width: 14, height: 14, flexShrink: 0 }} alt="" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '10ch' }}>{version}</span>
    </button>
  )
}
