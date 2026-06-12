// Compatibility shim — THEMES and THEME_IDS now map to palettes.
import { PALETTES, PALETTE_MAP } from './palettes'

export const THEME_IDS = PALETTES.map(p => p.id)
export const THEMES = Object.fromEntries(
  PALETTES.map(p => [p.id, { id: p.id, name: p.name, colors: p.colors }])
)
