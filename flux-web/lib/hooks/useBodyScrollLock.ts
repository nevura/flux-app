import { useEffect } from 'react'
import { lockBodyScroll } from '@/lib/scrollLock'

// iOS-compatible scroll lock: saves scrollY, uses position:fixed to avoid
// page jumps, and restores scroll position on cleanup. Nesting-safe — see
// lib/scrollLock.ts — so opening another overlay (e.g. a CurrencyPicker
// BottomSheet) on top of a modal using this hook won't unlock scroll early.
export function useBodyScrollLock() {
  useEffect(() => lockBodyScroll(), [])
}
