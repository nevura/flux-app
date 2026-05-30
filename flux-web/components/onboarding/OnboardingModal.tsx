'use client'

import { useState, useTransition, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ONBOARDING_SLIDES } from '@/lib/guide'
import { completeOnboarding } from '@/actions/config'

interface Props {
  onDone: () => void
}

export default function OnboardingModal({ onDone }: Props) {
  const [current, setCurrent] = useState(0)
  const [isPending, startTransition] = useTransition()
  const touchStartX = useRef<number | null>(null)
  const total = ONBOARDING_SLIDES.length
  const slide = ONBOARDING_SLIDES[current]
  const isLast = current === total - 1

  function finish() {
    startTransition(async () => {
      await completeOnboarding()
      onDone()
    })
  }

  function next() {
    if (isLast) { finish(); return }
    setCurrent(c => c + 1)
  }

  function prev() {
    if (current > 0) setCurrent(c => c - 1)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'var(--f-bg)', paddingTop: 'var(--safe-top)', paddingBottom: 'max(1.5rem, var(--safe-bottom))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div className="flex justify-end px-5 pt-4 flex-shrink-0">
        {!isLast && (
          <button
            onClick={finish}
            className="text-[15px] font-bold px-3 py-1.5 rounded-full"
            style={{ color: 'var(--f-text-4)', background: 'var(--f-bg-input)' }}
          >
            Saltar
          </button>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6"
          style={{ background: slide.iconBg }}
        >
          <i className={`${slide.icon} text-3xl`} style={{ color: slide.iconColor }} />
        </div>

        {/* Title + subtitle */}
        <h1 className="text-[28px] font-black leading-tight mb-2" style={{ color: 'var(--f-text)' }}>
          {slide.title}
        </h1>
        <p className="text-[17px] font-semibold mb-6" style={{ color: 'var(--f-text-3)' }}>
          {slide.subtitle}
        </p>

        {/* Bullets */}
        <div className="w-full max-w-xs space-y-3 text-left mb-4">
          {slide.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: slide.iconBg }}>
                <i className="fa-solid fa-check text-[11px]" style={{ color: slide.iconColor }} />
              </div>
              <p className="text-[16px] font-semibold leading-snug" style={{ color: 'var(--f-text-2)' }}>{bullet}</p>
            </div>
          ))}
        </div>

        {/* Tip */}
        {slide.tip && (
          <div className="w-full max-w-xs rounded-[12px] px-3 py-2.5 flex items-start gap-2 mt-1"
            style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
            <i className="fa-solid fa-lightbulb text-[13px] mt-0.5 flex-shrink-0" style={{ color: 'var(--f-blue)' }} />
            <p className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--f-text-2)' }}>{slide.tip}</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex-shrink-0 px-6 space-y-4">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {ONBOARDING_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                background: i === current ? 'var(--f-blue)' : 'var(--f-line-strong)',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {current > 0 && (
            <button
              onClick={prev}
              className="h-12 px-5 rounded-[14px] text-[17px] font-black transition-all active:scale-95"
              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
            >
              <i className="fa-solid fa-chevron-left text-[14px]" />
            </button>
          )}
          <button
            onClick={next}
            disabled={isPending}
            className="flex-1 h-12 rounded-[14px] text-[17px] font-black text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: isLast ? 'var(--f-income)' : 'var(--f-blue)' }}
          >
            {isPending
              ? <i className="fa-solid fa-spinner fa-spin" />
              : isLast ? '¡Empezar!' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
