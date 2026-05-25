import { useEffect, useRef, useState } from 'react'
import { useToastList } from './ToastContext'

// --- constants ---

const MAX_VISIBLE = 5

const ACCENT_COLORS = {
  info:    'var(--accent)',
  warning: '#f59e0b',
  error:   'var(--error)',
  success: '#22c55e',
}

const TYPE_ICONS = {
  info:    'i',
  warning: '!',
  error:   '✕',
  success: '✓',
}

// --- CSS injected once ---

const STYLE_ID = 'jebi-toast-styles'

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes jebi-toast-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes jebi-toast-out {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(8px); }
    }
    @keyframes jebi-toast-progress {
      from { width: 100%; }
      to   { width: 0%; }
    }
    .jebi-toast-entering {
      animation: jebi-toast-in 200ms ease forwards;
    }
    .jebi-toast-exiting {
      animation: jebi-toast-out 150ms ease forwards;
    }
    .jebi-toast-progress-bar {
      animation: jebi-toast-progress linear forwards;
    }
  `
  document.head.appendChild(style)
}

// --- single toast item ---

function ToastItem({ toast, onDismiss, onRemove }) {
  const [exiting, setExiting] = useState(false)
  const exitTimer = useRef(null)

  // Ensure CSS is in the DOM
  useEffect(() => { ensureStyles() }, [])

  // Watch for the context-driven exiting flag (e.g. from auto-dismiss timer)
  useEffect(() => {
    if (toast.exiting && !exiting) {
      setExiting(true)
      toast.onDismiss?.()
      exitTimer.current = setTimeout(() => {
        onRemove(toast.id)
      }, 150)
    }
  }, [toast.exiting]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismiss() {
    if (exiting) return
    setExiting(true)
    toast.onDismiss?.()
    exitTimer.current = setTimeout(() => {
      onRemove(toast.id)
    }, 150)
    // Also call onDismiss so the context clears the auto-timer
    onDismiss(toast.id)
  }

  useEffect(() => {
    return () => { if (exitTimer.current) clearTimeout(exitTimer.current) }
  }, [])

  const accentColor = ACCENT_COLORS[toast.type] ?? ACCENT_COLORS.info
  const icon        = TYPE_ICONS[toast.type]    ?? TYPE_ICONS.info

  return (
    <div
      className={exiting ? 'jebi-toast-exiting' : 'jebi-toast-entering'}
      style={{
        position: 'relative',
        width: 360,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
      }}>
        {/* Type icon */}
        <div style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
          marginTop: 1,
          fontFamily: 'var(--font-ui, sans-serif)',
        }}>
          {icon}
        </div>

        {/* Message */}
        <div style={{
          flex: 1,
          fontSize: 13,
          lineHeight: 1.45,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-ui, sans-serif)',
          wordBreak: 'break-word',
        }}>
          {toast.message}
        </div>

        {/* Action button (optional) */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick?.()
              handleDismiss()
            }}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--accent)',
              fontSize: 12,
              fontFamily: 'var(--font-ui, sans-serif)',
              fontWeight: 600,
              padding: '0 4px',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              alignSelf: 'center',
            }}
          >
            {toast.action.label}
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 13,
            lineHeight: 1,
            padding: '1px 3px',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar (only when duration > 0) */}
      {toast.duration > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'var(--border)',
          overflow: 'hidden',
        }}>
          <div
            className="jebi-toast-progress-bar"
            style={{
              height: '100%',
              background: accentColor,
              animationDuration: `${toast.duration}ms`,
              // Reset animation when toast is replaced (key trick won't help here,
              // but duration is typically fixed per show())
            }}
          />
        </div>
      )}
    </div>
  )
}

// --- manager ---

export function ToastManager() {
  const { toasts, dismiss, remove } = useToastList()

  const visible = toasts.slice(-MAX_VISIBLE)

  if (visible.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {visible.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={dismiss} onRemove={remove} />
        </div>
      ))}
    </div>
  )
}

export default ToastManager
