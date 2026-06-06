'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { COACH_MARKS } from '@/lib/coach-marks'
import CoachMarkOverlay from './CoachMarkOverlay'
import { markCoachMarkDone } from '@/actions/config'

const LS_KEY = (page: string) => `flux_coach_${page}`

// Maps each coach pageKey to the route prefix(es) where it should appear
const PAGE_PATHS: Partial<Record<keyof typeof COACH_MARKS, string[]>> = {
  home:         ['/home'],
  transactions: ['/transactions'],
  shared:       ['/shared'],
  settings:     ['/settings'],
}

interface Props {
  pageKey: keyof typeof COACH_MARKS
  /** If true, the tour shows regardless of localStorage (for manual re-trigger) */
  force?: boolean
  onDone?: () => void
}

export default function CoachMarkTour({ pageKey, force, onDone }: Props) {
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  const isPageActive = (path: string) => {
    const allowed = PAGE_PATHS[pageKey]
    if (!allowed) return true
    return allowed.some(p => path.startsWith(p))
  }

  // Close immediately whenever the user leaves this tab
  useEffect(() => {
    if (!isPageActive(pathname)) {
      setShow(false)
    }
  }, [pathname])

  // Start tour when the page becomes active and hasn't been completed
  useEffect(() => {
    if (!isPageActive(pathname)) return
    if (force) { setShow(true); return }
    const done = localStorage.getItem(LS_KEY(pageKey))
    if (!done) {
      const t = setTimeout(() => {
        if (localStorage.getItem('flux_onboarding_open')) return
        if (!isPageActive(window.location.pathname)) return
        setShow(true)
      }, 600)
      return () => clearTimeout(t)
    }
  }, [pageKey, force, pathname])

  function handleDone() {
    localStorage.setItem(LS_KEY(pageKey), '1')
    setShow(false)
    onDone?.()
    markCoachMarkDone(pageKey).catch(() => {})
  }

  if (!show || !isPageActive(pathname)) return null

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
