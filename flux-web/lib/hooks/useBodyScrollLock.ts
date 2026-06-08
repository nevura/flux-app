import { useEffect } from 'react'

// iOS-compatible scroll lock: saves scrollY, uses position:fixed to avoid
// page jumps, and restores scroll position on cleanup.
export function useBodyScrollLock() {
  useEffect(() => {
    const scrollY = window.scrollY
    const body = document.body
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    return () => {
      body.style.overflow = ''
      body.style.position = ''
      body.style.top = ''
      body.style.width = ''
      window.scrollTo({ top: scrollY, behavior: 'instant' })
    }
  }, [])
}
