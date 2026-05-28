'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startYRef = useRef(0)
  const activeRef = useRef(false)
  const refreshingRef = useRef(false)

  const triggerRefresh = useCallback(() => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    router.refresh()
    setTimeout(() => {
      refreshingRef.current = false
      setRefreshing(false)
      setPullY(0)
    }, 1100)
  }, [router])

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !refreshingRef.current) {
        startYRef.current = e.touches[0].clientY
        activeRef.current = true
      }
    }

    const onMove = (e: TouchEvent) => {
      if (!activeRef.current) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        setPullY(Math.min(delta * 0.45, THRESHOLD))
      } else {
        activeRef.current = false
        setPullY(0)
      }
    }

    const onEnd = () => {
      if (!activeRef.current) return
      activeRef.current = false
      setPullY(prev => {
        if (prev >= THRESHOLD * 0.85) {
          triggerRefresh()
          return THRESHOLD
        }
        return 0
      })
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [triggerRefresh])

  const progress = Math.min(pullY / THRESHOLD, 1)
  const showIndicator = pullY > 6 || refreshing

  return (
    <>
      {/* Indicator: stays fixed, slides down as user pulls */}
      <div
        className="fixed left-0 right-0 flex justify-center z-40 pointer-events-none"
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + 8px)`,
          opacity: showIndicator ? Math.max(progress, refreshing ? 1 : 0) : 0,
          transform: `translateY(${showIndicator ? pullY * 0.4 : 0}px)`,
          transition: refreshing || pullY === 0 ? 'opacity 0.3s, transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
        }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full"
          style={{
            background: 'var(--f-bg-card)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--f-line-strong)',
            boxShadow: 'var(--f-shadow-card)',
          }}
        >
          <i
            className={`fa-solid fa-arrow-rotate-right ${refreshing ? 'animate-spin' : ''}`}
            style={{
              fontSize: 13,
              color: 'var(--f-text)',
              transform: refreshing ? undefined : `rotate(${progress * 300}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content: translates down while pulling */}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: pullY === 0 || refreshing ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </>
  )
}
