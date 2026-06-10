import { useAIStatus } from '../../hooks/useAIStatus'
import { useStatusMessage } from '../../hooks/useStatusMessage'
import { useUpdateStatus } from '../../hooks/useUpdateStatus'

const pulseStyle = `
  @keyframes jebi-update-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(1.6); }
  }
`

export default function StatusBar({ onOpenAISettings }) {
  const aiStatus = useAIStatus()
  const message = useStatusMessage()
  const updateStatus = useUpdateStatus()
  const version = updateStatus.currentVersion || __APP_VERSION__

  if (aiStatus.status === 'unknown' && !message && !version) return null

  const available = aiStatus.status === 'available'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '3px 10px',
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border)',
      fontSize: '11px',
      gap: 6,
      minHeight: 24,
    }}>
      <style>{pulseStyle}</style>

      {/* Version chip — left */}
      <span
        title={updateStatus.available ? `v${updateStatus.latestVersion} available` : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          opacity: 0.6,
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {updateStatus.available && (
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            flexShrink: 0,
            animation: 'jebi-update-pulse 1.8s ease-in-out infinite',
          }} />
        )}
        v{version}
      </span>

      {/* Transient message — left */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        opacity: message ? 0.8 : 0,
        transition: 'opacity 0.2s ease',
        whiteSpace: 'nowrap',
      }}>
        {message ?? ''}
      </span>

      {/* AI chip — right */}
      {aiStatus.status !== 'unknown' && (
        <button
          onClick={available ? undefined : () => onOpenAISettings?.()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            cursor: available ? 'default' : 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
            color: available ? 'var(--text-muted)' : '#f59e0b',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            opacity: available ? 0.7 : 1,
            flexShrink: 0,
          }}
          title={available ? `AI: ${aiStatus.provider}` : 'AI features need setup — click to configure'}
        >
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: available ? '#22c55e' : '#f59e0b',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          {available ? 'AI' : 'AI: setup'}
        </button>
      )}
    </div>
  )
}
