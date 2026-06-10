import { usePreferences } from '../../hooks/usePreferences'
import { FONT_OPTIONS, UI_FONT_OPTIONS } from '../../preferences/fonts'
import ThemeGrid from './ThemeGrid'
import FontSizeControl from './FontSizeControl'

const UI_SIZES = [11, 12, 13, 14, 15, 16, 17, 18]

const sectionLabel = {
  fontSize: 'var(--font-size-ui)',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '10px',
  fontFamily: 'var(--font-ui)',
}

const selectStyle = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 'var(--font-size-ui)',
  fontFamily: 'var(--font-ui)',
  cursor: 'pointer',
  outline: 'none',
}

export default function AppearanceSection() {
  const { prefs, setFontFamily, setUiFontSize, setUiFontFamily } = usePreferences()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      <div>
        <div style={sectionLabel}>Theme</div>
        <ThemeGrid />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Terminal Font */}
        <div>
          <div style={sectionLabel}>Terminal Font</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '50px', fontSize: 'var(--font-size-ui)', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                Family
              </span>
              <select
                value={prefs.fontFamily}
                onChange={e => setFontFamily(e.target.value)}
                style={selectStyle}
              >
                {FONT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '50px', fontSize: 'var(--font-size-ui)', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                Size
              </span>
              <div style={{ flex: 1 }}>
                <FontSizeControl />
              </div>
            </div>
          </div>
        </div>

        {/* UI Font */}
        <div>
          <div style={sectionLabel}>UI Font</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '50px', fontSize: 'var(--font-size-ui)', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                Family
              </span>
              <select
                value={prefs.uiFontFamily ?? 'system-ui, sans-serif'}
                onChange={e => setUiFontFamily(e.target.value)}
                style={selectStyle}
              >
                {UI_FONT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '50px', fontSize: 'var(--font-size-ui)', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
                Size
              </span>
              <select
                value={prefs.uiFontSize ?? 13}
                onChange={e => setUiFontSize(parseInt(e.target.value, 10))}
                style={selectStyle}
              >
                {UI_SIZES.map(s => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
