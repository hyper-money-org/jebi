import { useState, useEffect, useRef, useCallback } from 'react'

export default function FilePreviewPanel({ filePath, onClose }) {
  const [content, setContent] = useState(null) // null = loading
  const [edited, setEdited] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [discardWarning, setDiscardWarning] = useState(false)
  const [binaryError, setBinaryError] = useState(false)
  const textareaRef = useRef(null)

  const fileName = filePath.split('/').pop()

  useEffect(() => {
    window.electron.fs.readFile(filePath).then((data) => {
      if (data === null) {
        setBinaryError(true)
        setContent('')
        setEdited('')
      } else {
        setContent(data)
        setEdited(data)
      }
    })
  }, [filePath])

  useEffect(() => {
    if (content !== null) textareaRef.current?.focus()
  }, [content])

  const save = useCallback(async () => {
    if (!dirty || saving) return
    setSaving(true)
    setSaveError(null)
    const result = await window.electron.fs.writeFile(filePath, edited)
    setSaving(false)
    if (result.ok) {
      setContent(edited)
      setDirty(false)
      setDiscardWarning(false)
    } else {
      setSaveError(result.error)
    }
  }, [filePath, edited, dirty, saving])

  const close = useCallback(() => {
    if (dirty && !discardWarning) {
      setDiscardWarning(true)
      return
    }
    onClose()
  }, [dirty, discardWarning, onClose])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [save, close])

  const handleChange = (e) => {
    setEdited(e.target.value)
    setDirty(true)
    setDiscardWarning(false)
    setSaveError(null)
  }

  // Tab key inserts spaces instead of shifting focus
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = edited.slice(0, start) + '  ' + edited.slice(end)
      setEdited(next)
      setDirty(true)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  // Auto-height: grow with content up to full panel, then scroll
  const lineCount = edited.split('\n').length
  const rows = Math.max(lineCount + 1, 8)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
        zIndex: 60,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
        flexShrink: 0,
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {dirty && (
            <span style={{ color: 'var(--accent)', fontSize: 14, lineHeight: 1 }}>●</span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--text-primary)',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {fileName}
          </span>
          {saving && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              saving…
            </span>
          )}
          {saveError && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f87171' }}>
              {saveError}
            </span>
          )}
          {discardWarning && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fb923c' }}>
              unsaved changes — ⌘S to save, Esc again to discard
            </span>
          )}
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}>
          {filePath.replace(fileName, '').replace(/\/$/, '')}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {content === null && !binaryError && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        )}
        {binaryError && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Cannot preview this file (binary or too large).
          </div>
        )}
        {content !== null && !binaryError && (
          <textarea
            ref={textareaRef}
            value={edited}
            rows={rows}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-mono)',
              lineHeight: 1.6,
              padding: '8px 14px',
              boxSizing: 'border-box',
              overflowY: 'auto',
            }}
          />
        )}
      </div>

      {/* Footer */}
      {!binaryError && (
        <div style={{
          padding: '3px 12px',
          borderTop: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
          flexShrink: 0,
          display: 'flex',
          gap: 16,
        }}>
          <span>⌘S save</span>
          <span>⌘Z undo</span>
          <span>⌘X cut</span>
          <span>⌘C copy</span>
          <span>⌘V paste</span>
          <span>Esc close</span>
        </div>
      )}
    </div>
  )
}
