import { useEffect, useRef, useState } from 'react'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { json } from '@codemirror/legacy-modes/mode/javascript'
import { tags as t } from '@lezer/highlight'
import { setUserCommands } from '../../commands/registry'
import { showStatusMessage } from '../../hooks/useStatusMessage'

const PLACEHOLDER = `[
  {
    "id": "deploy",
    "title": "Deploy",
    "description": "Deploy to production",
    "command": "npm run deploy"
  }
]`

const BUILTIN_IDS = new Set([
  'ask', 'run', 'history', 'ls', 'ports', 'clear',
  'copy-output', 'split-right', 'split-down', 'close-pane', 'new-tab', 'toggle-tabs',
])

function validate(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { errors: [`Invalid JSON — ${e.message}`], parsed: null }
  }

  if (!Array.isArray(parsed)) {
    return { errors: ['Root value must be a JSON array [ … ]'], parsed: null }
  }

  const errors = []
  const seenIds = new Set()

  parsed.forEach((cmd, i) => {
    const at = `[${i}]${cmd?.id ? ` "${cmd.id}"` : ''}`

    if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd)) {
      errors.push(`${at}: each entry must be an object`)
      return
    }

    // id
    if (!cmd.id || typeof cmd.id !== 'string' || !cmd.id.trim()) {
      errors.push(`${at}: "id" is required and must be a non-empty string`)
    } else {
      if (BUILTIN_IDS.has(cmd.id))
        errors.push(`${at}: id "${cmd.id}" conflicts with a built-in command`)
      if (seenIds.has(cmd.id))
        errors.push(`${at}: duplicate id "${cmd.id}"`)
      seenIds.add(cmd.id)
    }

    // exactly one action key
    const hasCommand   = 'command'   in cmd
    const hasItems     = 'items'     in cmd
    const hasItemsFrom = 'itemsFrom' in cmd
    const actionCount  = [hasCommand, hasItems, hasItemsFrom].filter(Boolean).length

    if (actionCount === 0) {
      errors.push(`${at}: must include one of "command" (string), "items" (static list), or "itemsFrom" (dynamic list from shell)`)
    } else if (actionCount > 1) {
      errors.push(`${at}: only one of "command", "items", or "itemsFrom" is allowed — not multiple`)
    } else {
      if (hasCommand) {
        if (typeof cmd.command !== 'string' || !cmd.command.trim())
          errors.push(`${at}: "command" must be a non-empty string`)
      }

      if (hasItems) {
        if (!Array.isArray(cmd.items) || cmd.items.length === 0) {
          errors.push(`${at}: "items" must be a non-empty array (static list mode requires at least one item)`)
        } else {
          cmd.items.forEach((item, j) => {
            if (!item?.label || typeof item.label !== 'string')
              errors.push(`${at} items[${j}]: "label" is required`)
            if (!item?.command || typeof item.command !== 'string')
              errors.push(`${at} items[${j}]: "command" is required`)
          })
        }
        if ('onSelect' in cmd)
          errors.push(`${at}: "onSelect" is not used with static "items" — it only applies to "itemsFrom"`)
      }

      if (hasItemsFrom) {
        if (typeof cmd.itemsFrom !== 'string' || !cmd.itemsFrom.trim())
          errors.push(`${at}: "itemsFrom" must be a non-empty shell command string`)
        if ('onSelect' in cmd && typeof cmd.onSelect !== 'string')
          errors.push(`${at}: "onSelect" must be a string template, e.g. "git checkout {label}"`)
      }
    }

    // onSelect without itemsFrom
    if ('onSelect' in cmd && !hasItemsFrom)
      errors.push(`${at}: "onSelect" only makes sense with "itemsFrom"`)

    // optional string fields
    ;['title', 'description', 'section'].forEach(k => {
      if (k in cmd && typeof cmd[k] !== 'string')
        errors.push(`${at}: "${k}" must be a string`)
    })
  })

  return { errors, parsed: errors.length === 0 ? parsed : null }
}

// Minimal CodeMirror theme matching the app palette
const editorTheme = EditorView.theme({
  '&': {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--font-size-ui)',
    borderRadius: '5px',
    border: '1px solid var(--border)',
  },
  '&.cm-focused': { outline: 'none', border: '1px solid var(--accent)' },
  '.cm-scroller': { overflow: 'auto !important', lineHeight: '1.6', maxHeight: '260px' },
  '.cm-placeholder': { color: 'var(--text-muted)', opacity: 0.4, fontStyle: 'italic' },
  '.cm-content': { padding: '10px 4px', caretColor: 'var(--accent)' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '1px', maxHeight: '1.2em' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
  },
  '.cm-activeLine': { background: 'color-mix(in srgb, var(--accent) 5%, transparent)' },
}, { dark: true })

const highlight = syntaxHighlighting(HighlightStyle.define([
  { tag: t.string,                    color: '#98c379' },
  { tag: t.number,                    color: '#d19a66' },
  { tag: t.bool,                      color: '#c678dd' },
  { tag: t.null,                      color: '#c678dd' },
  { tag: [t.operator, t.punctuation], color: '#abb2bf' },
  { tag: t.propertyName,              color: '#e06c75' },
]))

