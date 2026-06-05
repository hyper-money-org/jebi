function formatSpeed(bps) { return (bps / 1e6).toFixed(1) + ' MB/s' }
function formatETA(bytesLeft, speedBps) {
  if (!speedBps) return '–'
  const secs = bytesLeft / speedBps
  if (secs < 60) return `${Math.round(secs)}s`
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
}

const cardStyle = {
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '10px 12px',
  marginBottom: 6,
  background: 'var(--bg-surface)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  minHeight: 52,
}

const btnBase = {
  padding: '5px 12px',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--font-size-ui)',
  fontFamily: 'var(--font-ui)',
  flexShrink: 0,
  whiteSpace: 'nowrap',
}

export default function ModelCard({ model, isActive, onActivate, onDownload, onCancel, downloadProgress }) {
  const isDownloading = !!downloadProgress

  const nameAndDesc = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 'var(--font-size-ui)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
        {model.name}
      </div>
      {model.description && (
        <div style={{ fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
          {model.description}
        </div>
      )}
    </div>
  )

  if (isDownloading) {
    const { bytesReceived, totalBytes, speedBps } = downloadProgress
    const pct = totalBytes > 0 ? Math.round((bytesReceived / totalBytes) * 100) : 0
    return (
      <div style={{ ...cardStyle, flexDirection: 'column', alignItems: 'stretch', minHeight: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {nameAndDesc}
          <button onClick={onCancel} style={{ ...btnBase, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginTop: 8 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          {pct}% · {formatSpeed(speedBps)} · {formatETA(totalBytes - bytesReceived, speedBps)} left
        </div>
      </div>
    )
  }

  if (isActive) {
    return (
      <div style={{ ...cardStyle, borderColor: 'var(--brand)' }}>
        {nameAndDesc}
        <div style={{ ...btnBase, background: 'color-mix(in srgb, var(--brand) 15%, transparent)', color: 'var(--brand)', cursor: 'default', border: '1px solid color-mix(in srgb, var(--brand) 40%, transparent)' }}>
          ● Active
        </div>
      </div>
    )
  }

  if (model.downloaded) {
    return (
      <div style={cardStyle}>
        {nameAndDesc}
        <button onClick={onActivate} style={{ ...btnBase, background: 'var(--brand)', color: '#fff' }}>
          Set Active
        </button>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      {nameAndDesc}
      <button onClick={onDownload} style={{ ...btnBase, background: 'var(--brand)', color: '#fff' }}>
        Download
      </button>
    </div>
  )
}
