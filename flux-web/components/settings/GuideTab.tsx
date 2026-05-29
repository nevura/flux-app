'use client'

import { useState } from 'react'
import { GUIDE_SECTIONS } from '@/lib/guide'
import { toast } from 'sonner'
import OnboardingModal from '@/components/onboarding/OnboardingModal'
import { resetCoachMark } from '@/components/onboarding/CoachMarkTour'
import { COACH_MARKS } from '@/lib/coach-marks'

const PAGE_LABELS: Record<string, string> = {
  home: 'Inicio',
  transactions: 'Movimientos',
  shared: 'Compartidos',
  settings: 'Configuración',
}

export default function GuideTab() {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [showTour, setShowTour] = useState(false)

  return (
    <div className="space-y-5">
      {/* Tour button */}
      <button
        onClick={() => setShowTour(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-95"
        style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--f-blue)' }}>
          <i className="fa-solid fa-play text-[13px] text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[16px] font-black" style={{ color: 'var(--f-blue)' }}>Ver tour de Flux</p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--f-text-4)' }}>Repasa las funciones principales</p>
        </div>
        <i className="fa-solid fa-chevron-right text-[13px]" style={{ color: 'var(--f-blue)' }} />
      </button>

      {showTour && <OnboardingModal onDone={() => setShowTour(false)} />}

      {/* Reset page tours */}
      <div>
        <p className="text-[12px] font-black tracking-[2.5px] uppercase mb-2 px-1" style={{ color: 'var(--f-text-4)' }}>
          Repetir tutorial por página
        </p>
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--f-line)' }}>
          {Object.keys(COACH_MARKS).map((pageKey, i) => (
            <button
              key={pageKey}
              onClick={() => {
                resetCoachMark(pageKey)
                toast.success(`Tour de ${PAGE_LABELS[pageKey] ?? pageKey} listo — ve a esa página para verlo`)
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-all active:opacity-70"
              style={{
                background: 'var(--f-bg-card)',
                borderTop: i > 0 ? '1px solid var(--f-line)' : undefined,
              }}
            >
              <span className="text-[15px] font-semibold" style={{ color: 'var(--f-text)' }}>
                {PAGE_LABELS[pageKey] ?? pageKey}
              </span>
              <span className="text-[13px] font-black px-2 py-0.5 rounded-full" style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
                Repetir
              </span>
            </button>
          ))}
        </div>
      </div>
      {GUIDE_SECTIONS.map(section => (
        <div key={section.id}>
          <p className="text-[12px] font-black tracking-[2.5px] uppercase mb-2 px-1" style={{ color: 'var(--f-text-4)' }}>
            {section.label}
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--f-line)' }}>
            {section.items.map((item, idx) => {
              const isOpen = openItem === item.id
              const isLast = idx === section.items.length - 1
              return (
                <div key={item.id} style={{ borderTop: idx > 0 ? '1px solid var(--f-line)' : undefined }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all active:opacity-70"
                    style={{ background: isOpen ? 'var(--f-bg-elevated)' : 'var(--f-bg-card)' }}
                    onClick={() => setOpenItem(isOpen ? null : item.id)}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--f-bg-elevated)' }}>
                      <i className={`${item.icon} text-[15px]`} style={{ color: item.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-bold" style={{ color: 'var(--f-text)' }}>{item.title}</p>
                      <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--f-text-4)' }}>{item.summary}</p>
                    </div>
                    <i
                      className="fa-solid fa-chevron-right text-[12px] flex-shrink-0 transition-transform duration-200"
                      style={{ color: 'var(--f-text-4)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 animate-fade-up" style={{ background: 'var(--f-bg-elevated)', borderTop: '1px solid var(--f-line)' }}>
                      <ul className="mt-3 space-y-2">
                        {item.bullets.map((bullet, bi) => (
                          <li key={bi} className="flex items-start gap-2.5">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.iconColor }} />
                            <p className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--f-text-2)' }}>{bullet}</p>
                          </li>
                        ))}
                      </ul>
                      {item.tip && (
                        <div className="mt-3 rounded-[10px] px-3 py-2.5 flex items-start gap-2" style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
                          <i className="fa-solid fa-lightbulb text-[13px] mt-0.5 flex-shrink-0" style={{ color: 'var(--f-blue)' }} />
                          <p className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--f-text-2)' }}>{item.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
