const COLOR_TO_VAR = {
  bgBase:        '--bg-base',
  bgSurface:     '--bg-surface',
  bgElevated:    '--bg-elevated',
  border:        '--border',
  textPrimary:   '--text-primary',
  textSecondary: '--text-secondary',
  textMuted:     '--text-muted',
  accent:        '--accent',
  onAccent:      '--on-accent',
  error:         '--error',
}

const PROMPT_COLOR_TO_VAR = {
  tintStrength: '--prompt-tint-strength',
  cwd:          '--prompt-cwd-tint',
  git:          '--prompt-git-tint',
  node:         '--prompt-node-tint',
  go:           '--prompt-go-tint',
  python:       '--prompt-python-tint',
  docker:       '--prompt-docker-tint',
  k8s:          '--prompt-k8s-tint',
  rust:         '--prompt-rust-tint',
  c:            '--prompt-c-tint',
  php:          '--prompt-php-tint',
  java:         '--prompt-java-tint',
  kotlin:       '--prompt-kotlin-tint',
  haskell:      '--prompt-haskell-tint',
  conda:        '--prompt-conda-tint',
}

// Converts a 6-digit hex color to rgba(r, g, b, alpha).
// We use manual hex parsing instead of CSS color-mix() because this function
// runs at cold-start (before any stylesheet is applied) to avoid a flash of
// default colors on first paint. CSS functions require the browser to have
// already resolved its cascade, which hasn't happened yet at that point.
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// Applies a full preferences state to CSS custom properties on :root.
// Inline setProperty overrides the stylesheet-defined :root values with no
// specificity hacks required.
export function applyThemeToCSSVars(colors, fontSize, fontFamily) {
  const el = document.documentElement
  for (const [key, varName] of Object.entries(COLOR_TO_VAR)) {
    if (colors[key]) el.style.setProperty(varName, colors[key])
  }
  const promptColors = colors.prompt ?? {
    tintStrength: '20%',
    cwd: colors.accent,
    git: '#eb6200',
    node: '#22c55e',
    go: '#0291b4',
    python: '#eab308',
    docker: colors.accent,
    k8s: colors.accent,
    rust: '#fab387',
    c: colors.accent,
    php: colors.accent,
    java: colors.error,
    kotlin: colors.accent,
    haskell: '#89dceb',
    conda: '#74c7ec',
  }
  for (const [key, varName] of Object.entries(PROMPT_COLOR_TO_VAR)) {
    if (promptColors[key]) el.style.setProperty(varName, promptColors[key])
  }
  // --accent-glow is always derived from accent — never stored as an independent value.
  if (colors.accent) {
    el.style.setProperty('--accent-glow', hexToRgba(colors.accent, 0.15))
  }
  if (fontSize) {
    el.style.setProperty('--font-size-mono', `${fontSize}px`)
    el.style.setProperty('--font-size-ui', `${fontSize}px`)
  }
  if (fontFamily) {
    el.style.setProperty('--font-mono', fontFamily)
  }
}
