import { THEMES, THEME_IDS } from '../../preferences/themes'
import { usePreferences } from '../../hooks/usePreferences'
import ThemeSwatch from './ThemeSwatch'

export default function ThemeGrid() {
  const { prefs, setTheme } = usePreferences()

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '8px',
      display: 'grid',
      gridTemplateColumns: 'repeat(15, 1fr)',
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
