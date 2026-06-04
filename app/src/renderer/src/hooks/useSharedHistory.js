import { useRef } from 'react'

const HISTORY_KEY = 'term-history'
const MAX_HISTORY = 1000

// Each entry: { c: command, ok: bool }
// Migrates legacy plain-string entries on load.
let sharedHistory = (() => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored).map((e) =>
      typeof e === 'string' ? { c: e, ok: true } : e
    )
  } catch {
    return []
  }
})()

const channel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('term-history')
  : null

if (channel) {
  channel.onmessage = (e) => {
    if (e.data?.type === 'push') sharedHistory = e.data.history
  }
}

function persistAndBroadcast(next) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  channel?.postMessage({ type: 'push', history: next })
}

// Push every completed command regardless of exit code.
// Deduplicates consecutive identical commands.
function push(command, exitCode) {
  const trimmed = command.trim()
  if (!trimmed) return
  const ok = exitCode === 0
  const last = sharedHistory[sharedHistory.length - 1]
  if (last && last.c === trimmed) return
  const next = [...sharedHistory, { c: trimmed, ok }].slice(-MAX_HISTORY)
  sharedHistory = next
  persistAndBroadcast(next)
}

function getAll() {
  return sharedHistory
}

export function useSharedHistory() {
  const indexRef = useRef(-1)
  const draftRef = useRef('')
  const prefixRef = useRef('')

  function resetNavigation() {
    indexRef.current = -1
    draftRef.current = ''
    prefixRef.current = ''
  }

  function isNavigating() {
    return indexRef.current !== -1
  }

  function navigate(direction, currentValue) {
    const history = sharedHistory
    const index = indexRef.current

    if (direction === 'up') {
      if (history.length === 0) return null
      // If in navigation mode but user manually edited the input, start fresh.
      if (index !== -1 && currentValue !== (history[index]?.c ?? '')) {
        indexRef.current = -1
      }
      if (indexRef.current === -1) {
        draftRef.current = currentValue
        prefixRef.current = currentValue.trim()
      }
      const prefix = prefixRef.current
      const start = indexRef.current === -1 ? history.length - 1 : indexRef.current - 1
      if (prefix) {
        for (let i = start; i >= 0; i--) {
          if (history[i].c.startsWith(prefix)) {
            indexRef.current = i
            return history[i].c
          }
        }
        return null
      }
      if (indexRef.current === -1) indexRef.current = history.length - 1
      else if (indexRef.current > 0) indexRef.current = indexRef.current - 1
      return history[indexRef.current].c
    }

    if (direction === 'down') {
      if (index === -1) return null
      const prefix = prefixRef.current
      if (prefix) {
        for (let i = index + 1; i < history.length; i++) {
          if (history[i].c.startsWith(prefix)) {
            indexRef.current = i
            return history[i].c
          }
        }
        indexRef.current = -1
        return draftRef.current
      }
      if (index < history.length - 1) {
        indexRef.current = index + 1
        return history[indexRef.current].c
      }
      indexRef.current = -1
      return draftRef.current
    }

    return null
  }

  return { push, navigate, getAll, isNavigating, resetNavigation }
}
