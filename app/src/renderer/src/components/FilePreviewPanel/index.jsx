import { useState, useEffect, useRef } from 'react'
import { EditorView, lineNumbers, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Prec } from '@codemirror/state'
import { tags as t } from '@lezer/highlight'
import { javascript, json } from '@codemirror/legacy-modes/mode/javascript'
import { python } from '@codemirror/legacy-modes/mode/python'
import { go } from '@codemirror/legacy-modes/mode/go'
import { rust } from '@codemirror/legacy-modes/mode/rust'
import { ruby } from '@codemirror/legacy-modes/mode/ruby'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { css } from '@codemirror/legacy-modes/mode/css'
import { xml } from '@codemirror/legacy-modes/mode/xml'
import { yaml } from '@codemirror/legacy-modes/mode/yaml'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import { sql } from '@codemirror/legacy-modes/mode/sql'
import { dockerFile } from '@codemirror/legacy-modes/mode/dockerfile'
import { java, c, cpp, csharp, kotlin, scala, dart } from '@codemirror/legacy-modes/mode/clike'

const EXT_LANG = {
  js: javascript, jsx: javascript, ts: javascript, tsx: javascript, mjs: javascript, cjs: javascript,
  json: json, jsonc: json,
  py: python, pyw: python,
  go: go,
  rs: rust,
  java: java, c: c, h: c, cpp: cpp, cc: cpp, cxx: cpp, hpp: cpp,
  cs: csharp, kt: kotlin, kts: kotlin, scala: scala, sc: scala, dart: dart,
  rb: ruby,
  sh: shell, bash: shell, zsh: shell, fish: shell,
  css: css, scss: css,
  html: xml, htm: xml, xml: xml, svg: xml,
  yaml: yaml, yml: yaml,
  toml: toml,
  sql: sql,
  dockerfile: dockerFile,
}

function getLanguage(filename) {
  const lower = filename.toLowerCase()
  if (lower === 'dockerfile') return StreamLanguage.define(dockerFile)
  if (lower === 'go.mod' || lower === 'go.sum') return StreamLanguage.define(go)
  const ext = lower.split('.').pop()
  const mode = EXT_LANG[ext]
  return mode ? StreamLanguage.define(mode) : null
}

const style = getComputedStyle(document.documentElement)
const resolvedFontMono = style.getPropertyValue('--font-mono').trim() || "'JetBrains Mono', monospace"
const resolvedFontSizeMono = style.getPropertyValue('--font-size-mono').trim() || '15px'

