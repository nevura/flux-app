'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { saveBudget } from '@/actions/config'
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

function monthKey(r: { year: number; month: number }): string {
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
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editInput, setEditInput] = useState('')
  const [isSaving, startSaving] = useTransition()

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

  function startEdit(r: MonthRow) {
    setEditingKey(monthKey(r))
    setEditInput(r.target > 0 ? String(r.target) : '')
  }

  function handleSaveEdit(r: MonthRow) {
    const amount = parseFloat(editInput)
    if (isNaN(amount) || amount < 0) { toast.error('Monto inválido'); return }
    startSaving(async () => {
      const res = await saveBudget(amount, r.year, r.month)
      if (res.error) { toast.error(res.error); return }
      setRows(prev => prev
        ? prev.map(row => monthKey(row) === monthKey(r) ? { ...row, target: amount } : row)
        : prev)
      toast.success('Presupuesto actualizado')
      setEditingKey(null)
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      />
      <div
        className={`f-glass fixed bottom-0 left-0 right-0 z-[60] ${closing ? 'animate-slide-down' : 'animate-slide-up'} flex flex-col mx-auto max-w-lg`}
        style={{
          maxHeight: '92dvh',
          background: 'var(--f-glass-bg)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid var(--f-glass-border)',
          borderBottom: 'none',
          boxShadow: 'var(--f-glass-shadow)',
          ...sheetStyle,
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" {...swipeHandleProps}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--f-line)' }}>
          <h2 className="text-[18px] font-black" style={{ color: 'var(--f-text)' }}>Historial de presupuesto</h2>
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
              {/* Window navigation — first thing you see */}
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

              {/* Discipline badges — all-time, don't move with the window */}
              {totalWithTarget > 0 && (
                <div className="flex items-center gap-2.5 px-5 pt-3">
                  <div
                    className="flex-1 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5"
                    style={{
                      background: streak > 0 ? 'color-mix(in srgb, var(--f-warning) 10%, var(--f-bg-elevated))' : 'var(--f-bg-elevated)',
                      border: `1px solid ${streak > 0 ? 'color-mix(in srgb, var(--f-warning) 30%, transparent)' : 'var(--f-accent-border)'}`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: streak > 0 ? 'var(--f-warning-bg)' : 'var(--f-bg-input)' }}>
                      <i className="fa-solid fa-fire text-[14px]" style={{ color: streak > 0 ? 'var(--f-warning)' : 'var(--f-text-4)' }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-black leading-none" style={{ color: 'var(--f-text)' }}>{streak}</p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--f-text-4)' }}>racha actual</p>
                    </div>
                  </div>
                  <div
                    className="flex-1 flex items-center gap-2 rounded-[14px] px-3.5 py-2.5"
                    style={{
                      background: 'color-mix(in srgb, var(--f-income) 10%, var(--f-bg-elevated))',
                      border: '1px solid color-mix(in srgb, var(--f-income) 30%, transparent)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--f-income-bg)' }}>
                      <i className="fa-solid fa-circle-check text-[14px]" style={{ color: 'var(--f-income)' }} />
                    </div>
                    <div>
                      <p className="text-[15px] font-black leading-none" style={{ color: 'var(--f-text)' }}>{Math.round(complianceRate ?? 0)}%</p>
                      <p className="text-[11px] font-bold mt-0.5" style={{ color: 'var(--f-text-4)' }}>cumplimiento</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats strip — scoped to the visible window */}
              <div className="grid grid-cols-2 gap-2.5 px-5 pt-3 pb-2">
                <div
                  className="rounded-[14px] p-3"
                  style={{
                    background: 'color-mix(in srgb, var(--f-blue) 8%, var(--f-bg-elevated))',
                    border: '1px solid color-mix(in srgb, var(--f-blue) 25%, transparent)',
                  }}
                >
                  <p className="text-[11px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--f-text-4)' }}>Promedio gastado</p>
                  <p className="text-[17px] font-black tabular-nums" style={{ color: 'var(--f-text)' }}>{formatCurrency(avgSpent, baseCurrency)}</p>
                </div>
                <div
                  className="rounded-[14px] p-3"
                  style={{
                    background: `color-mix(in srgb, ${monthsOver > 0 ? 'var(--f-expense)' : 'var(--f-income)'} 8%, var(--f-bg-elevated))`,
                    border: `1px solid color-mix(in srgb, ${monthsOver > 0 ? 'var(--f-expense)' : 'var(--f-income)'} 25%, transparent)`,
                  }}
                >
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
                            background: 'color-mix(in srgb, var(--f-blue) 14%, var(--f-bg-elevated))',
                            border: `1.5px solid ${isSelected ? color : 'var(--f-accent-border)'}`,
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
                              style={{ bottom: `${tickPct}%`, height: 2.5, background: 'var(--f-text)', boxShadow: '0 0 0 1px var(--f-bg-elevated)' }}
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

              {/* Monthly list — same window, most recent first, editable inline */}
              <div className="px-5 pt-2 pb-4 space-y-2">
                {[...windowRows].reverse().map(r => {
                  const key = monthKey(r)
                  const color = statusColor(r.target, r.spent)
                  const pct = r.target > 0 ? Math.min((r.spent / r.target) * 100, 999) : null
                  const isSelected = selectedKey === key
                  const isEditing = editingKey === key

                  return (
                    <div
                      key={key}
                      className="rounded-[14px] px-3.5 py-3 transition-colors"
                      style={{
                        background: isSelected ? `color-mix(in srgb, ${color} 14%, var(--f-bg-elevated))` : 'color-mix(in srgb, var(--f-blue) 14%, var(--f-bg-elevated))',
                        border: `1px solid ${isSelected ? color : 'var(--f-accent-border)'}`,
                      }}
                    >
                      {isEditing ? (
                        <div>
                          <p className="text-[14px] font-bold mb-2" style={{ color: 'var(--f-text)' }}>{MONTHS_ES[r.month - 1]} {r.year}</p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editInput}
                              onChange={e => setEditInput(e.target.value)}
                              placeholder="0.00"
                              autoFocus
                              inputMode="decimal"
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(r) }}
                              className="flex-1 rounded-[10px] px-3 py-2 text-[15px] font-black outline-none tabular-nums"
                              style={{ background: 'var(--f-bg-input)', border: '1px solid rgba(0,122,255,0.4)', color: 'var(--f-text)' }}
                            />
                            <button
                              onClick={() => handleSaveEdit(r)}
                              disabled={isSaving}
                              className="px-3.5 rounded-[10px] text-[14px] font-black text-white disabled:opacity-50"
                              style={{ background: 'var(--f-blue)' }}
                            >
                              {isSaving ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="w-9 rounded-[10px] flex items-center justify-center"
                              style={{ background: 'var(--f-bg-input)' }}
                            >
                              <i className="fa-solid fa-xmark text-sm" style={{ color: 'var(--f-text)' }} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedKey(isSelected ? null : key)}>
                          <div>
                            <p className="text-[14px] font-bold" style={{ color: 'var(--f-text)' }}>{MONTHS_ES[r.month - 1]} {r.year}</p>
                            <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                              {formatCurrency(r.spent, baseCurrency)} {r.target > 0 ? <>de {formatCurrency(r.target, baseCurrency)}</> : <span style={{ color: 'var(--f-text-4)' }}>sin presupuesto</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); startEdit(r) }}
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ background: 'var(--f-bg-input)' }}
                            >
                              <i className="fa-solid fa-pencil text-[11px]" style={{ color: 'var(--f-text-3)' }} />
                            </button>
                            {pct !== null && (
                              <span className="text-[13px] font-black tabular-nums px-2 py-1 rounded-full" style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                                {Math.round(pct)}%
                              </span>
                            )}
                          </div>
                        </div>
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
