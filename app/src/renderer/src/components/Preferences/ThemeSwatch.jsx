import { useState } from 'react'

export default function ThemeSwatch({ theme, isActive, onSelect }) {
  const { name, colors } = theme
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onSelect}
      title={name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.bgBase,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        borderRadius: 4,
        aspectRatio: '1',
        width: '100%',
        position: 'relative',
        outline: isActive ? '2px solid var(--brand)' : hovered ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
        outlineOffset: '2px',
        transform: hovered && !isActive ? 'scale(1.15)' : 'scale(1)',
        transition: 'outline-color 0.12s, transform 0.12s',
        zIndex: hovered ? 1 : 0,
      }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700,
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        }}>✓</span>
      )}
    </button>
  )
}