const theme = EditorView.theme({
  '&': {
    background: 'transparent',
    color: 'var(--text-primary)',
    fontFamily: resolvedFontMono,
    fontSize: resolvedFontSizeMono,
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { overflow: 'visible', lineHeight: '1.3' },
  '.cm-content': { padding: '8px 4px', caretColor: 'var(--accent)' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
  },
  '.cm-activeLine': { background: 'color-mix(in srgb, var(--accent) 5%, transparent)' },
  '.cm-activeLineGutter': { background: 'color-mix(in srgb, var(--accent) 8%, transparent)' },
  '.cm-gutters': {
    background: 'var(--bg-surface)',
    borderRight: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)',
    color: 'var(--text-muted)',
    fontSize: '0.85em',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 6px', minWidth: '36px' },
}, { dark: true })

const highlight = syntaxHighlighting(HighlightStyle.define([
  { tag: t.keyword,                   color: '#c678dd' },
  { tag: t.string,                    color: '#98c379' },
  { tag: t.comment,                   color: '#5c6370', fontStyle: 'italic' },
  { tag: t.number,                    color: '#d19a66' },
  { tag: t.bool,                      color: '#c678dd' },
  { tag: t.null,                      color: '#c678dd' },
  { tag: [t.typeName, t.className],   color: '#e5c07b' },
  { tag: t.function(t.name),          color: '#61afef' },
  { tag: t.definition(t.name),        color: '#61afef' },
  { tag: [t.operator, t.punctuation], color: '#abb2bf' },
  { tag: t.variableName,              color: '#e06c75' },
  { tag: t.propertyName,              color: '#e06c75' },
  { tag: t.tagName,                   color: '#e06c75' },
  { tag: t.attributeName,             color: '#e5c07b' },
  { tag: t.meta,                      color: '#5c6370' },
]))

export default function FilePreviewPanel({ filePath, onClose }) {
  const [fileContent, setFileContent] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [binaryError, setBinaryError] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const editorRef = useRef(null)       // CodeMirror EditorView instance
  const containerRef = useRef(null)    // mount div
  const cbRef = useRef({})

  const fileName = filePath.split('/').pop()
  const dirPath = filePath.slice(0, filePath.length - fileName.length).replace(/\/$/, '')

  cbRef.current.filePath = filePath
  cbRef.current.onClose = onClose
  cbRef.current.saving = saving
  cbRef.current.setSaving = setSaving
  cbRef.current.setSaveError = setSaveError
  cbRef.current.setConfirmClose = setConfirmClose

  const isDirty = () => {
    const view = editorRef.current
    return view ? view.state.doc.toString() !== fileContent : false
  }

  const save = (view) => {
    const cb = cbRef.current
    if (cb.saving) return
    const content = (view ?? editorRef.current).state.doc.toString()
    cb.setSaving(true)
    cb.setSaveError(null)
    window.electron.fs.writeFile(cb.filePath, content).then((result) => {
      cb.setSaving(false)
      if (result.ok) { setFileContent(content); cb.setConfirmClose(false) }
      else cb.setSaveError(result.error)
    })
  }

  // Load file
  useEffect(() => {
    setFileContent(null)
    setSaveError(null)
    setBinaryError(false)
    setConfirmClose(false)
    window.electron.fs.readFile(filePath).then((data) => {
      if (data === null) setBinaryError(true)
      else setFileContent(data)
    })
  }, [filePath])

  // Mount CodeMirror once content is ready
  useEffect(() => {
    if (fileContent === null) return
    const container = containerRef.current
    if (!container) return

    const saveKeymap = Prec.highest(keymap.of([
      {
        key: 'Mod-s',
        run(view) { save(view); return true },
      },
    ]))

    const lang = getLanguage(fileName)
    const view = new EditorView({
      state: EditorState.create({
        doc: fileContent,
        extensions: [
          ...(lang ? [lang] : []),
          highlight,
          theme,
          lineNumbers(),
          history(),
          EditorView.lineWrapping,
          keymap.of([...historyKeymap, ...defaultKeymap]),
          saveKeymap,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) cbRef.current.setConfirmClose(false)
          }),
        ],
      }),
      parent: container,
    })

    editorRef.current = view
    view.focus()
    return () => { view.destroy(); editorRef.current = null }
  }, [fileContent, fileName])

  // Esc handler
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (isDirty()) { setConfirmClose(true); return }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [fileContent, onClose])

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      maxHeight: '80%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
      boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
      zIndex: 60,
    }}>
      {/* Header */}
      <div style={{
        padding: '5px 12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
        borderBottom: '1px solid color-mix(in srgb, var(--text-primary) 10%, transparent)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
          {fileName}
        </span>
        {dirPath && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {dirPath}
          </span>
        )}
        {saving && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>saving…</span>}
        {saveError && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f87171', flexShrink: 0 }}>{saveError}</span>}
      </div>

      {/* Confirm close banner */}
      {confirmClose && (
        <div style={{
          padding: '8px 14px', flexShrink: 0,
          background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          display: 'flex', alignItems: 'center', gap: 12,
          fontFamily: 'var(--font-mono)', fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-primary)', flex: 1 }}>Unsaved changes</span>
          <button onClick={() => save()} style={{ padding: '3px 12px', borderRadius: 4, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>
            Save ⌘S
          </button>
          <button onClick={onClose} style={{ padding: '3px 12px', borderRadius: 4, border: '1px solid var(--text-muted)', background: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>
            Discard
          </button>
        </div>
      )}

      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {fileContent === null && !binaryError && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>
        )}
        {binaryError && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Cannot preview — binary file or exceeds 5 MB.
          </div>
        )}
        <div
          ref={containerRef}
          style={{ display: fileContent !== null && !binaryError ? 'block' : 'none' }}
        />
      </div>

      {/* Footer */}
      {!binaryError && (
        <div style={{
          padding: '3px 12px', flexShrink: 0,
          borderTop: '1px solid color-mix(in srgb, var(--text-primary) 8%, transparent)',
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
          display: 'flex', gap: 16,
        }}>
          <span>⌘S save</span><span>⌘Z undo</span><span>⌘⇧Z redo</span><span>Esc close</span>
        </div>
      )}
    </div>
  )
}
