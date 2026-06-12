import { THEMES, THEME_IDS } from '../../preferences/themes'
import { usePreferences } from '../../hooks/usePreferences'
import ThemeSwatch from './ThemeSwatch'

export default function ThemeGrid() {
  const { prefs, setTheme } = usePreferences()

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '8px 4px',
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
