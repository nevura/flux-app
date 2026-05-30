import { useEffect } from 'react'

export function useBodyScrollLock() {
  useEffect(() => {
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [])
}
