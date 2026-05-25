import { useState } from 'react'
import { VscSourceControl } from 'react-icons/vsc'
import { neonGlassStyle, neonGlassHoverStyle, stopSegmentEvents } from './segmentStyle'

export default function GitSegment({
  branch,
  dirty,
  ahead,
  behind,
  staged = 0,
  modified = 0,
  untracked = 0,
  onClick,
  rowHeight,
  iconSize,
  minimal,
}) {
  const [hovered, setHovered] = useState(false)
  const compact = rowHeight != null
  const tint = 'var(--prompt-git-tint)'
  const base = neonGlassStyle({ tint, compact, rowHeight, onClick, minimal })
  const style = hovered ? { ...base, ...neonGlassHoverStyle(tint, minimal) } : base

  const title = [
    `Branch: ${branch}`,
    staged > 0 ? `${staged} staged` : null,
    modified > 0 ? `${modified} modified` : null,
    untracked > 0 ? `${untracked} untracked` : null,
    ahead > 0 ? `${ahead} ahead` : null,
    behind > 0 ? `${behind} behind` : null,
  ].filter(Boolean).join(' · ')

  return (
    <button
      onClick={onClick}
      onMouseDown={stopSegmentEvents}
      onPointerDown={stopSegmentEvents}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={style}
    >
      <VscSourceControl size={iconSize ?? 12} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '20ch' }}>
        {branch}
      </span>
      {dirty && staged + modified + untracked === 0 && <span style={{ color: '#f1c40f', flexShrink: 0, fontSize: '0.75em' }}>✦</span>}
      {staged > 0 && <span style={{ color: '#2ecc71', flexShrink: 0, fontSize: '0.85em' }}>+{staged}</span>}
      {modified > 0 && <span style={{ color: '#f1c40f', flexShrink: 0, fontSize: '0.85em' }}>~{modified}</span>}
      {untracked > 0 && <span style={{ color: '#9b59b6', flexShrink: 0, fontSize: '0.85em' }}>?{untracked}</span>}
      {ahead > 0 && <span style={{ color: '#e74c3c', flexShrink: 0, fontSize: '0.85em' }}>↑{ahead}</span>}
      {behind > 0 && <span style={{ color: '#2ecc71', flexShrink: 0, fontSize: '0.85em' }}>↓{behind}</span>}
    </button>
  )
}
