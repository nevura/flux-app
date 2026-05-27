'use client'

import { useEffect } from 'react'

export default function ThemeSync({ theme }: { theme: 'dark' | 'light' }) {
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try { localStorage.setItem('flux-theme', theme) } catch {}
  }, [theme])

  return null
}
