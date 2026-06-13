import { THEMES, THEME_IDS } from '../../preferences/themes'
import { usePreferences } from '../../hooks/usePreferences'
import ThemeSwatch from './ThemeSwatch'

export default function ThemeGrid() {
  const { prefs, setTheme } = usePreferences()

  return (
    <div style={{
      background: 'var(--bg-base)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '6px',
      display: 'grid',
      gridTemplateColumns: 'repeat(21, 1fr)',
      gap: '3px',
    }}>
      {THEME_IDS.map(id => (
        <ThemeSwatch
          key={id}
          theme={THEMES[id]}
          isActive={prefs.themeId === id}
          onSelect={() => setTheme(id)}
        />
      ))}
    </div>
  )
}
