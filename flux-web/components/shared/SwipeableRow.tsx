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
  disabled?: boolean
}

const ACTION_W = 76

export function SwipeableRow({ children, rightActions, className, style, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseOffset = useRef(0)
  const offsetRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dirRef = useRef<'h' | 'v' | null>(null)
  const lastTouchX = useRef(0)
  const lastTouchT = useRef(0)
  const velocityRef = useRef(0)
  const [offset, setOffset] = useState(0)
  const maxReveal = rightActions.length * ACTION_W

  const snapDirRef = useRef<'open' | 'close'>('close')
  const isOpenRef = useRef(false)

  function snapTo(val: number, skipHaptic = false) {
    isDraggingRef.current = false
    const opening = val < 0
    snapDirRef.current = opening ? 'open' : 'close'
    isOpenRef.current = opening
    offsetRef.current = val
    baseOffset.current = val
    setOffset(val)
    if (opening && !skipHaptic && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el || maxReveal === 0 || disabled) return

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0]
      startX.current = t.clientX
      startY.current = t.clientY
      lastTouchX.current = t.clientX
      lastTouchT.current = Date.now()
      velocityRef.current = 0
      baseOffset.current = offsetRef.current
      dirRef.current = null
    }

    function onTouchMove(e: TouchEvent) {
      const t = e.touches[0]
      const dx = t.clientX - startX.current
      const dy = t.clientY - startY.current

      if (!dirRef.current) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          dirRef.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
        }
        return
      }
      if (dirRef.current !== 'h') return

      e.stopPropagation()

      // Track velocity (px/ms)
      const now = Date.now()
      const dt = now - lastTouchT.current
      if (dt > 0) velocityRef.current = (t.clientX - lastTouchX.current) / dt
      lastTouchX.current = t.clientX
      lastTouchT.current = now

      e.preventDefault()
      isDraggingRef.current = true

      const raw = baseOffset.current + dx
      // Rubber-band past max
      const clamped = raw < -maxReveal
        ? -maxReveal - Math.sqrt(Math.abs(raw) - maxReveal) * 3
        : Math.min(0, raw)
      offsetRef.current = clamped
      setOffset(clamped)
    }

    function onTouchEnd() {
      if (dirRef.current === 'v') return
      if (dirRef.current === null) {
        // Pure tap — don't interfere. Content overlay and action buttons
        // handle close/action via their own onClick handlers.
        return
      }

      const vel = velocityRef.current // negative = swiping left (opening)
      const cur = offsetRef.current

      let target: number
      if (vel < -0.35) {
        // Fast swipe left → open
        target = -maxReveal
      } else if (vel > 0.35) {
        // Fast swipe right → close
        target = 0
      } else {
        // Slow drag → snap based on midpoint
        target = cur < -(maxReveal / 2) ? -maxReveal : 0
      }

      snapTo(target)
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

  const transition = isDraggingRef.current
    ? 'none'
    : snapDirRef.current === 'open'
      ? 'transform 0.42s cubic-bezier(0.34, 1.25, 0.64, 1)'
      : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)'

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className ?? ''}`}
      style={style}
    >
      <div
        style={{
          display: 'flex',
          width: `calc(100% + ${maxReveal}px)`,
          transform: `translateX(${offset}px)`,
          transition,
          willChange: 'transform',
        }}
      >
        {/* Content */}
        <div
          style={{
            flex: `0 0 calc(100% - ${maxReveal}px)`,
            minWidth: 0,
            position: 'relative',
          }}
        >
          {offset < 0 && (
            <div
              className="absolute inset-0 z-10"
              onClick={() => snapTo(0, true)}
            />
          )}
          {children}
        </div>

        {/* Action tray */}
        <div style={{ display: 'flex', flex: `0 0 ${maxReveal}px`, gap: '2px', padding: '3px 3px 3px 5px' }}>
          {rightActions.map((action, i) => {
            const isFirst = i === 0
            const isLast = i === rightActions.length - 1
            return (
              <button
                key={i}
                onClick={() => { action.onClick(); snapTo(0, true) }}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 active:brightness-90"
                style={{
                  background: action.bg,
                  color: 'white',
                  borderRadius: isFirst && isLast ? '14px' : isFirst ? '14px 6px 6px 14px' : isLast ? '6px 14px 14px 6px' : '6px',
                }}
              >
                <i className={`${action.icon} text-[20px]`} />
                {action.label && (
                  <span className="text-[11px] font-black tracking-tight leading-none">{action.label}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
