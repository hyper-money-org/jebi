import PropTypes from 'prop-types'
import { useAIStatus } from '../../hooks/useAIStatus'

export default function StatusBar({ onOpenAISettings }) {
  const aiStatus = useAIStatus()

  if (aiStatus.status === 'unknown') return null

  const available = aiStatus.status === 'available'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '3px 10px',
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border)',
      fontSize: '11px',
      gap: 6,
    }}>
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
    </div>
  )
}

StatusBar.propTypes = {
  onOpenAISettings: PropTypes.func,
}
