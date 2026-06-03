import { useState } from 'react'
import condaIcon from '../../assets/conda.png'
import { neonGlassStyle, neonGlassHoverStyle, stopSegmentEvents } from './segmentStyle'

export default function CondaSegment({ env, onClick, rowHeight, iconSize, minimal }) {
  const [hovered, setHovered] = useState(false)
  const tint = 'var(--prompt-conda-tint)'
  const base = neonGlassStyle({ tint, onClick, minimal })
  const style = hovered ? { ...base, ...neonGlassHoverStyle(tint, minimal) } : base

  return (
    <button tabIndex={-1} onClick={onClick} onMouseDown={stopSegmentEvents} onPointerDown={stopSegmentEvents}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            title={`Conda: ${env}`} style={style}>
      <img src={condaIcon} style={{ width: 14, height: 14, flexShrink: 0 }} alt="" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '12ch' }}>{env}</span>
    </button>
  )
}
