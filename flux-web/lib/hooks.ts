import { useEffect, useRef, useState } from 'react'

export function useAnimatedWidth(target: number, delay = 100) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setW(target), delay)
    return () => clearTimeout(id)
  }, [target, delay])
  return w
}

export function useCountUp(target: number, duration = 1700) {
  const [value, setValue] = useState(0)
  const prevRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current ?? 0
    prevRef.current = target
    if (from === target) return

    cancelAnimationFrame(rafRef.current)
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}
