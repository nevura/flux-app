import { useRef, useState, useCallback, useEffect } from 'react'

export function useBottomSheetSwipe(onDismiss: () => void, threshold = 80) {
  const startY = useRef(0)
  const dragYRef = useRef(0)
  const [dragY, setDragY] = useState(0)
  const onDismissRef = useRef(onDismiss)
  useEffect(() => { onDismissRef.current = onDismiss }, [onDismiss])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    dragYRef.current = 0
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      dragYRef.current = delta
      setDragY(delta)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    const dy = dragYRef.current
    dragYRef.current = 0
    setDragY(0)
    if (dy >= threshold) onDismissRef.current()
  }, [threshold])

  return {
    handleProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      style: { touchAction: 'none' as const, cursor: 'grab' as const },
    },
    sheetStyle: {
      transform: dragY > 0 ? `translateY(${dragY}px)` : 'translateY(0)',
      transition: dragY > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      willChange: 'transform' as const,
    },
  }
}
