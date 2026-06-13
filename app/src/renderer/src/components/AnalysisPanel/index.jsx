import { useState } from 'react'

const ICONS = {
  error: (color) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5.25" stroke={color} strokeWidth="1.5"/>
      <line x1="4" y1="4" x2="8" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8" y1="4" x2="4" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  warning: (color) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5L11 10.5H1L6 1.5Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <line x1="6" y1="5" x2="6" y2="7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="9" r="0.75" fill={color}/>
    </svg>
  ),
  metric: (color) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1" y="7" width="2.5" height="4" rx="0.5" fill={color}/>
      <rect x="4.75" y="4" width="2.5" height="7" rx="0.5" fill={color} opacity="0.8"/>
      <rect x="8.5" y="1" width="2.5" height="10" rx="0.5" fill={color} opacity="0.6"/>
    </svg>
  ),
  insight: (color) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5.25" stroke={color} strokeWidth="1.5"/>
      <line x1="6" y1="5.5" x2="6" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="3.5" r="0.75" fill={color}/>
    </svg>
  ),
}

const ITEM_COLORS = {
  error:   '#f87171',
  warning: '#fbbf24',
  metric:  'var(--tab-accent)',
  insight: 'var(--text-muted)',
}

const CHEVRON_DOWN = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CHEVRON_UP = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2.5 6.5L5 3.5L7.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function AnalysisPanel({ result, exitCode, onDismiss, onAction }) {
  const [expanded, setExpanded] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const isError = exitCode !== 0
  const accentColor = isError ? '#f87171' : 'var(--tab-accent)'
  const validItems = (result.items || []).filter(item => item.text?.trim())
  const visibleItems = showAll ? validItems : validItems.slice(0, 4)
  const hiddenCount = Math.max(0, validItems.length - 4)

  return (
    <div
      role="region"
      aria-label="AI output analysis"
      style={{
        position: 'relative',
        borderTop: `1px solid color-mix(in srgb, ${accentColor} 30%, transparent)`,
        borderLeft: `5px solid ${accentColor}`,
        background: 'color-mix(in srgb, var(--tab-accent) 7%, var(--bg-surface))',
        animation: 'analysisPanelIn 0.2s ease-out',
      }}
    >
      <style>{`
        @keyframes analysisPanelIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes analysisPanelIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
        .analysis-item-row {
          border-radius: 4px;
          transition: background 0.15s ease;
        }
        .analysis-item-row:hover {
          background: color-mix(in srgb, var(--tab-accent) 10%, transparent);
        }
        .analysis-dismiss-btn {
          opacity: 0.5;
          transition: opacity 0.15s ease;
        }
        .analysis-dismiss-btn:hover { opacity: 1; }
        .analysis-action-btn {
          opacity: 0.85;
          transition: opacity 0.15s ease, background 0.15s ease;
        }
        .analysis-action-btn:hover {
          opacity: 1;
          background: color-mix(in srgb, var(--tab-accent) 15%, transparent) !important;
        }
        .analysis-show-more {
          opacity: 0.55;
          transition: opacity 0.15s ease;
        }
        .analysis-show-more:hover { opacity: 1; }
        .analysis-item-row:focus-visible {
          outline: 2px solid var(--tab-accent);
          outline-offset: -2px;
        }
        .analysis-dismiss-btn:focus-visible,
        .analysis-action-btn:focus-visible {
          outline: 2px solid var(--tab-accent);
          outline-offset: 2px;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px 4px',
        gap: 8,
      }}>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: accentColor,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="13" height="13" aria-hidden="true" style={{ flexShrink: 0 }}>
            <polygon points="78,159 181,96 434,96 331,159" fill="currentColor"/>
            <polygon points="331,159 434,96 434,354 331,417" fill="currentColor" opacity="0.6"/>
            <polygon points="78,159 331,159 331,417 78,417" fill="#060a12"/>
            <polyline points="126,247 172,288 126,330" fill="none" stroke="currentColor" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            <rect x="186" y="310" width="83" height="16" rx="4" fill="white" opacity=".85"/>
          </svg>
          {result.title}
        </span>
        <button
          className="analysis-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss analysis"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 16,
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Items */}
      <div style={{ padding: '0 8px 4px' }}>
        {visibleItems.map((item, i) => {
          const color = ITEM_COLORS[item.type] || ITEM_COLORS.insight
          const icon = ICONS[item.type] || ICONS.insight
          const isExpanded = expanded === i
          const hasDetail = item.detail && item.detail.trim() !== ''

          return (
            <div key={i}>
              <div
                className="analysis-item-row"
                role={hasDetail ? 'button' : undefined}
                tabIndex={hasDetail ? 0 : undefined}
                aria-expanded={hasDetail ? isExpanded : undefined}
                onClick={hasDetail ? () => setExpanded(isExpanded ? null : i) : undefined}
                onKeyDown={hasDetail ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setExpanded(isExpanded ? null : i)
                  }
                } : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '3px 4px',
                  cursor: hasDetail ? 'pointer' : 'default',
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {icon(color)}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--font-size-mono)',
                  color: 'var(--text-primary)',
                  flex: 1,
                  lineHeight: 1.5,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.text}
                </span>
                {hasDetail && (
                  <span style={{
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    opacity: 0.6,
                  }}>
                    {isExpanded ? CHEVRON_UP : CHEVRON_DOWN}
                  </span>
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && hasDetail && (
                <div style={{
                  marginLeft: 19,
                  marginBottom: 2,
                  padding: '3px 8px',
                  borderLeft: `2px solid color-mix(in srgb, ${color} 35%, transparent)`,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--font-size-mono)',
                  color: 'var(--text-muted)',
                  lineHeight: 1.55,
                  animation: 'analysisPanelIn 0.15s ease-out',
                }}>
                  {item.detail}
                </div>
              )}
            </div>
          )
        })}

        {/* Show more */}
        {!showAll && hiddenCount > 0 && (
          <button
            className="analysis-show-more"
            onClick={() => setShowAll(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              padding: '2px 4px',
              marginTop: 1,
              display: 'block',
            }}
          >
            +{hiddenCount} more
          </button>
        )}
      </div>

      {/* Action button */}
      {result.action && (
        <div style={{ padding: '3px 10px 8px' }}>
          <button
            className="analysis-action-btn"
            onClick={() => onAction(result.action.command)}
            title={result.action.command}
            style={{
              background: `color-mix(in srgb, ${accentColor} 8%, transparent)`,
              border: `1px solid color-mix(in srgb, ${accentColor} 40%, transparent)`,
              borderRadius: 5,
              color: accentColor,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '3px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 5H8M5.5 2.5L8 5L5.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {result.action.label || result.action.command}
          </button>
        </div>
      )}
    </div>
  )
}
