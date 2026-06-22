'use client'

import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { SUPPORTED_CURRENCIES, getCurrenciesByCode } from '@/lib/constants'

/**
 * Searchable currency picker, code-sorted (MXN, USD, ZAR…). Renders its list
 * in a BottomSheet (portal to document.body) so it's never clipped by an
 * ancestor's overflow-hidden — a plain absolute-positioned dropdown was
 * getting cut off at the bottom of rounded card sections.
 */
export function CurrencyPicker({
  value,
  onChange,
  disabled,
  renderTrigger,
}: {
  value: string
  onChange: (code: string) => void
  disabled?: boolean
  renderTrigger?: (opts: { code: string; name: string | undefined; open: () => void; disabled?: boolean }) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const current = SUPPORTED_CURRENCIES.find(c => c.code === value)

  return (
    <>
      {renderTrigger
        ? renderTrigger({ code: value, name: current?.name, open: () => setOpen(true), disabled })
        : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className="w-full rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between [color:var(--f-text)] focus:outline-none disabled:opacity-50"
            style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
          >
            <span>{value} — {current?.name}</span>
            <i className="fa-solid fa-chevron-down text-[11px]" style={{ color: 'var(--f-text-4)' }} />
          </button>
        )}

      {open && (
        <BottomSheet title="Elegir divisa" onClose={() => { setOpen(false); setQuery('') }}>
          <div className="px-5 pb-2">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full rounded-xl px-4 py-3 text-sm mb-2 [color:var(--f-text)] placeholder:opacity-30 focus:outline-none"
              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
            />
            <div className="max-h-[55vh] overflow-y-auto">
              {getCurrenciesByCode()
                .filter(c => {
                  const q = query.trim().toLowerCase()
                  if (!q) return true
                  return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
                })
                .map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => { onChange(c.code); setOpen(false); setQuery('') }}
                    className="w-full px-3 py-2.5 rounded-lg text-left text-sm flex items-center justify-between active:opacity-60"
                    style={{ color: 'var(--f-text)', background: c.code === value ? 'var(--f-accent-bg)' : 'transparent' }}
                  >
                    <span className="font-bold">{c.code}</span>
                    <span className="text-[13px] opacity-60 truncate ml-3">{c.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  )
}
