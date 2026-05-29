'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { CoachMarkStep } from '@/lib/coach-marks'

interface Rect { top: number; left: number; width: number; height: number }

const PADDING = 10
const TOOLTIP_WIDTH = 280
const TOOLTIP_HEIGHT_APPROX = 160

export default function CoachMarkOverlay({
  steps,
  onDone,
}: {
  steps: CoachMarkStep[]
  onDone: () => void
}) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)

  const current = steps[step]
  const isLast = step === steps.length - 1

  const measureStep = useCallback((idx: number) => {
    const el = document.querySelector(`[data-coach="${steps[idx].target}"]`)
    if (!el) {
      // element not found — skip
      if (idx < steps.length - 1) setStep(idx + 1)
      else onDone()
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }, 350)
  }, [steps, onDone])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    setRect(null)
    const t = setTimeout(() => measureStep(step), 50)
    return () => clearTimeout(t)
  }, [step, mounted, measureStep])

  function next() {
    if (isLast) { onDone(); return }
    setRect(null)
    setStep(s => s + 1)
  }

  if (!mounted || !rect) return null

  const spotlight = {
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
  }

  const tooltipLeft = Math.max(16, Math.min(spotlight.left, window.innerWidth - TOOLTIP_WIDTH - 16))
  const showBelow = spotlight.top + spotlight.height + TOOLTIP_HEIGHT_APPROX + 16 < window.innerHeight
  const tooltipTop = Math.max(16, Math.min(
    showBelow ? spotlight.top + spotlight.height + 16 : spotlight.top - TOOLTIP_HEIGHT_APPROX - 16,
    window.innerHeight - TOOLTIP_HEIGHT_APPROX - 16,
  ))

  return createPortal(
    <div className="fixed inset-0 z-[600]">
      {/* Click-anywhere overlay to advance */}
      <div className="absolute inset-0" onClick={next} />

      {/* Spotlight box */}
      <div
        style={{
          position: 'fixed',
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
          borderRadius: 16,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
          border: '2px solid rgba(255,255,255,0.25)',
          pointerEvents: 'none',
          transition: 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
          zIndex: 601,
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_WIDTH,
          zIndex: 602,
          pointerEvents: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="rounded-[20px] p-4 animate-fade-up"
          style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1 mb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 16 : 5,
                  height: 5,
                  background: i === step ? 'var(--f-blue)' : 'var(--f-line-strong)',
                }}
              />
            ))}
          </div>

          <h3 className="text-[17px] font-black mb-1" style={{ color: 'var(--f-text)' }}>
            {current.title}
          </h3>
          <p className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--f-text-3)' }}>
            {current.description}
          </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={onDone}
              className="py-2 px-3 rounded-[10px] text-[14px] font-black"
              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-4)' }}
            >
              Saltar
            </button>
            <button
              onClick={next}
              className="flex-1 py-2 rounded-[10px] text-[15px] font-black text-white"
              style={{ background: 'var(--f-blue)' }}
            >
              {isLast ? 'Entendido ✓' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
