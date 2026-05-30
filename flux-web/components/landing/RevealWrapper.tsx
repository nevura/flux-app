'use client'

import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'none'
  once?: boolean
}

export function RevealWrapper({ children, className, delay = 0, direction = 'up', once = true }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          if (once) observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const initial: Record<string, string> = {
    up: 'translateY(36px)',
    left: 'translateX(-36px)',
    right: 'translateX(36px)',
    none: 'none',
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: initial[direction],
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
