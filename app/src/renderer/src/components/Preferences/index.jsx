import { useEffect, useState } from 'react'
import AppearanceSection from './AppearanceSection'
import AISection from './AISection'
import CustomCommandsEditor from './CustomCommandsEditor'
import AboutSection from './AboutSection'
import { PaintBrush, Sparkle, Terminal, Info } from '@phosphor-icons/react'

const TABS = [
  { id: 'appearance', label: 'Appearance', Icon: PaintBrush },
  { id: 'ai',         label: 'AI',         Icon: Sparkle    },
  { id: 'commands',   label: 'Commands',   Icon: Terminal   },
  { id: 'about',      label: 'About',      Icon: Info       },
]

export default function PreferencesModal({ isOpen, onClose, initialTab }) {
  const [activeTab, setActiveTab] = useState('appearance')

  useEffect(() => {
    if (isOpen && initialTab) setActiveTab(initialTab)
  }, [isOpen, initialTab])

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)',
        }}
      />

      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10000,
        width: 560,
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 60px)',
        background: 'var(--bg-base)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Tab strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          padding: '10px 16px 0',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 16px 9px',
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  background: active ? 'rgba(255,255,255,0.07)' : 'none',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  minWidth: 60,
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <tab.Icon size={20} weight={active ? 'fill' : 'regular'} />
                <span style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-ui)',
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border) transparent',
        }}>
          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'ai'         && <AISection />}
          {activeTab === 'commands'   && <CustomCommandsEditor />}
          {activeTab === 'about'      && <AboutSection />}
        </div>
      </div>
    </>
  )
}
