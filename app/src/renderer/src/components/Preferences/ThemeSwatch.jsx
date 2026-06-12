export default function ThemeSwatch({ theme, isActive, onSelect }) {
  const { name, colors } = theme

  return (
    <button
      onClick={onSelect}
      title={name}
      style={{
        background: 'none', border: 'none', padding: 0,
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 5, outline: 'none',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: colors.bgBase,
        border: `2px solid ${isActive ? 'var(--brand)' : colors.border}`,
        boxShadow: isActive
          ? `0 0 0 3px var(--brand-glow), inset 0 0 0 3px ${colors.bgElevated}`
          : `inset 0 0 0 3px ${colors.bgElevated}`,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }} />
      <span style={{
        fontSize: 10,
        color: isActive ? 'var(--brand)' : 'var(--text-muted)',
        fontFamily: 'var(--font-ui)',
        fontWeight: isActive ? 600 : 400,
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
    </button>
  )
}
