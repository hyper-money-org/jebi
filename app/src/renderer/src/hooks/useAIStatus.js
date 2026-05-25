import { useState, useEffect } from 'react'

// Module-level singleton — shared across all terminal tabs
const listeners = new Set()
let currentStatus = { status: 'unknown', provider: '' }

export function notifyAIStatus(statusPayload) {
  currentStatus = statusPayload
  listeners.forEach(cb => cb(statusPayload))
}

export function useAIStatus() {
  const [aiStatus, setAiStatus] = useState(currentStatus)
  useEffect(() => {
    const handler = (s) => setAiStatus(s)
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])
  return aiStatus
}
