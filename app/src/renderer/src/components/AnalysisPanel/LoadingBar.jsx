export default function AnalysisLoadingBar({ message = 'Thinking…' }) {
  return (
    <div
      role="status"
      aria-label="AI analyzing output"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid color-mix(in srgb, var(--tab-accent) 30%, transparent)',
        borderLeft: '5px solid var(--tab-accent)',
        background: 'color-mix(in srgb, var(--tab-accent) 7%, var(--bg-surface))',
        animation: 'analysisBarIn 0.2s ease-out',
        height: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 10px',
      }}
    >
      <style>{`
        @keyframes analysisBarIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes analysisBarScan {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes analysisBarPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
        @media (prefers-reduced-motion: reduce) {
          .analysis-shimmer { animation: analysisBarPulse 1.4s ease-in-out infinite !important; }
        }
      `}</style>

      {/* Scanning shimmer overlay */}
      <div
        className="analysis-shimmer"
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in srgb, var(--tab-accent) 18%, transparent) 40%,
            color-mix(in srgb, var(--tab-accent) 28%, transparent) 50%,
            color-mix(in srgb, var(--tab-accent) 18%, transparent) 60%,
            transparent 100%
          )`,
          animation: 'analysisBarScan 1.6s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Jebi icon */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="12" height="12"
        aria-hidden="true"
        style={{ flexShrink: 0, zIndex: 1, color: 'var(--tab-accent)', animation: 'analysisBarPulse 1.2s ease-in-out infinite' }}
      >
        <polygon points="78,159 181,96 434,96 331,159" fill="currentColor"/>
        <polygon points="331,159 434,96 434,354 331,417" fill="currentColor" opacity="0.6"/>
        <polygon points="78,159 331,159 331,417 78,417" fill="#060a12"/>
        <polyline points="126,247 172,288 126,330" fill="none" stroke="currentColor" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
        <rect x="186" y="310" width="83" height="16" rx="4" fill="white" opacity=".85"/>
      </svg>

      {/* Label */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        fontWeight: 500,
        color: 'var(--tab-accent)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        opacity: 0.7,
        zIndex: 1,
      }}>
        {message}
      </span>
    </div>
  )
}
