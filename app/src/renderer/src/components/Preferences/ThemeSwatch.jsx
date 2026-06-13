import { useState } from 'react'

function isLight(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}

export default function ThemeSwatch({ theme, isActive, onSelect }) {
  const { name, colors } = theme
  const [hovered, setHovered] = useState(false)
  const light = isLight(colors.bgBase)
  const checkColor = light ? '#1c1c20' : '#ffffff'
  const hoverRing = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)'

  return (
    <button
      onClick={onSelect}
      title={name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bgBase,
        border: light ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.06)',
        padding: 0,
        cursor: 'pointer',
        borderRadius: 4,
        aspectRatio: '1',
        width: '100%',
        position: 'relative',
        outline: isActive ? '2px solid var(--brand)' : hovered ? `2px solid ${hoverRing}` : '2px solid transparent',
        outlineOffset: '2px',
        transform: hovered && !isActive ? 'scale(1.15)' : 'scale(1)',
        transition: 'outline-color 0.12s, transform 0.12s',
        zIndex: hovered ? 1 : 0,
        boxSizing: 'border-box',
      }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: checkColor, fontSize: 14, fontWeight: 700,
          textShadow: light ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 3px rgba(0,0,0,0.6)',
        }}>✓</span>
      )}
    </button>
  )
}
