import { useState, useEffect } from 'react'

let current = null
let timer = null
const listeners = new Set()

export function showStatusMessage(text, durationMs = 2500) {
  if (timer) clearTimeout(timer)
  current = text
  listeners.forEach(fn => fn(text))
  timer = setTimeout(() => {
    current = null
    listeners.forEach(fn => fn(null))
    timer = null
  }, durationMs)
}

export function useStatusMessage() {
  const [msg, setMsg] = useState(current)
  useEffect(() => {
    listeners.add(setMsg)
    return () => listeners.delete(setMsg)
  }, [])
  return msg
}
