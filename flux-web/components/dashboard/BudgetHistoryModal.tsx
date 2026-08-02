'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, effectiveExpenseAmount } from '@/lib/utils'
import { MONTHS_ES } from '@/lib/constants'
import { useBottomSheetSwipe } from '@/lib/hooks/useBottomSheetSwipe'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'

interface MonthRow {
  year: number
  month: number
  target: number
  spent: number
}

interface Props {
  userId: string
  baseCurrency: string
  onClose: () => void
}

function statusColor(target: number, spent: number): string {
  if (target <= 0) return 'var(--f-text-4)'
  if (spent > target) return 'var(--f-expense)'
  if (target - spent < target * 0.2) return 'var(--f-warning)'
  return 'var(--f-income)'
}

const CHART_HEIGHT = 96

export default function BudgetHistoryModal({ userId, baseCurrency, onClose }: Props) {
  const [closing, setClosing] = useState(false)
  const [rows, setRows] = useState<MonthRow[] | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleClose() {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 260)
  }

  const { handleProps: swipeHandleProps, sheetStyle } = useBottomSheetSwipe(handleClose)
  useBodyScrollLock()

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const [{ data: budgets }, { data: txs }] = await Promise.all([
        supabase.from('budgets').select('year, month, amount').eq('user_id', userId),
        supabase.from('transactions').select('type, amount, exchange_rate, transaction_date, exclude_mode, split_data')
          .eq('user_id', userId).eq('type', 'TR-GASTO'),
      ])

      const map = new Map<string, MonthRow>()
      for (const b of (budgets ?? [])) {
        const key = `${b.year}-${b.month}`
        map.set(key, { year: b.year, month: b.month, target: Number(b.amount), spent: 0 })
      }
      for (const t of (txs ?? [])) {
        const d = new Date(t.transaction_date)
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const key = `${year}-${month}`
        const existing = map.get(key) ?? { year, month, target: 0, spent: 0 }
        existing.spent += effectiveExpenseAmount(t)
        map.set(key, existing)
      }

      const sorted = Array.from(map.values()).sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month,
      )
      setRows(sorted)
    })()
  }, [userId])

  useEffect(() => {
    if (rows && rows.length > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [rows])

  const maxScale = rows && rows.length > 0
    ? Math.max(...rows.map(r => Math.max(r.target, r.spent)), 1)
    : 1

  const monthsOver = rows?.filter(r => r.target > 0 && r.spent > r.target).length ?? 0
  const avgSpent = rows && rows.length > 0 ? rows.reduce((s, r) => s + r.spent, 0) / rows.length : 0

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] ${closing ? 'animate-slide-down' : 'animate-slide-up'} flex flex-col mx-auto max-w-lg`}
        style={{
          maxHeight: '92dvh',
          background: 'var(--f-bg-elevated)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid var(--f-line-strong)',
          borderBottom: 'none',
          ...sheetStyle,
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" {...swipeHandleProps}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>
        <div className="flex items-start justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--f-line)' }}>
          <div>
            <h2 className="text-[18px] font-black" style={{ color: 'var(--f-text)' }}>Historial de presupuesto</h2>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--f-text-3)' }}>
              Cada mes conserva el objetivo que tenía en su momento
            </p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--f-bg-input)' }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: 'var(--f-text)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!rows ? (
            <div className="px-5 py-10 flex justify-center">
              <i className="fa-solid fa-spinner fa-spin text-lg" style={{ color: 'var(--f-text-3)' }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[15px] font-bold" style={{ color: 'var(--f-text-3)' }}>Aún no hay historial de presupuesto</p>
            </div>
          ) : (
            <>
              {/* Stats strip */}
              <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 pb-2">
                <div className="rounded-[14px] p-3" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                  <p className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--f-text-4)' }}>Promedio gastado</p>
                  <p className="text-[17px] font-black tabular-nums" style={{ color: 'var(--f-text)' }}>{formatCurrency(avgSpent, baseCurrency)}</p>
                </div>
                <div className="rounded-[14px] p-3" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                  <p className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--f-text-4)' }}>Meses excedidos</p>
                  <p className="text-[17px] font-black tabular-nums" style={{ color: monthsOver > 0 ? 'var(--f-expense)' : 'var(--f-text)' }}>
                    {monthsOver} <span className="text-[12px] font-bold opacity-50">de {rows.length}</span>
                  </p>
                </div>
              </div>

              {/* Chart: bar = gasto real, tick = objetivo del mes, una sola escala compartida */}
              <div className="px-5 pt-3">
                <div ref={scrollRef} className="flex items-end gap-3 overflow-x-auto no-scrollbar pb-1" style={{ height: CHART_HEIGHT + 28 }}>
                  {rows.map(r => {
                    const color = statusColor(r.target, r.spent)
                    const barPct = Math.min((r.spent / maxScale) * 100, 100)
                    const tickPct = Math.min((r.target / maxScale) * 100, 100)
                    return (
                      <div key={`${r.year}-${r.month}`} className="flex flex-col items-center flex-shrink-0" style={{ width: 28 }}>
                        <div className="relative w-full rounded-[6px] overflow-hidden" style={{ height: CHART_HEIGHT, background: 'var(--f-bg-input)' }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-[6px]"
                            style={{ height: `${barPct}%`, background: color, transition: 'height 600ms cubic-bezier(0.22,1,0.36,1)' }}
                          />
                          {r.target > 0 && (
                            <div
                              className="absolute left-0 right-0"
                              style={{ bottom: `${tickPct}%`, height: 2, background: 'var(--f-text)', opacity: 0.6 }}
                            />
                          )}
                        </div>
                        <p className="text-[10px] font-bold mt-1.5 whitespace-nowrap" style={{ color: 'var(--f-text-4)' }}>
                          {MONTHS_ES[r.month - 1].slice(0, 3)}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-3.5 mt-2 mb-1 px-0.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--f-text-4)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--f-income)' }} /> En rango
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--f-text-4)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--f-warning)' }} /> Cerca del límite
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--f-text-4)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--f-expense)' }} /> Excedido
                  </span>
                </div>
              </div>

              {/* Monthly list, most recent first */}
              <div className="px-5 pt-2 pb-4 space-y-2">
                {[...rows].reverse().map(r => {
                  const color = statusColor(r.target, r.spent)
                  const pct = r.target > 0 ? Math.min((r.spent / r.target) * 100, 999) : null
                  return (
                    <div
                      key={`${r.year}-${r.month}`}
                      className="flex items-center justify-between rounded-[14px] px-3.5 py-3"
                      style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}
                    >
                      <div>
                        <p className="text-[14px] font-bold" style={{ color: 'var(--f-text)' }}>{MONTHS_ES[r.month - 1]} {r.year}</p>
                        <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                          {formatCurrency(r.spent, baseCurrency)} {r.target > 0 ? <>de {formatCurrency(r.target, baseCurrency)}</> : <span style={{ color: 'var(--f-text-4)' }}>sin presupuesto</span>}
                        </p>
                      </div>
                      {pct !== null && (
                        <span className="text-[13px] font-black tabular-nums px-2 py-1 rounded-full" style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                          {Math.round(pct)}%
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
