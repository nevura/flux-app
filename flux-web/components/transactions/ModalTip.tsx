'use client'

import { useState, useEffect } from 'react'

interface Props {
  tipKey: string
  icon: string
  iconColor: string
  iconBg: string
  title: string
  body: string
}

export default function ModalTip({ tipKey, icon, iconColor, iconBg, title, body }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(`flux_tip_${tipKey}`)) setVisible(true)
    } catch {}
  }, [tipKey])

  if (!visible) return null

  function dismiss() {
    try { localStorage.setItem(`flux_tip_${tipKey}`, '1') } catch {}
    setVisible(false)
  }

  return (
    <div className="flex items-start gap-3 rounded-[14px] px-3.5 py-3 animate-fade-up"
      style={{ background: iconBg, border: `1px solid ${iconColor}28` }}>
      <i className={`${icon} text-[14px] mt-0.5 flex-shrink-0`} style={{ color: iconColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black mb-0.5" style={{ color: iconColor }}>{title}</p>
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--f-text-2)' }}>{body}</p>
      </div>
      <button onClick={dismiss} className="flex-shrink-0 mt-0.5 opacity-50 active:opacity-100 transition-opacity">
        <i className="fa-solid fa-xmark text-[13px]" style={{ color: 'var(--f-text-3)' }} />
      </button>
    </div>
  )
}
