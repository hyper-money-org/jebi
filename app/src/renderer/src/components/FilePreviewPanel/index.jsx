import { useState, useEffect, useRef } from 'react'
import { EditorView, lineNumbers, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Prec } from '@codemirror/state'
import { tags as t } from '@lezer/highlight'
import { javascript } from '@codemirror/legacy-modes/mode/javascript'
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

const EXT_LANG = {
  js: javascript, jsx: javascript, ts: javascript, tsx: javascript, mjs: javascript, cjs: javascript,
  py: python, pyw: python,
  go: go,
  rs: rust,
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
  if (lower === 'dockerfile') return StreamLanguage.define(dockerfile)
  const ext = lower.split('.').pop()
  const mode = EXT_LANG[ext]
  return mode ? StreamLanguage.define(mode) : null
}

function buildTheme(cssVar) {
  return EditorView.theme({
    '&': {
      height: '100%',
      background: 'transparent',
      color: cssVar('--text-primary'),
      fontFamily: cssVar('--font-mono'),
      fontSize: cssVar('--font-size-mono'),
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': { overflow: 'auto', lineHeight: '1.6' },
    '.cm-content': {
      padding: '8px 4px',
      caretColor: cssVar('--accent'),
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: cssVar('--accent'),
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
      background: cssVar('--accent') + '33',
    },
    '.cm-activeLine': {
      background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
    },
    '.cm-activeLineGutter': {
      background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
    },
    '.cm-gutters': {
      background: 'var(--bg-surface)',
      borderRight: '1px solid color-mix(in srgb, var(--text-muted) 15%, transparent)',
      color: cssVar('--text-muted'),
      fontSize: '0.85em',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 10px 0 6px',
      minWidth: '36px',
    },
    '.cm-foldGutter': { display: 'none' },
  }, { dark: true })
}

function buildHighlightStyle(cssVar) {
  return syntaxHighlighting(HighlightStyle.define([
    { tag: t.keyword,                   color: cssVar('--accent') },
    { tag: t.string,                    color: '#98c379' },
    { tag: t.comment,                   color: cssVar('--text-muted'), fontStyle: 'italic' },
    { tag: t.number,                    color: '#d19a66' },
    { tag: t.bool,                      color: cssVar('--accent') },
    { tag: t.null,                      color: cssVar('--accent') },
    { tag: [t.typeName, t.className],   color: '#e5c07b' },
    { tag: t.function(t.name),          color: '#61afef' },
    { tag: t.definition(t.name),        color: '#61afef' },
    { tag: [t.operator, t.punctuation], color: cssVar('--text-secondary') },
    { tag: t.variableName,              color: '#e06c75' },
    { tag: t.propertyName,              color: '#e06c75' },
    { tag: t.tagName,                   color: cssVar('--accent') },
    { tag: t.attributeName,             color: '#e5c07b' },
    { tag: t.meta,                      color: cssVar('--text-muted') },
    { tag: t.atom,                      color: cssVar('--text-secondary') },
  ]))
}

export default function FilePreviewPanel({ filePath, onClose }) {
  const [fileContent, setFileContent] = useState(null) // null = loading
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [discardWarning, setDiscardWarning] = useState(false)
  const [binaryError, setBinaryError] = useState(false)
  const editorContainerRef = useRef(null)
  const callbacksRef = useRef({})

  const fileName = filePath.split('/').pop()
  const dirPath = filePath.slice(0, filePath.length - fileName.length).replace(/\/$/, '')

  // Keep callbacks ref in sync so keymap closures always see latest state
  callbacksRef.current.dirty = dirty
  callbacksRef.current.discardWarning = discardWarning
  callbacksRef.current.setDirty = setDirty
  callbacksRef.current.setDiscardWarning = setDiscardWarning
  callbacksRef.current.setSaving = setSaving
  callbacksRef.current.setSaveError = setSaveError
  callbacksRef.current.filePath = filePath
  callbacksRef.current.onClose = onClose

  // Load file content
  useEffect(() => {
    setFileContent(null)
    setDirty(false)
    setSaveError(null)
    setDiscardWarning(false)
    setBinaryError(false)
    window.electron.fs.readFile(filePath).then((data) => {
      if (data === null) setBinaryError(true)
      else setFileContent(data)
    })
  }, [filePath])

  // Mount CodeMirror once content is ready
  useEffect(() => {
    if (fileContent === null) return
    const container = editorContainerRef.current
    if (!container) return

    const style = getComputedStyle(document.documentElement)
    const cssVar = (name) => style.getPropertyValue(name).trim()

    const saveKeymap = Prec.highest(keymap.of([
      {
        key: 'Mod-s',
        run(view) {
          const cb = callbacksRef.current
          if (cb.saving) return true
          const content = view.state.doc.toString()
          cb.setSaving(true)
          cb.setSaveError(null)
          window.electron.fs.writeFile(cb.filePath, content).then((result) => {
            cb.setSaving(false)
            if (result.ok) {
              cb.setDirty(false)
              cb.setDiscardWarning(false)
            } else {
              cb.setSaveError(result.error)
            }
          })
          return true
        },
      },
      {
        key: 'Escape',
        run() {
          const cb = callbacksRef.current
          if (cb.dirty && !cb.discardWarning) {
            cb.setDiscardWarning(true)
            return true
          }
          cb.onClose()
          return true
        },
      },
    ]))

    const lang = getLanguage(fileName)

    const view = new EditorView({
      state: EditorState.create({
        doc: fileContent,
        extensions: [
          ...(lang ? [lang] : []),
          buildHighlightStyle(cssVar),
          buildTheme(cssVar),
          lineNumbers(),
          history(),
          EditorView.lineWrapping,
          keymap.of([...historyKeymap, ...defaultKeymap]),
          saveKeymap,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              callbacksRef.current.setDirty(true)
              callbacksRef.current.setDiscardWarning(false)
              callbacksRef.current.setSaveError(null)
            }
          }),
        ],
      }),
      parent: container,
    })

    view.focus()

    return () => view.destroy()
  }, [fileContent, fileName])

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
        minWidth: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          {dirty && <span style={{ color: 'var(--accent)', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>●</span>}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 0,
          }}>
            {fileName}
          </span>
          {dirPath && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {dirPath}
            </span>
          )}
          {saving && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>saving…</span>
          )}
          {saveError && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f87171', flexShrink: 0 }}>{saveError}</span>
          )}
          {discardWarning && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fb923c', flexShrink: 0 }}>
              unsaved changes — ⌘S to save, Esc again to discard
            </span>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {fileContent === null && !binaryError && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        )}
        {binaryError && (
          <div style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Cannot preview — binary file or exceeds 512 KB. Open in an external editor instead.
          </div>
        )}
        <div
          ref={editorContainerRef}
          style={{ height: '100%', display: fileContent !== null && !binaryError ? 'block' : 'none' }}
        />
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
          <span>⌘⇧Z redo</span>
          <span>⌘X cut</span>
          <span>⌘C copy</span>
          <span>⌘V paste</span>
          <span>Esc close</span>
        </div>
      )}
    </div>
  )
}
