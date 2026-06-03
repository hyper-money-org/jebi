export default function AboutSection() {
  const year = new Date().getFullYear()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px 4px' }}>
      {/* Logo placeholder */}
      <div style={{
        width: 80, height: 80, borderRadius: 18, flexShrink: 0,
        background: 'var(--bg-elevated)',
        border: '1px dashed var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', opacity: 0.4 }}>logo</span>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontSize: 16, fontWeight: 700,
          fontFamily: 'var(--font-ui)', color: 'var(--text-primary)',
        }}>
          {__APP_NAME__}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}>
          Version {__APP_VERSION__}
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', opacity: 0.55, marginTop: 2 }}>
          © {year} All Rights Reserved.
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', opacity: 0.4, marginTop: 6 }}>
          Updates coming soon
        </div>
      </div>
    </div>
  )
}
