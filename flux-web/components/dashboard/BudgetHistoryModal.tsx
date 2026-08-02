'use client'

import { useEffect, useMemo, useState } from 'react'
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

function monthKey(r: MonthRow): string {
  return `${r.year}-${r.month}`
}

function rangeLabel(windowRows: MonthRow[]): string {
  if (windowRows.length === 0) return ''
  const first = windowRows[0]
  const last = windowRows[windowRows.length - 1]
  const firstLabel = `${MONTHS_ES[first.month - 1].slice(0, 3)} ${first.year}`
  const lastLabel = `${MONTHS_ES[last.month - 1].slice(0, 3)} ${last.year}`
  return monthKey(first) === monthKey(last) ? firstLabel : `${firstLabel} – ${lastLabel}`
}

const CHART_HEIGHT = 96
const WINDOW = 6

export default function BudgetHistoryModal({ userId, baseCurrency, onClose }: Props) {
  const [closing, setClosing] = useState(false)
  const [rows, setRows] = useState<MonthRow[] | null>(null)
  const [page, setPage] = useState(0) // 0 = most recent window, increases going back in time
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

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

  // ── All-time discipline badges — computed once over the full history ──────
  const { streak, complianceRate, totalWithTarget } = useMemo(() => {
    if (!rows) return { streak: 0, complianceRate: null as number | null, totalWithTarget: 0 }
    const withTarget = rows.filter(r => r.target > 0)
    const compliantCount = withTarget.filter(r => r.spent <= r.target).length
    const rate = withTarget.length > 0 ? (compliantCount / withTarget.length) * 100 : null
    let s = 0
    for (let i = withTarget.length - 1; i >= 0; i--) {
      if (withTarget[i].spent <= withTarget[i].target) s++
      else break
    }
    return { streak: s, complianceRate: rate, totalWithTarget: withTarget.length }
  }, [rows])

  // ── 6-month window ─────────────────────────────────────────────────────────
  const maxPage = rows && rows.length > 0 ? Math.max(0, Math.ceil(rows.length / WINDOW) - 1) : 0
  const windowRows = useMemo(() => {
    if (!rows || rows.length === 0) return []
    const end = Math.max(0, rows.length - page * WINDOW)
    const start = Math.max(0, end - WINDOW)
    return rows.slice(start, end)
  }, [rows, page])

  const maxScale = windowRows.length > 0
    ? Math.max(...windowRows.map(r => Math.max(r.target, r.spent)), 1)
    : 1
  const monthsOver = windowRows.filter(r => r.target > 0 && r.spent > r.target).length
  const avgSpent = windowRows.length > 0 ? windowRows.reduce((s, r) => s + r.spent, 0) / windowRows.length : 0

  function goPrev() { setSelectedKey(null); setPage(p => Math.min(maxPage, p + 1)) }
  function goNext() { setSelectedKey(null); setPage(p => Math.max(0, p - 1)) }

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
              {/* Discipline badges — all-time, don't move with the window */}
              {totalWithTarget > 0 && (
                <div className="flex items-center gap-2.5 px-5 pt-4">
                  <div className="flex-1 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                    <span className="text-[18px]">{streak > 0 ? '🔥' : '💤'}</span>
                    <div>
                      <p className="text-[15px] font-black leading-none" style={{ color: 'var(--f-text)' }}>{streak}</p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--f-text-4)' }}>racha actual</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                    <span className="text-[18px]">✅</span>
                    <div>
                      <p className="text-[15px] font-black leading-none" style={{ color: 'var(--f-text)' }}>{Math.round(complianceRate ?? 0)}%</p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--f-text-4)' }}>cumplimiento</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Window navigation */}
              <div className="flex items-center justify-between px-5 pt-4">
                <button
                  onClick={goPrev}
                  disabled={page >= maxPage}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'var(--f-bg-input)' }}
                >
                  <i className="fa-solid fa-chevron-left text-[12px]" style={{ color: 'var(--f-text)' }} />
                </button>
                <p className="text-[14px] font-black" style={{ color: 'var(--f-text)' }}>{rangeLabel(windowRows)}</p>
                <button
                  onClick={goNext}
                  disabled={page <= 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
                  style={{ background: 'var(--f-bg-input)' }}
                >
                  <i className="fa-solid fa-chevron-right text-[12px]" style={{ color: 'var(--f-text)' }} />
                </button>
              </div>

              {/* Stats strip — scoped to the visible window */}
              <div className="grid grid-cols-2 gap-2.5 px-5 pt-3 pb-2">
                <div className="rounded-[14px] p-3" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                  <p className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--f-text-4)' }}>Promedio gastado</p>
                  <p className="text-[17px] font-black tabular-nums" style={{ color: 'var(--f-text)' }}>{formatCurrency(avgSpent, baseCurrency)}</p>
                </div>
                <div className="rounded-[14px] p-3" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                  <p className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--f-text-4)' }}>Meses excedidos</p>
                  <p className="text-[17px] font-black tabular-nums" style={{ color: monthsOver > 0 ? 'var(--f-expense)' : 'var(--f-text)' }}>
                    {monthsOver} <span className="text-[12px] font-bold opacity-50">de {windowRows.length}</span>
                  </p>
                </div>
              </div>

              {/* Chart: bar = gasto real, tick = objetivo del mes, una sola escala compartida */}
              <div className="px-5 pt-3">
                <div className="flex items-end gap-3" style={{ height: CHART_HEIGHT + 28 }}>
                  {windowRows.map(r => {
                    const key = monthKey(r)
                    const color = statusColor(r.target, r.spent)
                    const barPct = Math.min((r.spent / maxScale) * 100, 100)
                    const tickPct = Math.min((r.target / maxScale) * 100, 100)
                    const isSelected = selectedKey === key
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedKey(isSelected ? null : key)}
                        className="flex flex-col items-center flex-1 min-w-0"
                      >
                        <div
                          className="relative w-full rounded-[6px] overflow-hidden transition-transform"
                          style={{
                            height: CHART_HEIGHT,
                            background: 'var(--f-bg-input)',
                            outline: isSelected ? `2px solid ${color}` : 'none',
                            outlineOffset: 1,
                            transform: isSelected ? 'scale(1.04)' : 'none',
                          }}
                        >
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
                        <p className="text-[10px] font-bold mt-1.5 whitespace-nowrap" style={{ color: isSelected ? 'var(--f-text)' : 'var(--f-text-4)' }}>
                          {MONTHS_ES[r.month - 1].slice(0, 3)}
                        </p>
                      </button>
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

              {/* Monthly list — same window, most recent first */}
              <div className="px-5 pt-2 pb-4 space-y-2">
                {[...windowRows].reverse().map(r => {
                  const key = monthKey(r)
                  const color = statusColor(r.target, r.spent)
                  const pct = r.target > 0 ? Math.min((r.spent / r.target) * 100, 999) : null
                  const isSelected = selectedKey === key
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedKey(isSelected ? null : key)}
                      className="flex items-center justify-between rounded-[14px] px-3.5 py-3 cursor-pointer transition-colors"
                      style={{
                        background: isSelected ? `color-mix(in srgb, ${color} 10%, var(--f-bg-card))` : 'var(--f-bg-card)',
                        border: `1px solid ${isSelected ? color : 'var(--f-line)'}`,
                      }}
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
