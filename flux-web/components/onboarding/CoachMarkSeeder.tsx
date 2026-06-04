'use client'

import { useEffect } from 'react'

const LS_KEY = (page: string) => `flux_coach_${page}`

export default function CoachMarkSeeder({ seen }: { seen: string[] }) {
  useEffect(() => {
    // Seed localStorage from DB so coach marks don't re-show in new browsers
    seen.forEach(page => localStorage.setItem(LS_KEY(page), '1'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
