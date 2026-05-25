import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let _counter = 0
function nextId() {
  return `toast-${++_counter}-${Date.now()}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  // Track timers so we can clear them on dismiss/replace
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((opts) => {
    const id = opts.id ?? nextId()
    const toast = {
      type: 'info',
      duration: 5000,
      ...opts,
      id,
    }

    // Cancel any existing auto-dismiss timer for this id
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }

    setToasts(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx !== -1) {
        // Replace existing toast (idempotent show with same id)
        const next = [...prev]
        next[idx] = toast
        return next
      }
      return [...prev, toast]
    })

    if (toast.duration > 0) {
      timers.current[id] = setTimeout(() => {
        dismiss(id)
      }, toast.duration)
    }

    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return { show: ctx.show, dismiss: ctx.dismiss }
}

// Internal hook used by ToastManager to read the toast list
export function useToastList() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastList must be used within a ToastProvider')
  return { toasts: ctx.toasts, dismiss: ctx.dismiss }
}
