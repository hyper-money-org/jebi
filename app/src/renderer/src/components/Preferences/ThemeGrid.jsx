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
      padding: '8px',
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '4px',
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
