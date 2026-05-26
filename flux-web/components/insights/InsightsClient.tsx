'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, getCategoryDisplay, getColor } from '@/lib/utils'
import { MONTHS_ES } from '@/lib/constants'
import type { Transaction, Category } from '@/lib/types'
import { useCountUp, useAnimatedWidth } from '@/lib/hooks'

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <>{formatCurrency(animated)}</>
}

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const w = useAnimatedWidth(pct)
  return (
    <div
      className="h-full rounded-full"
      style={{ width: `${w}%`, background: color, transition: 'width 1500ms cubic-bezier(0.22,1,0.36,1)' }}
    />
  )
}

function GrowBar({ target, color }: { target: number; color: string }) {
  const [h, setH] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setH(target), 100)
    return () => clearTimeout(id)
  }, [target])
  return (
    <div
      className="flex-1 rounded-t-[4px]"
      style={{ height: h, background: color, transition: 'height 1250ms cubic-bezier(0.22,1,0.36,1)' }}
    />
  )
}

interface MonthlyRow { year: number; month: number; income: number; expenses: number }

interface Props {
  transactions: Transaction[]
  categories: Category[]
  monthlySummary: MonthlyRow[]
  year: number
  month: number
}

// ── SVG Donut ──────────────────────────────────────────────────────────────────

function r4(n: number) { return Math.round(n * 10000) / 10000 }
function polarXY(cx: number, cy: number, r: number, angle: number) {
  return { x: r4(cx + r * Math.cos(angle)), y: r4(cy + r * Math.sin(angle)) }
}

function donutPath(cx: number, cy: number, R: number, r: number, start: number, end: number) {
  const s1 = polarXY(cx, cy, R, start)
  const e1 = polarXY(cx, cy, R, end)
  const s2 = polarXY(cx, cy, r, end)
  const e2 = polarXY(cx, cy, r, start)
  const large = end - start > Math.PI ? 1 : 0
  return `M ${s1.x} ${s1.y} A ${R} ${R} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 0 ${e2.x} ${e2.y} Z`
}

