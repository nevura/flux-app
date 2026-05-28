'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Refreshes server data when the app comes back from background/inactivity.
// Fixes the iOS PWA "freeze" where the UI appears stuck after being suspended.
export default function WakeOnFocus() {
  const router = useRouter()

  useEffect(() => {
    let lastRefresh = Date.now()

    const refresh = () => {
      const now = Date.now()
      if (now - lastRefresh < 30_000) return  // debounce: max once per 30s
      lastRefresh = now
      router.refresh()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) refresh()  // iOS Safari BFCache restore
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [router])

  return null
}
