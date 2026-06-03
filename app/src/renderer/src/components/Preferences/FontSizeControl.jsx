import { usePreferences } from '../../hooks/usePreferences'

const SIZES = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22]

export default function FontSizeControl() {
  const { prefs, setFontSize } = usePreferences()

  return (
    <select
      value={prefs.fontSize}
      onChange={e => setFontSize(parseInt(e.target.value, 10))}
      style={{
        width: '100%',
        padding: '6px 10px',
        border: '1px solid var(--border)',
        borderRadius: '5px',
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontFamily: 'var(--font-mono)',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {SIZES.map(s => (
        <option key={s} value={s}>{s}px</option>
      ))}
      {!SIZES.includes(prefs.fontSize) && (
        <option value={prefs.fontSize}>{prefs.fontSize}px</option>
      )}
    </select>
  )
}
