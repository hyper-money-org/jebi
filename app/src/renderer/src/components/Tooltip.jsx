import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const tooltipStyle = `
  .jebi-tooltip {
    position: fixed;
    z-index: 99999;
    pointer-events: none;
    padding: 5px 9px;
    border-radius: 6px;
    background: var(--bg-surface, #1a1b2e);
    border: 1px solid var(--border);
    color: var(--text-primary);
    font-family: var(--font-ui);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2);
    opacity: 0;
    transform: translateY(3px);
    transition: opacity 0.12s ease, transform 0.12s ease;
    letter-spacing: 0.01em;
  }
  .jebi-tooltip.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .jebi-tooltip-arrow {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
  }
  .jebi-tooltip-arrow.below {
    top: 100%;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--border);
  }
  .jebi-tooltip-arrow.below::after {
    content: '';
    position: absolute;
    left: -4px;
    top: -6px;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid var(--bg-surface, #1a1b2e);
  }
  .jebi-tooltip-arrow.above {
    bottom: 100%;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid var(--border);
  }
  .jebi-tooltip-arrow.above::after {
    content: '';
    position: absolute;
    left: -4px;
    bottom: -6px;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid var(--bg-surface, #1a1b2e);
  }
`

let styleInjected = false
function injectStyle() {
  if (styleInjected) return
  const el = document.createElement('style')
  el.textContent = tooltipStyle
  document.head.appendChild(el)
  styleInjected = true
}

export default function Tooltip({ text, children, placement = 'top' }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: -9999, left: -9999 })
  const [arrowDir, setArrowDir] = useState('below')
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => { injectStyle() }, [])
  useEffect(() => () => clearTimeout(timerRef.current), [])

  function show() {
    timerRef.current = setTimeout(() => {
      const trigger = triggerRef.current
      const ttEl = tooltipRef.current
      if (!trigger || !ttEl) return

      const rect = trigger.getBoundingClientRect()
      const ttW = ttEl.offsetWidth || 100
      const ttH = ttEl.offsetHeight || 28
      const GAP = 7
      const viewH = window.innerHeight
      const viewW = window.innerWidth

      let top, arrow
      const spaceAbove = rect.top
      const spaceBelow = viewH - rect.bottom

      if (placement === 'top' && spaceAbove >= ttH + GAP) {
        top = rect.top - ttH - GAP
        arrow = 'below'
      } else if (spaceBelow >= ttH + GAP) {
        top = rect.bottom + GAP
        arrow = 'above'
      } else {
        top = rect.top - ttH - GAP
        arrow = 'below'
      }

      let left = rect.left + rect.width / 2 - ttW / 2
      left = Math.max(6, Math.min(left, viewW - ttW - 6))

      setArrowDir(arrow)
      setPos({ top, left })
      setVisible(true)
    }, 300)
  }

  function hide() {
    clearTimeout(timerRef.current)
    setVisible(false)
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onMouseDown={hide}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </span>
      {createPortal(
        <div
          ref={tooltipRef}
          className={`jebi-tooltip${visible ? ' visible' : ''}`}
          style={{ top: pos.top, left: pos.left }}
        >
          {text}
          <span className={`jebi-tooltip-arrow ${arrowDir}`} />
        </div>,
        document.body
      )}
    </>
  )
}
