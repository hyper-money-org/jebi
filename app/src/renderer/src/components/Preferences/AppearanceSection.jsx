import { usePreferences } from '../../hooks/usePreferences'
import { FONT_OPTIONS, UI_FONT_OPTIONS } from '../../preferences/fonts'
import ThemeGrid from './ThemeGrid'
import FontSizeControl from './FontSizeControl'

const UI_SIZES = [11, 12, 13, 14, 15, 16, 17, 18]

function Card({ children }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--bg-elevated)',
    }}>
      {children}
    </div>
  )
}

function Row({ label, children, last }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '9px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      gap: 16,
    }}>
      <span style={{
        fontSize: 13,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-primary)',
        flexShrink: 0,
      }}>
        {label}
      </span>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-ui)',
      marginBottom: 6,
      paddingLeft: 2,
    }}>
      {children}
    </div>
  )
}

const selectStyle = {
  padding: '4px 8px',
  border: '1px solid var(--border)',
  borderRadius: 5,
  background: 'var(--bg-base)',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-ui)',
  cursor: 'pointer',
  outline: 'none',
  maxWidth: 200,
}

function Toggle({ on, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
        background: on ? 'var(--accent)' : 'var(--border)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: on ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </div>
  )
}

export default function AppearanceSection() {
  const { prefs, setFontFamily, setUiFontSize, setUiFontFamily, setTerminalGrain, setTerminalGrainIntensity } = usePreferences()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <SectionLabel>Background</SectionLabel>
        <ThemeGrid />
      </div>

      <div>
        <SectionLabel>Terminal Font</SectionLabel>
        <Card>
          <Row label="Family">
            <select value={prefs.fontFamily} onChange={e => setFontFamily(e.target.value)} style={selectStyle}>
              {FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Row>
          <Row label="Size" last>
            <FontSizeControl />
          </Row>
        </Card>
      </div>

      <div>
        <SectionLabel>UI Font</SectionLabel>
        <Card>
          <Row label="Family">
            <select value={prefs.uiFontFamily ?? 'system-ui, sans-serif'} onChange={e => setUiFontFamily(e.target.value)} style={selectStyle}>
              {UI_FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Row>
          <Row label="Size" last>
            <select value={prefs.uiFontSize ?? 13} onChange={e => setUiFontSize(parseInt(e.target.value, 10))} style={selectStyle}>
              {UI_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
            </select>
          </Row>
        </Card>
      </div>

      <div>
        <SectionLabel>Grain</SectionLabel>
        <Card>
          <Row label="Enable">
            <Toggle on={prefs.terminalGrain} onToggle={() => setTerminalGrain(!prefs.terminalGrain)} />
          </Row>
          <Row label="Intensity" last>
            <input
              type="range" min="1" max="20" step="1"
              value={prefs.terminalGrainIntensity}
              onChange={e => setTerminalGrainIntensity(parseInt(e.target.value, 10))}
              disabled={!prefs.terminalGrain}
              style={{ flex: 1, accentColor: 'var(--accent)', opacity: prefs.terminalGrain ? 1 : 0.3, maxWidth: 200 }}
            />
          </Row>
        </Card>
      </div>

    </div>
  )
}
