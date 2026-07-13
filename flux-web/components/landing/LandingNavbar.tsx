'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const BLUE = '#007AFF'
const GRAY = '#6E6E73'
const WHITE = '#FFFFFF'

export function LandingNavbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[60px]">
        <span className="text-[22px] font-black tracking-tight" style={{ color: BLUE }}>fluxapp finance</span>
        <div className="flex items-center gap-3">
          <Link
            href="/guia"
            className="hidden sm:block text-[15px] font-semibold px-3 py-1.5 rounded-[10px] transition-all"
            style={{ color: GRAY }}
          >
            Guía
          </Link>
          {isAuthenticated ? (
            <Link
              href="/home"
              className="text-[15px] font-bold px-4 py-2 rounded-[10px] transition-all active:scale-95"
              style={{ background: BLUE, color: WHITE }}
            >
              Ir a la app →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[15px] font-bold px-4 py-2 rounded-[10px] transition-all active:scale-95"
              style={{ background: BLUE, color: WHITE }}
            >
              Comenzar gratis
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
