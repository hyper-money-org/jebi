import { useState, useEffect, useCallback } from 'react'
import { usePreferences } from '../../hooks/usePreferences'
import { ToggleRow } from './Toggle'
import ModelCard from './ModelCard'


export default function AISection() {
  const { prefs, setAiExplainErrors, setAiDirectoryContext, setAiCommandSuggestions } = usePreferences()
  const [runtimeTab, setRuntimeTab] = useState('builtin')
  const [aiConfig, setAiConfig] = useState(null)
  const [models, setModels] = useState([])
  const [downloadProgress, setDownloadProgress] = useState({})
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState('')
  const [ollamaStatus, setOllamaStatus] = useState('unknown')
  const [saving, setSaving] = useState(false)

  // Load config + models on mount
  useEffect(() => {
    window.electron.ai.getConfig().then(cfg => {
      if (cfg) {
        setAiConfig(cfg)
        setRuntimeTab(cfg.provider === 'ollama' ? 'ollama' : 'builtin')
        setOllamaEndpoint(cfg.endpointURL || 'http://localhost:11434')
        setOllamaModel(cfg.model || '')
      }
      const activeModelPath = (cfg?.provider !== 'ollama') ? (cfg?.model ?? null) : null
      return window.electron.ai.listModels(activeModelPath)
    }).then(setModels).catch(console.error)
  }, [])

  // Check Ollama connectivity
  useEffect(() => {
    if (runtimeTab !== 'ollama') return
    setOllamaStatus('unknown')
    fetch(`${ollamaEndpoint}/api/tags`)
      .then(r => setOllamaStatus(r.ok ? 'connected' : 'disconnected'))
      .catch(() => setOllamaStatus('disconnected'))
  }, [runtimeTab, ollamaEndpoint])

  // Subscribe to download events
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
      endpointURL: 'http://localhost:11434', enabled: true
    })
    setModels(prev => prev.map(m => ({ ...m, active: m.id === model.id })))
    setSaving(false)
  }, [])

  const handleSaveOllama = useCallback(async () => {
    setSaving(true)
    await window.electron.ai.saveConfig({
      provider: 'ollama', model: ollamaModel,
      endpointURL: ollamaEndpoint, enabled: true
    })
    setSaving(false)
  }, [ollamaEndpoint, ollamaModel])

  const sectionLabel = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    fontFamily: 'var(--font-ui)',
  }

  return (
    <div>
      {/* Runtime selector */}
      <div style={{ ...sectionLabel }}>Runtime</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['builtin', 'Built-in (llama.cpp)'], ['ollama', 'Ollama']].map(([id, label]) => (
          <button key={id} onClick={() => setRuntimeTab(id)} style={{
            padding: '5px 14px', borderRadius: 6,
            border: `1px solid ${runtimeTab === id ? 'var(--accent)' : 'var(--border)'}`,
            background: runtimeTab === id ? 'var(--accent)' : 'transparent',
            color: runtimeTab === id ? 'var(--on-accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Built-in tab */}
      {runtimeTab === 'builtin' && (
        <div>
          <div style={{ ...sectionLabel }}>Models</div>
          {models.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
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
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 8 }}>
              Applying… reconnecting shortly
            </div>
          )}
        </div>
      )}

      {/* Ollama tab */}
      {runtimeTab === 'ollama' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
              background: ollamaStatus === 'connected' ? '#22c55e' : ollamaStatus === 'disconnected' ? 'var(--error)' : 'var(--border)',
            }} />
            {ollamaStatus === 'connected' ? 'Connected' : ollamaStatus === 'disconnected' ? 'Not running' : 'Checking…'}
          </div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
            Endpoint
          </label>
          <input
            value={ollamaEndpoint}
            onChange={e => setOllamaEndpoint(e.target.value)}
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
              fontSize: '12px', marginBottom: 10, boxSizing: 'border-box',
            }}
          />
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4 }}>
            Model
          </label>
          <input
            value={ollamaModel}
            onChange={e => setOllamaModel(e.target.value)}
            placeholder="e.g. qwen2.5:1.5b"
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
              fontSize: '12px', marginBottom: 12, boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSaveOllama}
            disabled={saving}
            style={{
              padding: '6px 16px', borderRadius: 5, border: 'none',
              background: 'var(--accent)', color: 'var(--on-accent)',
              cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
              fontFamily: 'var(--font-mono)', fontSize: '12px',
            }}
          >
            {saving ? 'Saving…' : 'Save & Apply'}
          </button>
        </div>
      )}

      {/* Features toggles */}
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
