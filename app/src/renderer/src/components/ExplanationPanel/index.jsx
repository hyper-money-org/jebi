function renderWithCode(text) {
  const re = /`+([^`]+)`+/g;
  if (!re.test(text)) return text;
  re.lastIndex = 0;
  const nodes = [];
  let key = 0;
  const raw = text;
  let last = 0;
  let m;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) nodes.push(raw.slice(last, m.index));
    nodes.push(
      <code
        key={key++}
        style={{
          background: 'color-mix(in srgb, var(--tab-accent) 25%, transparent)',
          color: '#ffffff',
          fontWeight: 600,
          borderRadius: 3,
          padding: '1px 6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.95em',
        }}
      >
        {m[1]}
      </code>,
    );
    last = m.index + m[0].length;
  }
  if (last < raw.length) nodes.push(raw.slice(last));
  return nodes;
}

const PANEL_LABELS = {
  error:      'What went wrong?',
  summary:    'Session summary',
  info:       'Context',
  warning:    'Heads up',
  suggestion: 'Suggestion',
}

export default function ExplanationPanel({ text, type, onDismiss }) {
  const label = PANEL_LABELS[type] || PANEL_LABELS.error
  return (
    <div
      style={{
        position: 'relative',
        margin: '0',
        borderTop: '1px solid color-mix(in srgb, var(--tab-accent) 30%, transparent)',
        borderLeft: '5px solid var(--tab-accent)',
        background: 'color-mix(in srgb, var(--tab-accent) 7%, var(--bg-surface))',
        animation: 'bannerSlideIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes bannerSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px 0',
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--tab-accent)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="13" height="13">
            <polygon points="78,159 181,96 434,96 331,159" fill="currentColor"/>
            <polygon points="331,159 434,96 434,354 331,417" fill="currentColor" opacity="0.6"/>
            <polygon points="78,159 331,159 331,417 78,417" fill="#060a12"/>
            <polyline points="126,247 172,288 126,330" fill="none" stroke="currentColor" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            <rect x="186" y="310" width="83" height="16" rx="4" fill="white" opacity=".85"/>
          </svg>
          {label}
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 2px',
              opacity: 0.6,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.target.style.opacity = 1}
            onMouseLeave={e => e.target.style.opacity = 0.6}
          >
            ×
          </button>
        )}
      </div>

      {/* Explanation text */}
      <div style={{
        padding: '8px 12px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--font-size-mono)',
        color: 'var(--text-primary)',
        lineHeight: 1.65,
      }}>
        {renderWithCode(text)}
      </div>
    </div>
  );
}
