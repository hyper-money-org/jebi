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

export default function ExplanationPanel({ text, onDismiss }) {
  return (
    <div
      style={{
        position: 'relative',
        margin: '0',
        borderTop: '1px solid color-mix(in srgb, var(--tab-accent) 30%, transparent)',
        borderLeft: '3px solid var(--tab-accent)',
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
          {/* Spark icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
          AI Explanation
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
