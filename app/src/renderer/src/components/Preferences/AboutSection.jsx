import { useState } from 'react'
import logoUrl from '../../assets/jebi-logo.svg'
import { useUpdateStatus, checkForUpdates } from '../../hooks/useUpdateStatus'

const styles = `
  @keyframes jebi-spin {
    to { transform: rotate(360deg); }
  }
  .jebi-update-link:hover {
    text-decoration: underline !important;
  }
  .jebi-check-btn:hover:not(:disabled) {
    background: var(--bg-surface) !important;
  }
`

export default function AboutSection() {
  const year = new Date().getFullYear()
  const updateStatus = useUpdateStatus()
  const [checked, setChecked] = useState(false)

  async function handleCheck() {
    setChecked(true)
    await checkForUpdates()
  }

  const showResult = checked && !updateStatus.checking

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: '24px 4px' }}>
      <style>{styles}</style>

      {/* Logo + name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <img src={logoUrl} style={{ width: 72, height: 72, flexShrink: 0 }} alt="jebi" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{
            fontSize: 18, fontWeight: 700,
            fontFamily: 'var(--font-ui)', color: 'var(--text-primary)',
            letterSpacing: '-0.2px',
          }}>
            {__APP_NAME__}
          </div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}>
            Version {__APP_VERSION__}
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', opacity: 0.4, marginTop: 1 }}>
            © {year} All Rights Reserved.
          </div>
        </div>
      </div>

      {/* Update section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          className="jebi-check-btn"
          onClick={handleCheck}
          disabled={updateStatus.checking}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 7,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
            fontSize: 12,
            fontWeight: 500,
            cursor: updateStatus.checking ? 'default' : 'pointer',
            opacity: updateStatus.checking ? 0.6 : 1,
            alignSelf: 'flex-start',
            transition: 'background 0.15s',
          }}
        >
          {updateStatus.checking ? (
            <span style={{
              width: 11,
              height: 11,
              border: '1.5px solid var(--text-muted)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'jebi-spin 0.7s linear infinite',
            }} />
          ) : (
            <span style={{ fontSize: 13, lineHeight: 1 }}>↻</span>
          )}
          {updateStatus.checking ? 'Checking…' : 'Check for updates'}
        </button>

        {showResult && (
          <>
            {updateStatus.error && (
              <p style={{
                margin: 0,
                fontSize: 12,
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-muted)',
              }}>
                Could not check for updates. Check your connection and try again.
              </p>
            )}

            {!updateStatus.error && !updateStatus.available && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-muted)',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#22c55e', flexShrink: 0,
                }} />
                You're up to date.
              </div>
            )}

            {!updateStatus.error && updateStatus.available && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    fontFamily: 'var(--font-ui)', color: 'var(--text-primary)',
                  }}>
                    v{updateStatus.latestVersion} is available
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--text-muted)',
                    marginLeft: 2,
                  }}>
                    (current: v{updateStatus.currentVersion})
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border)', opacity: 0.5 }} />

                {/* Upgrade options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <UpgradeOption
                    label="Homebrew"
                    releaseUrl={updateStatus.releaseUrl}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--text-muted)',
                  }}>
                    <span style={{ fontSize: 11 }}>or</span>
                    <a
                      className="jebi-update-link"
                      href="#"
                      onClick={e => { e.preventDefault(); window.electron.openExternal(updateStatus.releaseUrl) }}
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontFamily: 'var(--font-ui)',
                      }}
                    >
                      Download DMG →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function UpgradeOption({ label }) {
  const [copied, setCopied] = useState(false)
  const cmd = 'brew upgrade --cask jebi'

  function copy() {
    navigator.clipboard.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{
        fontSize: 11,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        opacity: 0.7,
      }}>
        {label}
      </span>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '6px 10px',
        alignSelf: 'flex-start',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-primary)',
        }}>
          {cmd}
        </span>
        <button
          onClick={copy}
          title={copied ? 'Copied!' : 'Copy'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: copied ? '#22c55e' : 'var(--text-muted)',
            padding: 0,
            fontSize: 13,
            lineHeight: 1,
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
        >
          {copied ? '✓' : '⎘'}
        </button>
      </div>
    </div>
  )
}
