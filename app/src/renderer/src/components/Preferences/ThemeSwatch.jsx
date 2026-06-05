export default function ThemeSwatch({ theme, isActive, onSelect }) {
  const { colors, name } = theme

  return (
    <button
      onClick={onSelect}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 6,
        outline: 'none',
      }}
    >
      {/* Terminal window chrome */}
      <div style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: `1.5px solid ${isActive ? 'var(--brand)' : colors.border}`,
        boxShadow: isActive
          ? `0 0 0 2px var(--brand-glow), 0 4px 16px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.35)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>

        {/* Title bar */}
        <div style={{
          background: colors.bgElevated,
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5f57', flexShrink: 0 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#febc2e', flexShrink: 0 }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
          <div style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 7,
            color: colors.textMuted,
            fontFamily: 'monospace',
            letterSpacing: 0.3,
            opacity: 0.6,
            userSelect: 'none',
          }}>
            bash
          </div>
        </div>

        {/* Terminal body */}
        <div style={{
          background: colors.bgSurface,
          padding: '6px 8px 7px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3.5,
        }}>
          {/* Prompt line: ❯ ~/dev  git status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 0, height: 0,
              borderTop: '3px solid transparent',
              borderBottom: '3px solid transparent',
              borderLeft: `5px solid ${colors.accent}`,
              opacity: 0.9,
              flexShrink: 0,
            }} />
            <div style={{ height: 2.5, width: 20, borderRadius: 2, background: colors.textMuted, opacity: 0.55 }} />
            <div style={{ height: 2.5, flex: 1, borderRadius: 2, background: colors.textPrimary, opacity: 0.7 }} />
          </div>

          {/* Output line 1 */}
          <div style={{ display: 'flex', gap: 3, paddingLeft: 8 }}>
            <div style={{ height: 2.5, width: '75%', borderRadius: 2, background: colors.textPrimary, opacity: 0.3 }} />
          </div>

          {/* Output line 2 — shorter, muted */}
          <div style={{ display: 'flex', gap: 3, paddingLeft: 8 }}>
            <div style={{ height: 2.5, width: '50%', borderRadius: 2, background: colors.textMuted, opacity: 0.4 }} />
          </div>

          {/* New prompt with blinking cursor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <div style={{
              width: 0, height: 0,
              borderTop: '3px solid transparent',
              borderBottom: '3px solid transparent',
              borderLeft: `5px solid ${colors.accent}`,
              opacity: 0.9,
              flexShrink: 0,
            }} />
            <div style={{ height: 2.5, width: 20, borderRadius: 2, background: colors.textMuted, opacity: 0.55 }} />
            {/* Cursor block */}
            <div style={{
              width: 6,
              height: 9,
              borderRadius: 1,
              background: colors.accent,
              opacity: 0.85,
            }} />
          </div>
        </div>
      </div>

      {/* Label */}
      <span style={{
        fontSize: 11,
        color: isActive ? 'var(--brand)' : 'var(--text-secondary)',
        textAlign: 'center',
        fontWeight: isActive ? 600 : 400,
        fontFamily: 'var(--font-ui)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {name}
      </span>
    </button>
  )
}
