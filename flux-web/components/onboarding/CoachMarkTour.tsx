'use client'

import { useState, useEffect } from 'react'
import { COACH_MARKS } from '@/lib/coach-marks'
import CoachMarkOverlay from './CoachMarkOverlay'

const LS_KEY = (page: string) => `flux_coach_${page}`

interface Props {
  pageKey: keyof typeof COACH_MARKS
  /** If true, the tour shows regardless of localStorage (for manual re-trigger) */
  force?: boolean
  onDone?: () => void
}

export default function CoachMarkTour({ pageKey, force, onDone }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (force) { setShow(true); return }
    const done = localStorage.getItem(LS_KEY(pageKey))
    if (!done) {
      const t = setTimeout(() => {
        // Don't show while onboarding slides are active
        if (localStorage.getItem('flux_onboarding_open')) return
        setShow(true)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [pageKey, force])

  function handleDone() {
    localStorage.setItem(LS_KEY(pageKey), '1')
    setShow(false)
    onDone?.()
  }

  if (!show) return null

  const steps = COACH_MARKS[pageKey]
  if (!steps?.length) return null

  return <CoachMarkOverlay steps={steps} onDone={handleDone} />
}

/** Resets the coach mark tour for a given page (call from Settings → Guía) */
export function resetCoachMark(pageKey: string) {
  localStorage.removeItem(LS_KEY(pageKey))
}

/** Resets all coach mark tours */
export function resetAllCoachMarks() {
  Object.keys(COACH_MARKS).forEach(k => localStorage.removeItem(LS_KEY(k)))
}
