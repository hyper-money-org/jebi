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

function palette(id, name, bgBase, bgSurface, bgElevated, border, overrides = {}) {
  return { id, name, bgBase, colors: { bgBase, bgSurface, bgElevated, border, ...FIXED, ...overrides } }
}

const LIGHT_TEXT = {
  textPrimary:   '#1c1c20',
  textSecondary: '#52525c',
  textMuted:     '#8888a0',
  onAccent:      '#ffffff',
  error:         '#c0392b',
}

export const PALETTES = [
  // Dark — pure neutrals (clearly different greys)
  palette('pitch',    'Pitch',     '#0a0a0b', '#060607', '#141415', '#222224'),
  palette('charcoal', 'Charcoal',  '#222222', '#1a1a1a', '#2e2e2e', '#404040'),
  palette('iron',     'Iron',      '#343840', '#2a2e36', '#42464f', '#585e6a'),
  // Dark — blues & navy
  palette('navy',     'Navy',      '#0c1f40', '#081630', '#162e58', '#244870'),
  palette('ocean',    'Ocean',     '#0a2640', '#071c30', '#123450', '#1e4468'),
  palette('nord',     'Nord',      '#2e3440', '#242933', '#3b4252', '#434c5e'),
  palette('slate',    'Slate',     '#1c2a40', '#141e30', '#263650', '#385068'),
  // Dark — purples
  palette('midnight', 'Midnight',  '#12082e', '#0d061e', '#1e1040', '#302060'),
  palette('dusk',     'Dusk',      '#1e1032', '#160c24', '#2c1848', '#402860'),
  // Dark — greens & teal
  palette('forest',   'Forest',    '#0e2414', '#081a0c', '#163020', '#244030'),
  palette('teal',     'Teal',      '#0a2626', '#061c1c', '#103434', '#1a4848'),
  // Dark — warm: reds, browns, oranges
  palette('maroon',   'Maroon',    '#2e0a0a', '#200606', '#3e1212', '#561c1c'),
  palette('ember',    'Ember',     '#2e1406', '#200e04', '#402010', '#583018'),
  palette('gruvbox',  'Gruvbox',   '#282828', '#1d2021', '#3c3836', '#504945'),
  palette('coffee',   'Coffee',    '#2a1a0e', '#1e1208', '#38261a', '#4e3828'),
  // Light — warm
  palette('butter',   'Butter',    '#fdf8de', '#f8f0c8', '#fefcee', '#e4d8a8', LIGHT_TEXT),
  palette('peach',    'Peach',     '#fdeee0', '#f8e4d0', '#fef7ee', '#eacfb0', LIGHT_TEXT),
  // Light — cool
  palette('frost',    'Frost',     '#e8f0fc', '#dce8f8', '#f2f7fe', '#b8ccee', LIGHT_TEXT),
  palette('mist',     'Mist',      '#ebebf0', '#e0e0ea', '#f4f4f8', '#c8c8d8', LIGHT_TEXT),
  // Light — tinted
  palette('blush',    'Blush',     '#fce8ec', '#f8dce2', '#fef4f6', '#e8b8c4', LIGHT_TEXT),
  palette('sage',     'Sage',      '#e6f2e8', '#d8eada', '#f0f8f2', '#b0d4b8', LIGHT_TEXT),
]

export const PALETTE_MAP = Object.fromEntries(PALETTES.map(p => [p.id, p]))
