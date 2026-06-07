function formatSpeed(bps) { return (bps / 1e6).toFixed(1) + ' MB/s' }
function formatETA(bytesLeft, speedBps) {
  if (!speedBps) return '–'
  const secs = bytesLeft / speedBps
  if (secs < 60) return `${Math.round(secs)}s`
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
}

const btnBase = {
  padding: '4px 12px',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: 'var(--font-size-ui)',
  fontFamily: 'var(--font-ui)',
  flexShrink: 0,
  whiteSpace: 'nowrap',
}

export default function ModelCard({ model, isActive, onActivate, onDownload, onCancel, downloadProgress, isLast }) {
  const isDownloading = !!downloadProgress
  const isRecommended = model.quality === 'Recommended'

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '11px 14px',
    borderBottom: isLast ? 'none' : '1px solid var(--border)',
    background: isActive ? 'color-mix(in srgb, var(--brand) 5%, transparent)' : 'transparent',
  }

  const info = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 'var(--font-size-ui)', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
          {model.name}
        </span>
        {model.quality && (
          <span style={{
            fontSize: 10,
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            padding: '1px 7px',
            borderRadius: 100,
            background: isRecommended
              ? 'color-mix(in srgb, var(--brand) 15%, transparent)'
              : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
            color: isRecommended ? 'var(--brand)' : 'var(--text-muted)',
            border: isRecommended
              ? '1px solid color-mix(in srgb, var(--brand) 35%, transparent)'
              : '1px solid color-mix(in srgb, var(--text-muted) 25%, transparent)',
            flexShrink: 0,
          }}>
            {model.quality}
          </span>
        )}
      </div>
      {model.description && (
        <div style={{ fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: 1 }}>
          {model.description}
        </div>
      )}
    </div>
  )

  if (isDownloading) {
    const { bytesReceived, totalBytes, speedBps } = downloadProgress
    const pct = totalBytes > 0 ? Math.round((bytesReceived / totalBytes) * 100) : 0
    return (
      <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {info}
          <button onClick={onCancel} style={{ ...btnBase, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Cancel
          </button>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginTop: 8 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand)', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          {pct}% · {formatSpeed(speedBps)} · {formatETA(totalBytes - bytesReceived, speedBps)} left
        </div>
      </div>
    )
  }

  return (
    <div style={rowStyle}>
      {info}
      {isActive ? (
        <span style={{ ...btnBase, background: 'color-mix(in srgb, var(--brand) 15%, transparent)', color: 'var(--brand)', border: '1px solid color-mix(in srgb, var(--brand) 30%, transparent)', cursor: 'default' }}>
          ● Active
        </span>
      ) : model.downloaded ? (
        <button onClick={onActivate} style={{ ...btnBase, background: 'var(--brand)', color: '#fff' }}>
          Set Active
        </button>
      ) : (
        <button onClick={onDownload} style={{ ...btnBase, background: 'var(--brand)', color: '#fff' }}>
          Download
        </button>
      )}
    </div>
  )
}