function DonutChart({ slices }: { slices: Array<{ label: string; value: number; color: string; pct: number }> }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 100, cy = 100, R = 85, r = 55
  const GAP = 0.015
  let angle = -Math.PI / 2

  const paths = slices.map((s, i) => {
    const sweep = (s.value / total) * (2 * Math.PI) - GAP
    const start = angle + GAP / 2
    const end = start + sweep
    angle += (s.value / total) * (2 * Math.PI)
    return { ...s, path: donutPath(cx, cy, R, r, start, end), i }
  })

  const active = hovered !== null ? slices[hovered] : null

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[240px] h-[240px]">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {paths.map(p => (
            <path
              key={p.i}
              d={p.path}
              fill={p.color}
              opacity={hovered === null || hovered === p.i ? 1 : 0.35}
              className="cursor-pointer transition-opacity duration-150"
              style={{
                transformOrigin: '100px 100px',
                animation: `pie-slice-in 0.65s cubic-bezier(0.16,1,0.3,1) ${p.i * 0.11}s both`,
              }}
              onMouseEnter={() => setHovered(p.i)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(p.i)}
              onTouchEnd={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {active ? (
            <>
              <p className="text-[11px] font-black text-center px-4 leading-tight" style={{ color: active.color }}>{active.label}</p>
              <p className="text-[22px] font-black text-white tabular-nums mt-0.5">{formatCurrency(active.value)}</p>
              <p className="text-[11px] font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>{active.pct.toFixed(1)}%</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Total</p>
              <p className="text-[22px] font-black text-white tabular-nums">{formatCurrency(total)}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function InsightsClient({ transactions, categories, monthlySummary, year, month }: Props) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)
  const [activeScreen, setActiveScreen] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1)

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    router.push(`/insights?year=${y}&month=${m}`)
  }

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    setActiveScreen(Math.round(scrollLeft / clientWidth))
  }, [])

  function scrollToScreen(screen: number) {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: screen * scrollRef.current.clientWidth, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el || activeScreen === 0) return
    requestAnimationFrame(() => {
      el.scrollTo({ left: activeScreen * el.clientWidth, behavior: 'instant' })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const { income, expenses } = useMemo(() => {
    let inc = 0, exp = 0
    for (const t of transactions) {
      if (t.type === 'TR-INGRESO') inc += Number(t.amount)
      else if (t.type === 'TR-GASTO') exp += Number(t.amount)
    }
    return { income: inc, expenses: exp }
  }, [transactions])

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type === 'TR-GASTO' && t.category_id) {
        map[t.category_id] = (map[t.category_id] ?? 0) + Number(t.amount)
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([id, value]) => ({
        id, value,
        color: getColor(catMap[id]?.color_id ?? '').hex,
        pct: expenses > 0 ? (value / expenses) * 100 : 0,
        label: catMap[id]?.name ?? 'Otra',
      }))
  }, [transactions, expenses, catMap])

  const chartSlices = byCategory.slice(0, 8)

  const last6 = useMemo(() => {
    const idx = monthlySummary.findIndex(r => r.year === year && r.month === month)
    const end = idx === -1 ? monthlySummary.length : idx + 1
    return monthlySummary.slice(Math.max(0, end - 6), end)
  }, [monthlySummary, year, month])
  const maxBar = Math.max(...last6.map(r => Math.max(r.income, r.expenses)), 1)

  return (
    <div className="min-h-screen" style={{ background: '#020617' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5 relative"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top))',
          paddingBottom: '1rem',
          background: 'rgba(2,6,23,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <i className="fa-solid fa-chevron-left text-white text-xs" />
          </button>
          <div className="text-center">
            <button
              onClick={() => { setPickerYear(year); setPickerOpen(true) }}
              className="flex items-center gap-1.5 text-[17px] font-black text-white capitalize"
            >
              {MONTHS_ES[month - 1]} {year}
              <i className="fa-solid fa-chevron-down text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
            {!isCurrentMonth && (
              <button onClick={() => router.push('/insights')} className="text-[13px] font-black tracking-[1.2px] block" style={{ color: '#007AFF' }}>
                Mes actual
              </button>
            )}
          </div>
          <button
            onClick={() => navigate(1)}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <i className="fa-solid fa-chevron-right text-white text-xs" />
          </button>
        </div>

        {/* Month/Year Picker dropdown */}
        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div
              className="absolute left-4 right-4 top-full mt-2 rounded-[20px] p-4 z-50"
              style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={e => { e.stopPropagation(); setPickerYear(y => y - 1) }}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <i className="fa-solid fa-chevron-left text-white text-xs" />
                </button>
                <p className="text-[15px] font-black text-white">{pickerYear}</p>
                <button
                  onClick={e => { e.stopPropagation(); setPickerYear(y => y + 1) }}
                  disabled={pickerYear >= now.getFullYear()}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 disabled:opacity-30"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <i className="fa-solid fa-chevron-right text-white text-xs" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS_ES.map((m, i) => {
                  const isSelected = pickerYear === year && (i + 1) === month
                  const isFuture = pickerYear === now.getFullYear() && (i + 1) > now.getMonth() + 1
                  return (
                    <button
                      key={m}
                      disabled={isFuture}
                      onClick={e => {
                        e.stopPropagation()
                        router.push(`/insights?year=${pickerYear}&month=${i + 1}`)
                        setPickerOpen(false)
                      }}
                      className="py-2 rounded-[10px] text-[11px] font-black capitalize transition-all"
                      style={{
                        background: isSelected ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#007AFF' : isFuture ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                        border: isSelected ? '1px solid rgba(0,122,255,0.4)' : '1px solid transparent',
                      }}
                    >
                      {m.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Screen tabs */}
        <div className="flex gap-2 mt-3">
          {(['Categorías', 'Tendencia'] as const).map((label, i) => (
            <button
              key={label}
              onClick={() => scrollToScreen(i)}
              className="flex-1 py-2 rounded-[10px] text-[11px] font-black uppercase tracking-wide transition-all"
              style={{
                background: activeScreen === i ? 'rgba(0,122,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeScreen === i ? '#007AFF' : 'rgba(255,255,255,0.35)',
                border: activeScreen === i ? '1px solid rgba(0,122,255,0.3)' : '1px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Swipeable screens */}
      <div
        ref={scrollRef}
        key={`${year}-${month}`}
        className="flex overflow-x-auto animate-fade-up"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onScroll={handleScroll}
      >

        {/* ── Screen 1: Gastos por categoría ── */}
        <div className="flex-shrink-0 w-full px-4 py-4 space-y-4" style={{ scrollSnapAlign: 'start' }}>

          {/* Donut chart */}
          {byCategory.length > 0 ? (
            <div className="py-2 animate-scale-in">
              <p className="text-[10px] font-black tracking-[3px] uppercase mb-4 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Gastos por categoría
              </p>
              <DonutChart slices={chartSlices} />
            </div>
          ) : (
            <div className="rounded-[20px] p-10 text-center" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="fa-solid fa-chart-pie text-4xl mb-3 block" style={{ color: 'rgba(255,255,255,0.15)' }} />
              <p className="text-[13px] font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Sin gastos este mes</p>
            </div>
          )}

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="rounded-[20px] p-5 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', animationDelay: '0.06s' }}>
              <p className="text-[10px] font-black tracking-[3px] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Desglose
              </p>
              <div className="space-y-4">
                {byCategory.map((item, i) => {
                  const d = getCategoryDisplay(catMap[item.id])
                  return (
                    <div key={item.id} className="animate-spring-in" style={{ animationDelay: `${i * 0.055}s` }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                          <i className={`${d.icon} ${d.color} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[15px] font-bold text-white truncate">{d.name}</span>
                            <span className="text-[15px] font-black tabular-nums ml-3 flex-shrink-0" style={{ color: 'white' }}>
                              {formatCurrency(item.value)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <AnimatedBar pct={item.pct} color="#007AFF" />
                            </div>
                            <span className="text-[11px] font-black tabular-nums flex-shrink-0" style={{ color: '#007AFF', minWidth: '2.5rem', textAlign: 'right' }}>
                              {item.pct.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {i < byCategory.length - 1 && (
                        <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', marginLeft: '52px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="h-24" />
        </div>

        {/* ── Screen 2: Tendencia ── */}
        <div className="flex-shrink-0 w-full px-4 py-4 space-y-4" style={{ scrollSnapAlign: 'start' }}>

          {/* Income / Expense summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] p-4 animate-fade-up" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
              <p className="text-[9px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'rgba(48,209,88,0.7)' }}>Ingresos</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#30D158' }}>
                +<AnimatedCurrency value={income} />
              </p>
            </div>
            <div className="rounded-[20px] p-4 animate-fade-up" style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)', animationDelay: '0.05s' }}>
              <p className="text-[9px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'rgba(255,69,58,0.7)' }}>Gastos</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#FF453A' }}>
                -<AnimatedCurrency value={expenses} />
              </p>
            </div>
          </div>

          {/* KPI strip */}
          {expenses > 0 && (() => {
            const now2 = new Date()
            const daysInMonth = new Date(now2.getFullYear(), now2.getMonth() + 1, 0).getDate()
            const daysPassed = isCurrentMonth ? now2.getDate() : daysInMonth
            const burnRate = daysPassed > 0 ? expenses / daysPassed : 0
            const netFlow = income - expenses
            const avgExpenses = monthlySummary.length > 0
              ? monthlySummary.reduce((s, r) => s + r.expenses, 0) / monthlySummary.length
              : expenses
            const saveRate = income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0
            const kpis = [
              { label: 'Tasa de Gasto', value: formatCurrency(burnRate), sub: 'por día', color: '#FF8A80' },
              { label: 'Flujo Neto', value: (netFlow >= 0 ? '+' : '') + formatCurrency(netFlow), sub: 'este mes', color: netFlow >= 0 ? '#30D158' : '#FF453A' },
              { label: 'Prom. Mensual', value: formatCurrency(avgExpenses), sub: 'de gasto', color: '#64D2FF' },
              { label: 'Tasa de Ahorro', value: `${saveRate.toFixed(0)}%`, sub: 'de ingresos', color: '#BF5AF2' },
            ]
            return (
              <div className="grid grid-cols-2 gap-2">
                {kpis.map((k, i) => (
                  <div key={k.label} className="rounded-[16px] px-4 py-2 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.07)', animationDelay: `${0.06 + i * 0.04}s` }}>
                    <p className="text-[10px] font-black tracking-[2px] uppercase mt-0.5 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{k.label}</p>
                    <p className="text-[23px] font-black tabular-nums leading-none" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-[12px] font-black tracking-[0.5px] mt-0.5 mb-0" style={{ color: 'white' }}>{k.sub}</p>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* 6-month trend bars */}
          {last6.length > 1 && (
            <div className="rounded-[20px] p-5 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)', animationDelay: '0.08s' }}>
              <p className="text-[11px] font-black tracking-[3px] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tendencia
              </p>
              <div className="flex items-end justify-between gap-1.5" style={{ height: 100 }}>
                {last6.map((row, i) => {
                  const incH = Math.round((row.income / maxBar) * 92)
                  const expH = Math.round((row.expenses / maxBar) * 92)
                  const isCurrent = row.year === year && row.month === month
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end gap-0.5" style={{ height: 92 }}>
                        <GrowBar target={incH} color={isCurrent ? '#30D158' : 'rgba(48,209,88,0.4)'} />
                        <GrowBar target={expH} color={isCurrent ? '#FF453A' : 'rgba(255,69,58,0.4)'} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-center" style={{ color: isCurrent ? 'white' : 'rgba(255,255,255,0.3)' }}>
                        {MONTHS_ES[row.month - 1].slice(0, 3)} {row.year.toString().slice(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#30D158' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#FF453A' }} />
                  <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Gastos</span>
                </div>
              </div>
            </div>
          )}

          <div className="h-24" />
        </div>
      </div>
    </div>
  )
}
