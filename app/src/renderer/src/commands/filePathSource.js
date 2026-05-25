// CodeMirror 6 CompletionSource factory for file/folder path autosuggest.
//
// Each option carries an `iconUrl` field (resolved per-entry from the icon
// loader). The autocompletion `addToOptions` render hook in useShellEditor.js
// reads it and emits a 14×14 <img> next to each label.
//
// Triggered explicitly from the InputBar Tab keymap (see useShellEditor.js)
// — never opens spontaneously while the user is typing. That's the gate
// that protects Up/Down history navigation from being hijacked by a popup
// that opened on its own.
//
// Token resolution:
//   `cat <Tab>`           → empty token, list cwd
//   `cat src/<Tab>`       → list cwd/src
//   `cat src/co<Tab>`     → list cwd/src filtered by 'co'
//   `cat /etc/<Tab>`      → list /etc (absolute)
//   `cat ~/Doc<Tab>`      → list ~/, filtered by 'Doc'
import { getFileIconUrl, getFolderIconUrl } from '../assets/file-icons/fileIcons'

// Walks back from cursor to find the start of the current whitespace-
// delimited token, then splits it at the last '/' into parent + basename.
export function parseTokenAtCursor(state, head) {
  const before = state.sliceDoc(0, head)
  const match = before.match(/\S*$/)
  const tokenStart = head - (match ? match[0].length : 0)
  const token = before.slice(tokenStart)

  const lastSlash = token.lastIndexOf('/')
  if (lastSlash === -1) {
    return { tokenStart, parentDirPath: '', basenamePrefix: token, basenameStart: tokenStart }
  }
  return {
    tokenStart,
    parentDirPath: token.slice(0, lastSlash + 1), // include trailing '/'
    basenamePrefix: token.slice(lastSlash + 1),
    basenameStart: tokenStart + lastSlash + 1,
  }
}

// Resolves a (possibly relative) parent dir against cwd. Returns an
// absolute path or a '~'-prefixed path that the main-process IPC handler
// knows how to expand.
function resolveDir(parentDirPath, cwd) {
  if (!parentDirPath) return cwd || '.'
  if (parentDirPath.startsWith('/') || parentDirPath.startsWith('~')) return parentDirPath
  if (!cwd) return null
  const base = cwd.endsWith('/') ? cwd.slice(0, -1) : cwd
  return `${base}/${parentDirPath}`
}

// Backslash-escape characters that the shell would otherwise interpret.
function shellEscape(name) {
  return name.replace(/([ \t'"\\$`()&;|<>*?#\[\]])/g, '\\$1')
}

export function makeFilePathSource(callbacksRef) {
  return async function filePathSource(context) {
    if (!context.explicit) return null

    const cwd = callbacksRef.current?.cwd
    const head = context.pos

    // Extend `to` past the cursor to cover the full word so accepting a
    // completion replaces it entirely (e.g. cursor mid-"Work" replaces all of "Work").
    const after = context.state.sliceDoc(head, context.state.doc.length)
    const tokenEnd = head + (after.match(/^\S*/)?.[0].length ?? 0)

    const { parentDirPath, basenamePrefix, basenameStart } = parseTokenAtCursor(
      context.state,
      head,
    )

    const dir = resolveDir(parentDirPath, cwd)
    if (!dir) return null

    let entries
    try {
      entries = await window.electron?.listFiles(dir)
    } catch {
      return null
    }
    if (!Array.isArray(entries) || entries.length === 0) return null

    // Hide dotfiles unless the user typed a leading '.'.
    const showHidden = basenamePrefix.startsWith('.')
    let filtered = showHidden ? entries : entries.filter((e) => !e.name.startsWith('.'))

    // Pre-filter by basename prefix (case-insensitive) so the dropdown only
    // shows relevant entries. Without this CM's fuzzy scorer may suppress
    // matches or show unfiltered results when a partial name is typed.
    if (basenamePrefix) {
      const lc = basenamePrefix.toLowerCase()
      filtered = filtered.filter((e) => e.name.toLowerCase().startsWith(lc))
    }

    if (filtered.length === 0) return null

    // Single match: insert directly without showing the dropdown.
    if (filtered.length === 1) {
      const entry = filtered[0]
      const insert = entry.isDir ? `${shellEscape(entry.name)}/` : shellEscape(entry.name)
      context.view.dispatch({
        changes: { from: basenameStart, to: tokenEnd, insert },
        selection: { anchor: basenameStart + insert.length },
      })
      return null
    }

    // Sort: folders first (A–Z), then files (A–Z).
    filtered.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })

    const total = filtered.length
    const folderUrl = getFolderIconUrl()
    const options = filtered.map((entry, idx) => ({
      label: entry.name,
      type: entry.isDir ? 'folder' : 'file',
      iconUrl: entry.isDir ? folderUrl : getFileIconUrl(entry.name),
      boost: total - idx,
      apply: (view, _completion, from, to) => {
        const insert = entry.isDir ? `${shellEscape(entry.name)}/` : shellEscape(entry.name)
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + insert.length },
        })
      },
    }))

    return {
      from: basenameStart,
      to: tokenEnd,
      options,
      validFor: /^[\w.-]*$/,
    }
  }
}
