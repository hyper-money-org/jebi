// ModelCard — displays a single downloadable/activatable model.

function formatBytes(b) { return (b / 1e9).toFixed(1) + ' GB' }
function formatSpeed(bps) { return (bps / 1e6).toFixed(1) + ' MB/s' }
function formatETA(bytesLeft, speedBps) {
  if (!speedBps) return '–'
  const secs = bytesLeft / speedBps
  if (secs < 60) return `${Math.round(secs)}s`
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
}

export default function ModelCard({ model, isActive, onActivate, onDownload, onCancel, downloadProgress }) {
  const isDownloading = !!downloadProgress

  const cardStyle = {
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '10px 12px',
    marginBottom: 6,
    background: 'var(--bg-surface)',
  }

  const nameStyle = {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-ui)',
    marginBottom: 2,
  }

  const descStyle = {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-ui)',
    lineHeight: 1.4,
  }

  const actionBtnBase = {
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  }

  // ── Downloading state ──────────────────────────────────────────────────────
  if (isDownloading) {
    const { bytesReceived, totalBytes, speedBps } = downloadProgress
    const pct = totalBytes > 0 ? Math.round((bytesReceived / totalBytes) * 100) : 0
    const eta = formatETA(totalBytes - bytesReceived, speedBps)

    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>{model.name}</div>
            {/* Progress bar */}
            <div style={{
              height: 6, borderRadius: 3, background: 'var(--border)',
              overflow: 'hidden', marginTop: 6, marginBottom: 4,
            }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'var(--accent)', borderRadius: 3,
                transition: 'width 0.3s',
              }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {pct}% · {formatSpeed(speedBps)} · {eta} left
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{ ...actionBtnBase, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', marginTop: 2 }}
          >
            ✕ Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Active state ───────────────────────────────────────────────────────────
  if (isActive) {
    return (
      <div style={{ ...cardStyle, borderColor: 'var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>{model.name}</div>
            {model.description && <div style={descStyle}>{model.description}</div>}
          </div>
          <span style={{
            fontSize: '11px', fontFamily: 'var(--font-mono)',
            color: 'var(--accent)', flexShrink: 0,
            paddingTop: 2,
          }}>
            ● Active
          </span>
        </div>
      </div>
    )
  }

  // ── Downloaded (not active) ────────────────────────────────────────────────
  if (model.downloaded) {
    return (
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={nameStyle}>{model.name}</div>
            {model.description && <div style={descStyle}>{model.description}</div>}
          </div>
          <button
            onClick={onActivate}
            style={{ ...actionBtnBase, background: 'var(--accent)', color: 'var(--on-accent)', marginTop: 2 }}
          >
            Set Active
          </button>
        </div>
      </div>
    )
  }

  // ── Not downloaded ─────────────────────────────────────────────────────────
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={nameStyle}>{model.name}</div>
          {model.description && <div style={descStyle}>{model.description}</div>}
          {model.sizeBytes != null && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
              {formatBytes(model.sizeBytes)}
            </div>
          )}
        </div>
        <button
          onClick={onDownload}
          style={{ ...actionBtnBase, background: 'var(--accent)', color: 'var(--on-accent)', marginTop: 2 }}
        >
          Download
        </button>
      </div>
    </div>
  )
}
