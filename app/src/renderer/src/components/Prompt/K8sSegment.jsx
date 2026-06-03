import { useState } from 'react'
import k8sIcon from '../../assets/k8s.png'
import { neonGlassStyle, neonGlassHoverStyle, stopSegmentEvents } from './segmentStyle'

export default function K8sSegment({ context, namespace, onClick, rowHeight, iconSize, minimal }) {
  const [hovered, setHovered] = useState(false)
  const tint = 'var(--prompt-k8s-tint)'
  const base = neonGlassStyle({ tint, onClick, minimal })
  const style = hovered ? { ...base, ...neonGlassHoverStyle(tint, minimal) } : base
  const label = namespace && namespace !== 'default' ? `${context}:${namespace}` : context

  return (
    <button tabIndex={-1} onClick={onClick} onMouseDown={stopSegmentEvents} onPointerDown={stopSegmentEvents}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            title={`kubectl context: ${context} · namespace: ${namespace || 'default'}`} style={style}>
      <img src={k8sIcon} style={{ width: 14, height: 14, flexShrink: 0 }} alt="" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '18ch' }}>{label}</span>
    </button>
  )
}
