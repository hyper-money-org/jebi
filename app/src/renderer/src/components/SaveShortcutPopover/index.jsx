import { useState, useEffect, useRef } from 'react'
import { setUserCommands, getUserCommands } from '../../commands/registry'

export default function SaveShortcutPopover({ command, onClose, onAliasSourced }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('alias') // 'alias' | 'command'
  const [status, setStatus] = useState(null) // null | 'saving' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setStatus('saving')
    try {
      if (type === 'alias') {
        const result = await window.electron.alias.save(trimmed, command)
        onAliasSourced?.(result.rcFile)
      } else {
        const existing = await window.electron.commands.load()
        const updated = [...(existing || []).filter(c => c.id !== trimmed), {
          id: trimmed,
          title: trimmed,
          command,
          section: 'Shortcuts',
        }]
        await window.electron.commands.save(updated)
        setUserCommands(updated)
      }
      setStatus('done')
      setTimeout(onClose, 1200)
    } catch (e) {
      setErrorMsg(e.message || 'Failed to save')
      setStatus('error')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    e.stopPropagation()
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '12px 14px',
        width: 300,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Description */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        Save this command as a reusable shortcut
      </div>

      {/* Command preview */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        background: 'var(--bg-surface)',
        borderRadius: 5,
        padding: '4px 8px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {command}
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['alias', 'command'].map(t => (
          <button
            key={t}
            onClick={() => { setType(t); setTimeout(() => inputRef.current?.focus(), 0) }}
            style={{
              flex: 1,
              padding: '4px 0',
              border: '1px solid',
              borderColor: type === t ? 'var(--accent)' : 'var(--border)',
              borderRadius: 5,
              background: type === t ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
              color: type === t ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t === 'alias' ? 'Shell alias' : '/command'}
          </button>
        ))}
      </div>

      {/* Name input */}
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={type === 'alias' ? 'alias name' : 'command name'}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 5,
          padding: '5px 8px',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          outline: 'none',
          width: '100%',
        }}
      />

      {/* Hint */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -4 }}>
        {type === 'alias'
          ? `Saves to ~/${window.electron?.shellRcBasename ?? '.zshrc'} — sourced automatically`
          : 'Available instantly via / menu'}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!name.trim() || status === 'saving' || status === 'done'}
        style={{
          background: status === 'done' ? 'color-mix(in srgb, #22c55e 20%, transparent)' : 'var(--accent)',
          color: status === 'done' ? '#22c55e' : '#fff',
          border: status === 'done' ? '1px solid #22c55e' : 'none',
          borderRadius: 5,
          padding: '5px 0',
          fontSize: 12,
          fontWeight: 600,
          cursor: status ? 'default' : 'pointer',
          opacity: !name.trim() ? 0.4 : 1,
          transition: 'all 0.15s',
        }}
      >
        {status === 'saving' ? 'Saving…' : status === 'done' ? '✓ Saved' : 'Save'}
      </button>

      {status === 'error' && (
        <div style={{ fontSize: 11, color: 'var(--error)' }}>{errorMsg}</div>
      )}
    </div>
  )
}
