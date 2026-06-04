import { useState, useEffect, useCallback } from 'react'
import { usePreferences } from '../../hooks/usePreferences'
import { ToggleRow } from './Toggle'
import ModelCard from './ModelCard'

export default function AISection() {
  const { prefs, setAiExplainErrors, setAiDirectoryContext, setAiCommandSuggestions } = usePreferences()
  const [models, setModels] = useState([])
  const [downloadProgress, setDownloadProgress] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.electron.ai.getConfig().then(cfg => {
      const activeModelPath = cfg?.provider !== 'ollama' ? (cfg?.model ?? null) : null
      return window.electron.ai.listModels(activeModelPath)
    }).then(setModels).catch(console.error)
  }, [])

  useEffect(() => {
    const unsubProgress = window.electron.ai.onProgress(({ modelId, bytesReceived, totalBytes, speedBps }) => {
      setDownloadProgress(prev => ({ ...prev, [modelId]: { bytesReceived, totalBytes, speedBps } }))
    })
    const unsubComplete = window.electron.ai.onComplete(({ modelId, path }) => {
      setDownloadProgress(prev => { const n = { ...prev }; delete n[modelId]; return n })
      setModels(prev => prev.map(m => m.id === modelId ? { ...m, downloaded: true, path } : m))
    })
    const unsubError = window.electron.ai.onError(({ modelId }) => {
      setDownloadProgress(prev => { const n = { ...prev }; delete n[modelId]; return n })
    })
    return () => { unsubProgress(); unsubComplete(); unsubError() }
  }, [])

  const handleDownload = useCallback((modelId) => {
    window.electron.ai.startDownload(modelId)
  }, [])

  const handleCancel = useCallback((modelId) => {
    window.electron.ai.cancelDownload(modelId)
    setDownloadProgress(prev => { const n = { ...prev }; delete n[modelId]; return n })
  }, [])

  const handleActivate = useCallback(async (model) => {
    setSaving(true)
    await window.electron.ai.saveConfig({
      provider: 'llama-server', model: model.path,
      endpointURL: 'http://localhost:11434', enabled: true,
    })
    setModels(prev => prev.map(m => ({ ...m, active: m.id === model.id })))
    setSaving(false)
  }, [])

  const sectionLabel = {
    fontSize: 'var(--font-size-ui)',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 8,
    fontFamily: 'var(--font-ui)',
  }

  return (
    <div>
      <div style={{ ...sectionLabel }}>Models</div>
      {models.length === 0 && (
        <div style={{ fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', padding: '8px 0' }}>
          Loading…
        </div>
      )}
      {models.map(model => (
        <ModelCard
          key={model.id}
          model={model}
          isActive={!!model.active}
          onActivate={() => handleActivate(model)}
          onDownload={() => handleDownload(model.id)}
          onCancel={() => handleCancel(model.id)}
          downloadProgress={downloadProgress[model.id] ?? null}
        />
      ))}
      {saving && (
        <div style={{ fontSize: 'var(--font-size-ui)', color: 'var(--text-muted)', marginTop: 8 }}>
          Applying… reconnecting shortly
        </div>
      )}

      <div style={{ ...sectionLabel, marginTop: 20 }}>Features</div>
      <ToggleRow
        label="Command suggestions"
        description="Show AI-suggested next commands after each run."
        checked={prefs.aiCommandSuggestions ?? true}
        onChange={setAiCommandSuggestions}
      />
      <ToggleRow
        label="Explain command errors"
        description="Show an AI explanation banner when a command exits with an error."
        checked={prefs.aiExplainErrors}
        onChange={setAiExplainErrors}
      />
      <ToggleRow
        label="Directory context"
        description="Show an AI summary when switching into a new directory."
        checked={prefs.aiDirectoryContext}
        onChange={setAiDirectoryContext}
      />
    </div>
  )
}
