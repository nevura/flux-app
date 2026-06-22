'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScroll } from '@/lib/scrollLock'

export function BottomSheet({ onClose, children, title }: { onClose: () => void; children: React.ReactNode; title?: string }) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 260)
  }

  // Nesting-safe — see lib/scrollLock.ts — so a BottomSheet opened on top of
  // another modal (e.g. CurrencyPicker inside TransactionModal, or inside
  // another BottomSheet) won't unlock scroll while the outer one is still open.
  useEffect(() => {
    if (sheetRef.current) sheetRef.current.scrollTop = 0
    return lockBodyScroll()
  }, [])

  // Keep the sheet glued to the top of the keyboard, not the bottom of the
  // (unchanged) layout viewport. Shrinking maxHeight alone isn't enough: with
  // bottom:0 fixed to the full page, short content (e.g. a search box + a
  // few results) renders shorter than maxHeight and slides down with it —
  // sliding the whole sheet partly behind the keyboard. Lifting `bottom` by
  // the keyboard's height keeps the sheet's bottom edge pinned to the visible
  // viewport regardless of content height.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      if (!sheetRef.current) return
      const keyboardInset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      sheetRef.current.style.bottom = `${keyboardInset}px`
      sheetRef.current.style.maxHeight = `${vv.height - 16}px` // 16px breathing room above sheet
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update) // iOS can fire scroll instead of resize mid keyboard-animation
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      if (sheetRef.current) {
        sheetRef.current.style.bottom = ''
        sheetRef.current.style.maxHeight = ''
      }
    }
  }, [])

  return createPortal(
    <>
      <div className={`fixed inset-0 z-[200] bg-black/60 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={handleClose} />
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-[200] rounded-t-[28px] mx-auto max-w-lg ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={{
          background: 'var(--f-bg-elevated)',
          paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
          maxHeight: '90dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          overscrollBehavior: 'contain',
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-[17px] font-black" style={{ color: 'var(--f-text)' }}>{title}</p>
            <button onClick={handleClose} className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ background: 'var(--f-bg-input)' }}>
              <i className="fa-solid fa-xmark text-xs" style={{ color: 'var(--f-text-3)' }} />
            </button>
          </div>
        )}
        {children}
      </div>
    </>,
    document.body
  )
}
