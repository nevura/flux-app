'use client'

import { useRef, useEffect, useState } from 'react'

export interface SwipeAction {
  icon: string
  label?: string
  bg: string
  onClick: () => void
}

interface Props {
  children: React.ReactNode
  rightActions: SwipeAction[]
  className?: string
  style?: React.CSSProperties
}

const ACTION_W = 72

export function SwipeableRow({ children, rightActions, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const offsetRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dirRef = useRef<'h' | 'v' | null>(null)
  const [offset, setOffset] = useState(0)
  const maxReveal = rightActions.length * ACTION_W

  function snapTo(val: number) {
    isDraggingRef.current = false
    offsetRef.current = val
    baseOffset.current = val
    setOffset(val)
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el || maxReveal === 0) return

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      baseOffset.current = offsetRef.current
      dirRef.current = null
    }

    function onTouchMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      if (!dirRef.current) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          dirRef.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
        }
        return
      }
      if (dirRef.current !== 'h') return

      e.preventDefault()
      isDraggingRef.current = true
      const raw = baseOffset.current + dx
      const clamped = Math.max(-maxReveal, Math.min(0, raw))
      offsetRef.current = clamped
      setOffset(clamped)
    }

    function onTouchEnd() {
      if (dirRef.current === 'v') return
      if (dirRef.current === null) {
        if (offsetRef.current < 0) snapTo(0)
        return
      }
      snapTo(offsetRef.current < -(maxReveal / 2) ? -maxReveal : 0)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [maxReveal])

  const contentTransition = isDraggingRef.current
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ''}`}
      style={style}
    >
      {/* Action tray (right side, revealed on left-swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: maxReveal }}>
        {rightActions.map((action, i) => (
          <button
            key={i}
            onClick={() => { action.onClick(); snapTo(0) }}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 active:opacity-75"
            style={{ background: action.bg, color: 'white' }}
          >
            <i className={`${action.icon} text-[22px]`} />
            {action.label && (
              <span className="text-[11px] font-black tracking-tight">{action.label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content wrapper */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: contentTransition,
          willChange: 'transform',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Invisible overlay that captures taps while row is open */}
        {offset < 0 && (
          <div
            className="absolute inset-0 z-10"
            onClick={() => snapTo(0)}
          />
        )}
        {children}
      </div>
    </div>
  )
}