export default function CustomCommandsEditor() {
  const containerRef = useRef(null)
  const editorRef    = useRef(null)
  const [errors, setErrors] = useState([])
  const [status, setStatus] = useState(null) // 'saving' | 'saved' | 'error'
  const [loaded, setLoaded] = useState(false)

  // Load saved commands on mount
  useEffect(() => {
    window.electron?.commands?.load().then(cmds => {
      const text = Array.isArray(cmds) && cmds.length > 0
        ? JSON.stringify(cmds, null, 2)
        : ''
      initEditor(text)
      setLoaded(true)
    }).catch(() => {
      initEditor('')
      setLoaded(true)
    })
  }, [])

  function initEditor(text) {
    if (editorRef.current) editorRef.current.destroy()
    const state = EditorState.create({
      doc: text,
      extensions: [
        StreamLanguage.define(json),
        editorTheme,
        highlight,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        placeholder(PLACEHOLDER),
      ],
    })
    editorRef.current = new EditorView({ state, parent: containerRef.current })
  }

  function handleSave() {
    const raw = editorRef.current?.state.doc.toString() ?? ''
    const { errors: errs, parsed } = validate(raw)
    setErrors(errs)
    if (errs.length > 0) { setStatus('error'); return }

    setStatus('saving')
    window.electron.commands.save(parsed).then(() => {
      setUserCommands(parsed)
      setStatus('saved')
      setTimeout(() => setStatus(null), 2500)
      showStatusMessage('Commands saved')
    }).catch(() => {
      setErrors(['Failed to save — check file permissions for ~/.config/jebi/commands.json'])
      setStatus('error')
    })
  }

  const label = {
    fontSize: 'var(--font-size-ui)', fontWeight: 600, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: 'var(--text-muted)',
    fontFamily: 'var(--font-ui)', marginBottom: 8,
  }

  return (
    <div>
      <div style={label}>Custom Slash Commands</div>

      {/* Description */}
      <div style={{
        fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', lineHeight: 1.6,
        fontFamily: 'var(--font-ui)', marginBottom: 14,
      }}>
        Define your own <code style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3 }}>/commands</code> that appear in the command palette.
        Each command runs a shell command, shows a static pick-list, or populates a list dynamically from a shell command.
        Commands are saved to <code style={{ color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '1px 5px', borderRadius: 3 }}>~/.config/jebi/commands.json</code> and take effect immediately.
      </div>

      {/* Schema quick-reference */}
      <div style={{
        fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', lineHeight: 1.5,
        fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)',
        border: '1px solid var(--border)', borderRadius: 5,
        padding: '10px 14px', marginBottom: 12,
      }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
          Schema — each entry needs an <Field>id</Field> and exactly one action:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 46px 1fr', gap: '4px 8px', paddingLeft: 12, marginTop: 6 }}>
          <span><Field>command</Field></span>     <Dim>string</Dim> <span style={{ opacity: 0.65 }}>run a shell command directly</span>
          <span><Field>title</Field></span>       <Dim>string</Dim> <span style={{ opacity: 0.65 }}>optional display name</span>
          <span><Field>description</Field></span> <Dim>string</Dim> <span style={{ opacity: 0.65 }}>optional subtitle shown in the palette</span>
          <span><Field>section</Field></span>     <Dim>string</Dim> <span style={{ opacity: 0.65 }}>optional group heading (default: "Custom")</span>
          <span><Field>items</Field></span>       <Dim>array</Dim>  <span style={{ opacity: 0.65 }}>static list of <Field>label</Field> + <Field>command</Field> pairs</span>
          <span><Field>itemsFrom</Field></span>   <Dim>string</Dim> <span style={{ opacity: 0.65 }}>shell command that populates the list; use <Field>onSelect</Field> <Dim>"{'{label}'}"</Dim></span>
        </div>
      </div>

      {/* Editor */}
      <div ref={containerRef} style={{ marginBottom: 10 }} />

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{
          marginBottom: 10, padding: '8px 12px', borderRadius: 5,
          background: 'color-mix(in srgb, #f85149 10%, transparent)',
          border: '1px solid color-mix(in srgb, #f85149 30%, transparent)',
        }}>
          {errors.map((e, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#f85149', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
              {e}
            </div>
          ))}
        </div>
      )}

      {/* Save row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={!loaded || status === 'saving'}
          style={{
            padding: '6px 18px', borderRadius: 5, border: 'none',
            background: 'var(--accent)', color: 'var(--on-accent)',
            cursor: (!loaded || status === 'saving') ? 'default' : 'pointer',
            opacity: (!loaded || status === 'saving') ? 0.7 : 1,
            fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-ui)',
          }}
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && (
          <span style={{ fontSize: '12px', color: '#22c55e', fontFamily: 'var(--font-ui)' }}>
            Saved — commands updated
          </span>
        )}
      </div>
    </div>
  )
}

function Field({ children }) {
  return <span style={{ color: '#e06c75' }}>{children}</span>
}

function Dim({ children }) {
  return <span style={{ opacity: 0.55 }}>{children}</span>
}
