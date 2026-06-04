import { useState, useEffect, useRef } from 'react'
import { useAIStatus } from '../../hooks/useAIStatus'

const CONTEXT_WINDOW = 6 // last 6 messages (3 pairs) sent to backend

function ScopeTooltip({ visible }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 6,
      width: 280,
      padding: '8px 10px',
      background: 'var(--bg-surface)',
      border: '1px solid color-mix(in srgb, var(--text-muted) 25%, transparent)',
      borderRadius: 6,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      fontFamily: 'var(--font-mono)',
      fontSize: 'var(--font-size-ui)',
      color: 'var(--text-muted)',
      lineHeight: 1.5,
      zIndex: 100,
      pointerEvents: 'none',
    }}>
      AI answers terminal and shell questions for this session only — current directory, recent
      commands, errors, and dev tool usage. Unrelated questions will be politely declined.
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 14,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--font-size-ui)',
        color: 'var(--text-muted)',
        opacity: 0.7,
        marginBottom: 4,
        paddingLeft: isUser ? 0 : 2,
        paddingRight: isUser ? 2 : 0,
      }}>
        {isUser ? 'You' : 'jebi'}
      </span>
      <div style={{
        maxWidth: '85%',
        padding: '7px 11px',
        borderRadius: isUser ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
        background: isUser
          ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
          : msg.error
            ? 'color-mix(in srgb, #f87171 10%, transparent)'
            : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
        border: isUser
          ? '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
          : msg.error
            ? '1px solid color-mix(in srgb, #f87171 25%, transparent)'
            : '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--font-size-mono)',
        color: msg.error ? '#f87171' : 'var(--text-primary)',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content || (msg.streaming ? '' : '…')}
        {msg.streaming && (
          <span style={{ display: 'inline-block', width: 8, height: 13, background: 'var(--accent)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'ask-cursor-blink 1s step-end infinite' }} />
        )}
      </div>
    </div>
  )
}

export default function AskPanel({ messages, onSend, onClose }) {
  const aiStatus = useAIStatus()
  const aiAvailable = aiStatus.status === 'available'
  const [input, setInput] = useState('')
  const [infoVisible, setInfoVisible] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const inputFocusedRef = useRef(false)

  // Restore focus to textarea after each message update (streaming re-renders steal it).
  useEffect(() => {
    if (inputFocusedRef.current && document.activeElement !== inputRef.current) {
      inputRef.current?.focus()
    }
  }, [messages])

  const isStreaming = messages.some((m) => m.streaming)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !isStreaming) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [isStreaming, onClose])

  const handleSend = () => {
    const q = input.trim()
    if (!q || isStreaming) return
    const completed = messages.filter((m) => !m.streaming && !m.error)
    const history = completed
      .slice(-CONTEXT_WINDOW)
      .map(({ role, content }) => ({ role, content }))
    setInput('')
    onSend(history, q)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <style>{`
        @keyframes ask-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '50%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
        zIndex: 60,
      }}>
        {/* Header */}
        <div style={{
          padding: '6px 12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-mono)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
            Ask AI
          </span>
          <div style={{ position: 'relative' }}>
            <span
              onMouseEnter={() => setInfoVisible(true)}
              onMouseLeave={() => setInfoVisible(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '1px solid var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--font-size-ui)',
                color: 'var(--text-muted)',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              i
            </span>
            <ScopeTooltip visible={infoVisible} />
          </div>
        </div>

        {/* Messages / unavailable state */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px' }}>
          {!aiAvailable ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 8,
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 22 }}>✦</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                No AI model available
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260 }}>
                Download a model in{' '}
                <span style={{ color: 'var(--accent)' }}>Preferences → AI</span>
                {' '}to enable AI features.
              </span>
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--font-size-mono)',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                  Ask about your terminal session, current directory, or shell commands.
                </div>
              )}
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {aiAvailable && (
        <div style={{
          padding: '8px 12px',
          flexShrink: 0,
          borderTop: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { inputFocusedRef.current = true }}
            onBlur={() => { inputFocusedRef.current = false }}
            placeholder="Ask a question… (Enter to send)"
            rows={1}
            disabled={isStreaming}
            style={{
              flex: 1,
              resize: 'none',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-mono)',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              padding: 0,
              overflowY: 'hidden',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              border: 'none',
              background: input.trim() && !isStreaming ? 'var(--accent)' : 'color-mix(in srgb, var(--text-muted) 20%, transparent)',
              color: input.trim() && !isStreaming ? '#fff' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--font-size-ui)',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {isStreaming ? '…' : '↵'}
          </button>
        </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '4px 12px',
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--font-size-ui)',
          opacity: 0.6,
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid color-mix(in srgb, var(--text-muted) 20%, transparent)',
          background: 'color-mix(in srgb, var(--text-muted) 5%, transparent)',
        }}>
          <span>↵ send · Esc close</span>
          <span>AI · may be inaccurate</span>
        </div>
      </div>
    </>
  )
}
