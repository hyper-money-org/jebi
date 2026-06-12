// Fixed colors shared across all palettes
const FIXED = {
  textPrimary:   '#e8e8ea',
  textSecondary: '#9898a6',
  textMuted:     '#6b6b72',
  onAccent:      '#ffffff',
  error:         '#f85149',
  accent:        '#7c6af7', // fallback — overridden per-tab
  prompt: {
    tintStrength: '20%',
    cwd:     '#3b82f6',
    git:     '#eb6200',
    node:    '#22c55e',
    go:      '#0291b4',
    python:  '#eab308',
    docker:  '#3b82f6',
    k8s:     '#6366f1',
    rust:    '#fab387',
    c:       '#cba6f7',
    php:     '#cba6f7',
    java:    '#fab387',
    kotlin:  '#cba6f7',
    haskell: '#89dceb',
    conda:   '#74c7ec',
  },
}

function palette(id, name, bgBase, bgSurface, bgElevated, border) {
  return { id, name, bgBase, colors: { bgBase, bgSurface, bgElevated, border, ...FIXED } }
}

export const PALETTES = [
  // Neutrals
  palette('obsidian', 'Obsidian',  '#141416', '#141416', '#1c1c1f', '#2a2a2e'),
  palette('charcoal', 'Charcoal',  '#1a1a1a', '#141414', '#242424', '#2e2e2e'),
  palette('gruvbox',  'Gruvbox',   '#282828', '#1d2021', '#3c3836', '#504945'),
  palette('nord',     'Nord',      '#2e3440', '#242933', '#3b4252', '#434c5e'),
  palette('abyss',    'Abyss',     '#070d14', '#050a10', '#0e1821', '#162030'),
  // Color-tinted darks
  palette('midnight', 'Midnight',  '#0d0d18', '#09090f', '#13131f', '#1e1e2e'),
  palette('slate',    'Slate',     '#1a1d2e', '#13162a', '#242840', '#303560'),
  palette('dusk',     'Dusk',      '#1a1526', '#130f1e', '#251d38', '#352848'),
  palette('indigo',   'Indigo',    '#0e0e24', '#08081a', '#161630', '#24246a'),
  palette('teal',     'Teal',      '#091918', '#061210', '#0f2624', '#164038'),
  palette('forest',   'Forest',    '#111a10', '#0c1409', '#192619', '#253826'),
  palette('rose',     'Rose',      '#1a0e12', '#13090d', '#261520', '#3a2030'),
  palette('mocha',    'Mocha',     '#1c1008', '#150c05', '#281a10', '#3a2818'),
  palette('wine',     'Wine',      '#180c14', '#110810', '#24121e', '#38182e'),
  palette('copper',   'Copper',    '#1a1208', '#130e05', '#261c10', '#3a2c1a'),
]

export const PALETTE_MAP = Object.fromEntries(PALETTES.map(p => [p.id, p]))
