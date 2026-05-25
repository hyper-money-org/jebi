import { useEffect, useRef, useCallback } from 'react'
import * as wire from '../wire'
import { notifyAIStatus } from './useAIStatus'

export function useTerminal(paneId, callbacksRef) {
  const ws = useRef(null)
  const terminalSizeRef = useRef(null)

  useEffect(() => {
    let destroyed = false
    let retryTimer = null

    function connect() {
      const socket = new WebSocket('ws://localhost:7070')
      ws.current = socket
      socket.onopen = () => {
        console.log(`[terminal:${paneId}] connected`)
        // Re-fit once the connection is live. By this point the rAF inside
        // OutputArea has run and the layout is settled, so this sends the
        // correct column count to the PTY before the user types anything.
        callbacksRef.current.triggerFit?.()
      }
      socket.onerror = (e) => console.error(`[terminal:${paneId}] error`, e)
      socket.onclose = () => {
        console.log(`[terminal:${paneId}] disconnected`)
        if (!destroyed) retryTimer = setTimeout(connect, 500)
      }
      socket.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        switch (msg.type) {
          case wire.TypeOutput:
            callbacksRef.current.onOutput?.(msg.data)
            break
          case wire.TypeCwd:
            callbacksRef.current.onCwd?.(msg.data)
            break
          case wire.TypeExitCode:
            callbacksRef.current.onExitCode?.(msg.data)
            break
          case wire.TypeGit: {
            const [branch, dirty, ahead, behind, staged, modified, untracked] = msg.data.split('|')
            callbacksRef.current.onGit?.({
              branch,
              dirty: dirty === '1',
              ahead: parseInt(ahead, 10) || 0,
              behind: parseInt(behind, 10) || 0,
              staged: parseInt(staged, 10) || 0,
              modified: parseInt(modified, 10) || 0,
              untracked: parseInt(untracked, 10) || 0,
            })
            break
          }
          case wire.TypeNode: {
            const [version, packageManager] = msg.data.split('|')
            callbacksRef.current.onNode?.({ version, packageManager })
            break
          }
          case wire.TypeGo: {
            callbacksRef.current.onGo?.({ version: msg.data })
            break
          }
          case wire.TypePython: {
            const [version, venv] = msg.data.split('|')
            callbacksRef.current.onPython?.({ version, venv })
            break
          }
          case wire.TypeDocker: {
            callbacksRef.current.onDocker?.({ kind: msg.data })
            break
          }
          case wire.TypeK8s: {
            const [context, namespace] = msg.data.split('|')
            callbacksRef.current.onK8s?.({ context, namespace })
            break
          }
          case wire.TypeRust:
            callbacksRef.current.onRust?.({ version: msg.data })
            break
          case wire.TypePhp:
            callbacksRef.current.onPhp?.({ version: msg.data })
            break
          case wire.TypeJava:
            callbacksRef.current.onJava?.({ version: msg.data })
            break
          case wire.TypeKotlin:
            callbacksRef.current.onKotlin?.({ version: msg.data })
            break
          case wire.TypeHaskell:
            callbacksRef.current.onHaskell?.({ version: msg.data })
            break
          case wire.TypeC:
            callbacksRef.current.onC?.({ version: msg.data })
            break
          case wire.TypeConda:
            callbacksRef.current.onConda?.({ env: msg.data })
            break
          case wire.TypeAISuggestion:
            callbacksRef.current.onAISuggestion?.(msg.data)
            break
          case wire.TypeAISuggestError:
            callbacksRef.current.onAISuggestError?.()
            break
          case wire.TypeAIExplanation:
            callbacksRef.current.onAIBannerStart?.('error')
            callbacksRef.current.onAIBannerToken?.(msg.data)
            break
          case wire.TypeAIBannerStart:
            callbacksRef.current.onAIBannerStart?.(msg.data?.type ?? 'error')
            break
          case wire.TypeAIBannerToken:
            callbacksRef.current.onAIBannerToken?.(msg.data)
            break
          case wire.TypeAIBannerCancel:
            callbacksRef.current.onAIBannerCancel?.()
            break
          case wire.TypeAIStatus:
            notifyAIStatus(msg.data)
            break
        }
      }
    }

    connect()

    return () => {
      destroyed = true
      clearTimeout(retryTimer)
      ws.current?.close()
    }
  }, [paneId])

  const sendInput = useCallback((text) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return
    if (terminalSizeRef.current) {
      ws.current.send(JSON.stringify({ type: wire.TypeResize, data: terminalSizeRef.current }))
    }
    const displayText = text.split('\n').map(line => line.trim()).filter(Boolean).join(' ⏎ ')
    try { callbacksRef.current.onCommandStart?.(displayText || text) } catch (e) { console.error(e) }
    ws.current.send(JSON.stringify({ type: wire.TypeInput, data: text + '\n' }))
  }, [paneId])

  const sendRaw = useCallback((data) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return
    ws.current.send(JSON.stringify({ type: wire.TypeInput, data }))
  }, [paneId])

  const sendResize = useCallback((cols, rows) => {
    if (rows > 2) terminalSizeRef.current = { cols, rows }
    if (ws.current?.readyState !== WebSocket.OPEN) return
    if (rows <= 2) return
    ws.current.send(JSON.stringify({ type: wire.TypeResize, data: { cols, rows } }))
  }, [paneId])

  const sendAIAppend = useCallback((entry) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return
    ws.current.send(JSON.stringify({ type: wire.TypeAIAppend, data: entry }))
  }, [paneId])

  return { sendInput, sendRaw, sendResize, sendAIAppend }
}
