'use client'

import { useState, useMemo, useTransition, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { toast } from 'sonner'
import { formatCurrency, getCategoryDisplay, getPaymentMethod } from '@/lib/utils'
import { MONTHS_ES } from '@/lib/constants'
import { saveBudget, chargeScheduled, saveCreditPayment, deleteCreditPayment } from '@/actions/config'
import type { AccountWithBalance, Transaction, Category, ScheduledTransaction, Budget, CreditPayment } from '@/lib/types'
import AuditModal from './AuditModal'
import { useCountUp, useAnimatedWidth } from '@/lib/hooks'
import NotificationBell from '@/components/notifications/NotificationBell'
import CoachMarkTour from '@/components/onboarding/CoachMarkTour'
import { createClient } from '@/lib/supabase/client'

// Days from the earliest loaded date before we start fetching the previous batch
const LAZY_THRESHOLD_DAYS = 14

function AnimatedCurrency({ value, currency = 'MXN', duration }: { value: number; currency?: string; duration?: number }) {
  const animated = useCountUp(value, duration)
  return (
    <span className="inline-flex items-baseline gap-0.5 max-w-full overflow-hidden">
      <span className="tabular-nums min-w-0 overflow-hidden">{formatCurrency(animated, currency)}</span>
      <span className="text-[10px] font-bold opacity-40 flex-shrink-0">{currency}</span>
    </span>
  )
}

function FitBalance({ value, currency, textColor }: { value: number; currency: string; textColor: string }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const animated = useCountUp(value, 900)

  useLayoutEffect(() => {
    const c = containerRef.current
    const t = textRef.current
    if (!c || !t) return
    t.style.transform = 'scale(1)'
    const scale = Math.min(1, c.clientWidth / t.scrollWidth)
    t.style.transform = scale < 1 ? `scale(${scale})` : 'none'
    t.style.transformOrigin = 'left center'
  }, [animated, currency])

  return (
    <span ref={containerRef} className="block w-full overflow-hidden">
      <span ref={textRef} className="inline-flex items-baseline gap-0.5 whitespace-nowrap" style={{ color: textColor }}>
        <span className="text-[22px] font-black tabular-nums leading-none">{formatCurrency(animated, currency)}</span>
        <span className="text-[10px] font-bold opacity-40">{currency}</span>
      </span>
    </span>
  )
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


const PM_CARDS: Record<string, { bg: string; shadow: string }> = {
  'MP-EFECTIVO': { bg: 'linear-gradient(135deg, var(--f-cash) 0%, var(--f-cash) 100%)', shadow: 'var(--f-shadow-income)' },
  'MP-TDD': { bg: 'linear-gradient(135deg, var(--f-debit) 0%, var(--f-debit) 100%)', shadow: 'var(--f-shadow-accent)' },
  'MP-TDC': { bg: 'linear-gradient(135deg, var(--f-credit) 0%, var(--f-credit) 100%)', shadow: 'var(--f-shadow-expense)' },
}

interface Props {
  user: { id: string; email: string; full_name: string | null }
  accounts: AccountWithBalance[]
  transactions: Transaction[]
  loadedFrom: string   // 'YYYY-MM-DD' — earliest date in the initial server fetch
  categories: Category[]
  scheduled: ScheduledTransaction[]
  budget: Budget | null
  creditPayments: CreditPayment[]
  baseCurrency?: string
  year: number
  month: number
  onRefresh?: () => void
}

export default function DashboardClient({ user, accounts, transactions, loadedFrom, categories, scheduled, budget, creditPayments, baseCurrency = 'MXN', year, month, onRefresh }: Props) {
  const [spendView, setSpendView] = useState<'daily' | 'weekly'>('daily')
  const [dayOffset, setDayOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)

  // ── Lazy historical loading ──────────────────────────────────────────────────
  // `transactions` prop always has fresh server data for the current window.
  // `historyTxs` holds extra batches loaded client-side while navigating backwards.
  // They're merged (deduped) so server rerenders don't overwrite historical data.
  const [historyTxs, setHistoryTxs] = useState<Transaction[]>([])
  const earliestLoadedRef = useRef<string>(loadedFrom)
  const isFetchingMoreRef = useRef(false)
  const supabase = useRef(createClient()).current

  const txList = useMemo(() => {
    if (historyTxs.length === 0) return transactions
    const ids = new Set(transactions.map(t => t.id))
    return [...transactions, ...historyTxs.filter(t => !ids.has(t.id))]
  }, [transactions, historyTxs])

  useEffect(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    let viewDate: Date
    if (spendView === 'daily') {
      viewDate = new Date(now)
      viewDate.setDate(now.getDate() + dayOffset)
    } else {
      const dow = now.getDay()
      const daysBack = dow === 0 ? 6 : dow - 1
      viewDate = new Date(now)
      viewDate.setDate(now.getDate() - daysBack + weekOffset * 7)
    }

    const earliest = earliestLoadedRef.current
    if (earliest === '1900-01-01') return  // nothing older to load

    const earliestTime = new Date(earliest + 'T12:00:00').getTime()
    const viewTime = viewDate.getTime()
    const daysDiff = Math.floor((earliestTime - viewTime) / 86_400_000)

    if (daysDiff < LAZY_THRESHOLD_DAYS && !isFetchingMoreRef.current) {
      isFetchingMoreRef.current = true

      const toDate = new Date(earliest + 'T00:00:00')
      toDate.setDate(toDate.getDate() - 1)
      const fromDate = new Date(toDate)
      fromDate.setMonth(fromDate.getMonth() - 2)

      const newFrom = fromDate.toLocaleDateString('en-CA')
      const newTo = toDate.toLocaleDateString('en-CA')

      supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', newFrom)
        .lte('transaction_date', newTo)
        .order('transaction_date', { ascending: false })
        .then(({ data }) => {
          if (!data || data.length === 0) {
            earliestLoadedRef.current = '1900-01-01'
          } else {
            setHistoryTxs(prev => {
              const ids = new Set(prev.map(t => t.id))
              return [...prev, ...(data as Transaction[]).filter(t => !ids.has(t.id))]
            })
            earliestLoadedRef.current = newFrom
          }
          isFetchingMoreRef.current = false
        })
    }
  }, [dayOffset, weekOffset, spendView, supabase])
  const [budgetEditOpen, setBudgetEditOpen] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')
  const [auditOpen, setAuditOpen] = useState(false)
  const [isBudgetPending, startBudget] = useTransition()
  const [scheduledAction, setScheduledAction] = useState<{ id: string; name: string; amount: number; type: string } | null>(null)
  const [isChargePending, startCharge] = useTransition()

  // TDC payment modal state
  const [tdcModal, setTdcModal] = useState<AccountWithBalance | null>(null)
  const [tdcAmount, setTdcAmount] = useState('')
  const [tdcPayType, setTdcPayType] = useState<'transfer' | 'deposit'>('transfer')
  const [tdcSource, setTdcSource] = useState('')
  const [isTdcPending, startTdc] = useTransition()
  const [isSkipPending, startSkip] = useTransition()

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const isMultiCurrency = useMemo(() => accounts.some(a => (a.currency ?? 'MXN') !== baseCurrency), [accounts, baseCurrency])
  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance * (a.display_exchange_rate ?? 1), 0),
    [accounts],
  )

  const creditPayMap = useMemo(() => Object.fromEntries(creditPayments.map(p => [p.account_id, p])), [creditPayments])
  const nonTdcAccounts = useMemo(() => accounts.filter(a => a.payment_method_id !== 'MP-TDC'), [accounts])
  // Show only unpaid TDC cards, sorted by payment_day ascending (overdue first)
  const creditCards = useMemo(() =>
    accounts
      .filter(a => a.payment_method_id === 'MP-TDC' && !creditPayMap[a.id])
      .sort((a, b) => (a.payment_day ?? 99) - (b.payment_day ?? 99)),
    [accounts, creditPayMap])

  const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`

  // Returns the budget-effective amount for a transaction, respecting exclude_mode
  function effectiveExpenseAmount(t: Transaction): number {
    if (t.exclude_mode === 'all') return 0
    if (t.exclude_mode === 'shared_only' && t.split_data) {
      const othersTotal = t.split_data.data.reduce((s, d) => s + d.value, 0)
      return Math.max(0, Number(t.amount) - othersTotal)
    }
    return Number(t.amount)
  }

  const monthExpenses = useMemo(
    () => txList
      .filter(t => t.type === 'TR-GASTO' && t.transaction_date.slice(0, 7) === currentMonthStr)
      .reduce((s, t) => s + effectiveExpenseAmount(t) * (t.exchange_rate ?? 1), 0),
    [txList, currentMonthStr],
  )

  const targetDay = useMemo(() => {
    const base = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    base.setDate(base.getDate() + dayOffset)
    return base
  }, [dayOffset])

  const targetWeekRange = useMemo(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const dow = now.getDay()
    const daysBack = dow === 0 ? 6 : dow - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - daysBack + weekOffset * 7)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { monday, sunday }
  }, [weekOffset])

  const dailySpend = useMemo(() => {
    const dayStr = targetDay.toLocaleDateString('en-CA')
    return txList
      .filter(t => t.type === 'TR-GASTO' && t.transaction_date.startsWith(dayStr))
      .reduce((s, t) => s + effectiveExpenseAmount(t), 0)
  }, [txList, targetDay])

  const weeklySpend = useMemo(() => {
    const mondayStr = targetWeekRange.monday.toLocaleDateString('en-CA')
    const sundayStr = targetWeekRange.sunday.toLocaleDateString('en-CA')
    return txList
      .filter(t => {
        if (t.type !== 'TR-GASTO') return false
        const d = t.transaction_date.slice(0, 10)
        return d >= mondayStr && d <= sundayStr
      })
      .reduce((s, t) => s + effectiveExpenseAmount(t), 0)
  }, [txList, targetWeekRange])

  const dayLabel = useMemo(() => {
    if (dayOffset === 0) return 'Hoy'
    if (dayOffset === -1) return 'Ayer'
    return targetDay.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  }, [dayOffset, targetDay])

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return 'Esta semana'
    const { monday, sunday } = targetWeekRange
    return `${monday.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}–${sunday.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
  }, [weekOffset, targetWeekRange])

  const budgetAmount = budget?.amount ?? 0
  const budgetPct = budgetAmount > 0 ? Math.min((monthExpenses / budgetAmount) * 100, 100) : 0
  const budgetOver = budgetAmount > 0 && monthExpenses > budgetAmount
  const budgetLeft = budgetAmount - monthExpenses

  const userName = user.full_name?.split(' ')[0] ?? user.email.split('@')[0]

  function handleChargeScheduled(id: string, skip: boolean) {
    startCharge(async () => {
      const res = await chargeScheduled(id, skip)
      if (res.error) { toast.error(res.error); return }
      toast.success(skip ? 'Ciclo omitido' : 'Pago registrado')
      setScheduledAction(null)
    })
  }

  function handleSaveBudget() {
    const amount = parseFloat(budgetInput)
    if (isNaN(amount) || amount < 0) { toast.error('Monto inválido'); return }
    startBudget(async () => {
      const res = await saveBudget(amount, year, month)
      if (res.error) { toast.error(res.error); return }
      toast.success('Presupuesto guardado')
      setBudgetEditOpen(false)
    })
  }

  function openTdcModal(acc: AccountWithBalance) {
    const existing = creditPayMap[acc.id]
    setTdcAmount(existing ? String(existing.amount) : '')
    setTdcPayType(existing?.payment_type ?? 'transfer')
    setTdcSource(existing?.source_account_id ?? nonTdcAccounts[0]?.id ?? '')
    setTdcModal(acc)
  }

  function handleSaveTdc() {
    const amt = parseFloat(tdcAmount)
    if (!tdcModal || isNaN(amt) || amt <= 0) { toast.error('Ingresa un monto válido'); return }
    if (tdcPayType === 'transfer' && !tdcSource) { toast.error('Selecciona la cuenta origen'); return }
    startTdc(async () => {
      const res = await saveCreditPayment({
        account_id: tdcModal.id,
        year,
        month,
        amount: amt,
        payment_type: tdcPayType,
        source_account_id: tdcPayType === 'transfer' ? tdcSource : null,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Pago registrado')
      setTdcModal(null)
      onRefresh?.()
    })
  }

  function handleDeleteTdc() {
    if (!tdcModal) return
    startTdc(async () => {
      const res = await deleteCreditPayment(tdcModal.id, year, month)
      if (res.error) { toast.error(res.error); return }
      toast.success('Pago removido')
      setTdcModal(null)
      onRefresh?.()
    })
  }

  function handleSkipTdc() {
    if (!tdcModal) return
    startSkip(async () => {
      const res = await saveCreditPayment({
        account_id: tdcModal.id,
        year, month,
        amount: 0,
        payment_type: 'deposit',
        source_account_id: null,
      })
      if (res.error) { toast.error(res.error); return }
      toast.success('Ciclo omitido')
      setTdcModal(null)
      onRefresh?.()
    })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--f-bg)' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top))',
          paddingBottom: '1rem',
          background: 'var(--f-bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Link
              href="/settings"
              className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 mt-0.5 active:scale-90 transition-transform"
              style={{ background: 'var(--f-bg-input)' }}
            >
              <i className="fa-solid fa-bars" style={{ color: 'var(--f-text-3)', fontSize: 16 }} />
            </Link>
            <div>
              <p className="text-[12px] font-black tracking-[3px] uppercase" style={{ color: 'var(--f-text-3)' }}>
                {MONTHS_ES[month - 1].toUpperCase()} {year}
              </p>
              <h1 className="text-[22px] font-black leading-tight mt-0.5" style={{ color: 'var(--f-text)' }}>
                Hola, {userName}
              </h1>
            </div>
          </div>
          <div data-coach="home-bell"><NotificationBell /></div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-7 max-w-lg mx-auto pb-32">

        {/* Balance card */}
        <div
          data-coach="home-balance"
          className="rounded-[28px] p-6 animate-fade-up"
          style={{ background: 'var(--f-blue)', boxShadow: 'var(--f-shadow-accent)' }}
        >
          <p className="text-[12px] font-black tracking-[3px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {isMultiCurrency ? `Saldo en ${baseCurrency}` : 'Saldo actual'}
          </p>
          <p className="text-[48px] font-black text-white leading-none tracking-tight tabular-nums">

            <AnimatedCurrency value={totalBalance} currency={baseCurrency} />
          </p>
        </div>

        {/* Budget — always visible, editable inline */}
        <div
          data-coach="home-budget"
          className="rounded-[20px] p-4 animate-fade-up overflow-hidden relative"
          style={{
            background: budgetAmount > 0
              ? budgetOver
                ? 'linear-gradient(135deg, var(--f-expense-bg) 0%, transparent 100%)'
                : 'linear-gradient(135deg, var(--f-accent-bg) 0%, transparent 100%)'
              : 'var(--f-bg-card)',
            border: budgetAmount > 0
              ? budgetOver ? '1px solid var(--f-expense-border)' : '1px solid var(--f-accent-border)'
              : '1px solid var(--f-line)',
            animationDelay: '0.04s',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-black tracking-[1.5px] uppercase" style={{ color: 'var(--f-text-3)' }}>
                Presupuesto del mes
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!budgetEditOpen && (
                <button
                  onClick={() => { setBudgetInput(budgetAmount > 0 ? String(budgetAmount) : ''); setBudgetEditOpen(true) }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--f-bg-input)' }}
                >
                  <i className="fa-solid fa-pencil text-[12px]" style={{ color: 'var(--f-text)' }} />
                </button>
              )}
            </div>
          </div>

          {budgetEditOpen ? (
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="flex-1 rounded-[12px] px-3 py-2.5 text-[17px] font-black outline-none tabular-nums"
                style={{ background: 'var(--f-bg-input)', border: '1px solid rgba(0,122,255,0.4)', color: 'var(--f-text)' }}
                inputMode="decimal"
                onKeyDown={e => { if (e.key === 'Enter') handleSaveBudget() }}
              />
              <button
                onClick={handleSaveBudget}
                disabled={isBudgetPending}
                className="px-4 rounded-[12px] text-[15px] font-black text-white disabled:opacity-50"
                style={{ background: 'var(--f-blue)' }}
              >
                {isBudgetPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
              </button>
              <button
                onClick={() => setBudgetEditOpen(false)}
                className="w-10 rounded-[12px] flex items-center justify-center"
                style={{ background: 'var(--f-bg-input)' }}
              >
                <i className="fa-solid fa-xmark text-sm" style={{ color: 'var(--f-text)' }} />
              </button>
            </div>
          ) : budgetAmount > 0 ? (
            <>
              <p className="text-[28px] font-black tabular-nums leading-none mb-1" style={{ color: 'var(--f-text)' }}>
                <AnimatedCurrency value={monthExpenses} currency={baseCurrency} />
              </p>
              <p className="text-[13px] font-semibold mb-2 tabular-nums" style={{ color: 'var(--f-text-3)' }}>
                de {formatCurrency(budgetAmount, baseCurrency)} <span className="text-[10px] font-bold opacity-40">{baseCurrency}</span>&nbsp;&nbsp;·&nbsp;&nbsp;
                <span style={{ color: budgetOver ? 'var(--f-expense)' : budgetLeft < budgetAmount * 0.20 ? 'var(--f-credit)' : 'var(--f-income)' }}>
                  {budgetOver ? <>excedido {formatCurrency(Math.abs(budgetLeft), baseCurrency)} <span className="text-[10px] font-bold opacity-40">{baseCurrency}</span></> : <>te quedan {formatCurrency(budgetLeft, baseCurrency)} <span className="text-[10px] font-bold opacity-40">{baseCurrency}</span></>}
                </span>
              </p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--f-bg-input)' }}>
                <AnimatedBar pct={budgetPct} color={budgetOver ? 'var(--f-expense)' : budgetLeft < budgetAmount * 0.20 ? 'var(--f-credit)' : 'var(--f-income)'} />
              </div>
            </>
          ) : (
            <p className="text-[14px] font-bold" style={{ color: 'var(--f-text-4)' }}>
              Sin presupuesto — toca el lápiz para configurar
            </p>
          )}
        </div>

        {/* Daily / Weekly spend — arrows beside the amount */}
        <div
          data-coach="home-daily"
          className="rounded-[20px] overflow-hidden animate-fade-up"
          style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', animationDelay: '0.06s' }}
        >
          <div className="flex" style={{ borderBottom: '1px solid var(--f-line)' }}>
            {(['daily', 'weekly'] as const).map(v => (
              <button
                key={v}
                onClick={() => setSpendView(v)}
                className="flex-1 py-2.5 text-[13px] font-black tracking-[1px] uppercase transition-all active:scale-95"
                style={spendView === v
                  ? { background: 'var(--f-blue)', color: '#fff' }
                  : { background: 'transparent', color: 'var(--f-text-3)' }
                }
              >
                {v === 'daily' ? 'Hoy' : 'Semana'}
              </button>
            ))}
          </div>
          <div className="px-5 py-4">
            <p className="text-center text-[13px] font-bold capitalize mb-3" style={{ color: 'var(--f-text-3)' }}>
              {spendView === 'daily' ? dayLabel : weekLabel}
            </p>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => spendView === 'daily' ? setDayOffset(o => o - 1) : setWeekOffset(o => o - 1)}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                style={{ background: 'var(--f-bg-input)' }}
              >
                <i className="fa-solid fa-chevron-left text-xs" style={{ color: 'var(--f-text)' }} />
              </button>
              <p className="text-[38px] font-black leading-none tabular-nums flex-1 text-center" style={{ color: 'var(--f-text)' }}>
                <AnimatedCurrency value={spendView === 'daily' ? dailySpend : weeklySpend} currency={baseCurrency} duration={100} />
              </p>
              <button
                onClick={() => spendView === 'daily' ? setDayOffset(o => o + 1) : setWeekOffset(o => o + 1)}
                disabled={spendView === 'daily' ? dayOffset >= 0 : weekOffset >= 0}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 flex-shrink-0"
                style={{ background: 'var(--f-bg-input)' }}
              >
                <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--f-text)' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming scheduled — empty state */}
        {scheduled.length === 0 && (
          <div
            className="rounded-[20px] p-5 animate-fade-up flex flex-col items-center gap-3 text-center"
            style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', animationDelay: '0.08s' }}
          >
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center" style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.2)' }}>
              <i className="fa-solid fa-arrows-rotate text-lg" style={{ color: 'var(--f-blue)' }} />
            </div>
            <div>
              <p className="text-[14px] font-black" style={{ color: 'var(--f-text)' }}>Sin recurrentes registrados</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--f-text-3)' }}>Registra tus suscripciones y cobros fijos para darles seguimiento aquí.</p>
            </div>
            <a
              href="/settings?section=planificados"
              className="px-4 py-2 rounded-[10px] text-[13px] font-black transition-all active:scale-95"
              style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)', border: '1px solid var(--f-accent-border)' }}
            >
              Agregar recurrente
            </a>
          </div>
        )}

        {/* Upcoming scheduled */}
        {scheduled.length > 0 && (() => {
          const now2 = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
          const cy = now2.getFullYear(), cm = now2.getMonth() + 1

          const isPaidThisMonth = (s: ScheduledTransaction) => {
            if (!s.last_charge_date) return false
            const d = new Date(s.last_charge_date + 'T12:00:00')
            return d.getFullYear() === cy && d.getMonth() + 1 === cm
          }

          const isPendingThisMonth = (s: ScheduledTransaction) => {
            if (!s.next_charge_date) return false
            const d = new Date(s.next_charge_date + 'T12:00:00')
            return d.getFullYear() === cy && d.getMonth() + 1 === cm
          }

          const isThisMonthItem = (s: ScheduledTransaction) => isPaidThisMonth(s) || isPendingThisMonth(s)

          const monthOccurrences = (s: ScheduledTransaction) =>
            (isPaidThisMonth(s) ? 1 : 0) + (isPendingThisMonth(s) ? 1 : 0)

          const toBase = (s: ScheduledTransaction) =>
            accounts.find(a => a.id === s.account_id)?.display_exchange_rate ?? 1

          const activeExpenses = scheduled.filter(s => s.status === 'ACTIVO' && s.type === 'TR-GASTO' && isThisMonthItem(s))
          const totalExpenses = activeExpenses.reduce((sum, s) => sum + Number(s.amount) * monthOccurrences(s) * toBase(s), 0)
          const paidExpenses = activeExpenses.filter(isPaidThisMonth).reduce((sum, s) => sum + Number(s.amount) * toBase(s), 0)
          const expensePct = totalExpenses > 0 ? Math.min((paidExpenses / totalExpenses) * 100, 100) : 0

          const activeIncomes = scheduled.filter(s => s.status === 'ACTIVO' && s.type === 'TR-INGRESO' && isThisMonthItem(s))
          const totalIncomes = activeIncomes.reduce((sum, s) => sum + Number(s.amount) * monthOccurrences(s) * toBase(s), 0)
          const receivedIncomes = activeIncomes.filter(isPaidThisMonth).reduce((sum, s) => sum + Number(s.amount) * toBase(s), 0)
          const incomePct = totalIncomes > 0 ? Math.min((receivedIncomes / totalIncomes) * 100, 100) : 0

          const upcomingList = scheduled
            .filter(s => s.status === 'ACTIVO' && isPendingThisMonth(s))
            .sort((a, b) => a.next_charge_date!.localeCompare(b.next_charge_date!))
            .slice(0, 5)

          return (
            <div
              data-coach="home-recurring"
              className="rounded-[20px] p-4 animate-fade-up"
              style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', animationDelay: '0.08s' }}
            >
              <p className="text-[13px] font-black tracking-[3px] uppercase mb-4" style={{ color: 'var(--f-text-3)' }}>
                Próximos recurrentes
              </p>

              {(totalIncomes > 0 || totalExpenses > 0) && (
                <div className="space-y-3 mb-1">
                  {totalIncomes > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-black tracking-[2px] uppercase" style={{ color: 'var(--f-income)' }}>Ingresos</p>
                        <p className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--f-text-3)' }}>
                          {formatCurrency(receivedIncomes, baseCurrency)} / {formatCurrency(totalIncomes, baseCurrency)} <span className="text-[9px] font-bold opacity-40">{baseCurrency}</span>
                        </p>
                      </div>
                      <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--f-bg-input)' }}>
                        <AnimatedBar pct={incomePct} color="var(--f-income)" />
                      </div>
                    </div>
                  )}
                  {totalExpenses > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-black tracking-[2px] uppercase" style={{ color: 'var(--f-expense)' }}>Gastos</p>
                        <p className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--f-text-3)' }}>
                          {formatCurrency(paidExpenses, baseCurrency)} / {formatCurrency(totalExpenses, baseCurrency)} <span className="text-[9px] font-bold opacity-40">{baseCurrency}</span>
                        </p>
                      </div>
                      <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--f-bg-input)' }}>
                        <AnimatedBar pct={expensePct} color="var(--f-expense)" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(totalExpenses > 0 || totalIncomes > 0) && upcomingList.length > 0 && (
                <div className="h-px my-4" style={{ background: 'var(--f-line)' }} />
              )}

              <div className="space-y-3">
                {upcomingList.map((s, i) => {
                  const cat = catMap[s.category_id ?? '']
                  const d = getCategoryDisplay(cat)
                  const isExpense = s.type === 'TR-GASTO'
                  const isIncome = s.type === 'TR-INGRESO'
                  const amtColor = isExpense ? 'var(--f-expense)' : isIncome ? 'var(--f-income)' : 'var(--f-transfer)'
                  return (
                    <button
                      key={s.id}
                      className="w-full flex items-center gap-3 active:scale-[0.98] transition-transform text-left animate-spring-in"
                      style={{ animationDelay: `${i * 0.06}s` }}
                      onClick={() => setScheduledAction({ id: s.id, name: s.name, amount: Number(s.amount), type: s.type })}
                    >
                      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                        <i className={`${d.icon} ${d.color} text-xs`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{s.name}</p>
                        <p className="text-[13px]" style={{ color: 'var(--f-text-3)' }}>
                          {s.next_charge_date ? (() => {
                            const _d = new Date(s.next_charge_date + 'T12:00:00')
                            const _days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                            return `${_days[_d.getDay()]}, ${_d.getDate()}`
                          })() : 'Pendiente'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="text-[15px] font-black tabular-nums" style={{ color: amtColor }}>
                          {isIncome ? '+' : isExpense ? '−' : ''}{formatCurrency(Number(s.amount), accounts.find(a => a.id === s.account_id)?.currency ?? baseCurrency)} <span className="text-[9px] font-bold opacity-40">{accounts.find(a => a.id === s.account_id)?.currency ?? baseCurrency}</span>
                        </p>
                        <i className="fa-solid fa-chevron-right text-[11px]" style={{ color: 'var(--f-text-4)' }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Accounts grid — gradient tinted cards */}
        <div data-coach="home-accounts" className="animate-fade-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-black tracking-[3px] uppercase" style={{ color: 'var(--f-text-3)' }}>
              Estado de cuentas
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/settings?section=cuentas"
                className="flex items-center justify-center w-9 h-9 rounded-[10px] active:scale-95 transition-transform"
                style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)', border: '1px solid var(--f-accent-border)' }}
              >
                <i className="fa-solid fa-plus text-[13px]" />
              </Link>
              <button
                onClick={() => setAuditOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[13px] font-black uppercase tracking-wide active:scale-95 transition-transform"
                style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)', border: '1px solid var(--f-accent-border)' }}
              >
                <i className="fa-solid fa-sliders text-[12px]" />
                Auditar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {accounts.map((acc, i) => {
              const card = PM_CARDS[acc.payment_method_id] ?? PM_CARDS['MP-TDD']
              const method = getPaymentMethod(acc.payment_method_id)
              return (
                <div
                  key={acc.id}
                  className="relative rounded-[18px] p-4 overflow-hidden animate-fade-up"
                  style={{ background: card.bg, boxShadow: card.shadow, animationDelay: `${0.14 + i * 0.04}s` }}
                >
                  <i className={`${method.icon} text-xs absolute top-4 right-4`} style={{ color: acc.balance < 0 ? '#2b2b2b' : '#f3f3f3' }} />
                  <p className="text-[9.5px] font-black tracking-[1.5px] uppercase leading-tight mb-3 pr-6 line-clamp-2" style={{ color: acc.balance < 0 ? '#2b2b2b' : '#f3f3f3' }}>
                    {acc.name}
                  </p>
                  <FitBalance
                    value={acc.balance}
                    currency={acc.currency ?? baseCurrency}
                    textColor={acc.balance < 0 ? '#2b2b2b' : 'white'}
                  />
                  {(acc.currency ?? 'MXN') !== baseCurrency && (
                    <p className="text-[10px] font-bold mt-1 tabular-nums" style={{ color: acc.balance < 0 ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)' }}>
                      ≈ {formatCurrency(acc.balance * (acc.display_exchange_rate ?? 1), baseCurrency)} {baseCurrency}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Credit card payments section */}
        {creditCards.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.16s' }}>
            <p className="text-[12px] font-black tracking-[3px] uppercase mb-3" style={{ color: 'var(--f-text-3)' }}>
              Pagos TDC
            </p>
            <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
              {creditCards.map((acc, i) => {
                const payment = creditPayMap[acc.id]
                const isPaid = !!payment
                const isSkipped = isPaid && payment.amount === 0
                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
                const dueDay = acc.payment_day
                const diffDays = dueDay != null
                  ? Math.ceil((new Date(year, month - 1, dueDay).getTime() - now.getTime()) / 86400000)
                  : null
                const isOverdue = diffDays !== null && diffDays < 0 && !isPaid
                const sourceAcc = payment?.source_account_id ? accounts.find(a => a.id === payment.source_account_id) : null

                return (
                  <button
                    key={acc.id}
                    onClick={() => openTdcModal(acc)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-80 active:scale-[0.99] transition-all text-left"
                    style={i > 0 ? { borderTop: '1px solid var(--f-line-faint)' } : {}}
                  >
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isSkipped
                          ? 'var(--f-transfer-bg)'
                          : isPaid
                            ? 'var(--f-income-bg)'
                            : isOverdue ? 'var(--f-expense-bg)' : 'rgba(255,138,128,0.15)',
                      }}
                    >
                      <i
                        className={isSkipped ? 'fa-solid fa-forward' : isPaid ? 'fa-solid fa-check' : 'fa-regular fa-credit-card'}
                        style={{
                          fontSize: 14,
                          color: isSkipped ? 'var(--f-transfer)' : isPaid ? 'var(--f-income)' : isOverdue ? 'var(--f-expense)' : 'var(--f-credit)',
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{acc.name}</p>
                      {isSkipped ? (
                        <p className="text-[13px]" style={{ color: 'var(--f-transfer)' }}>Omitido este mes</p>
                      ) : isPaid ? (
                        <p className="text-[13px] truncate" style={{ color: 'var(--f-income)' }}>
                          {formatCurrency(payment.amount)} · {payment.payment_type === 'transfer'
                            ? (sourceAcc ? `de ${sourceAcc.name}` : 'Transferencia')
                            : 'Depósito directo'}
                        </p>
                      ) : (
                        <p className="text-[13px]" style={{ color: isOverdue ? 'var(--f-expense)' : 'var(--f-text-3)' }}>
                          {dueDay != null
                            ? isOverdue
                              ? `Venció el día ${dueDay}`
                              : diffDays === 0
                                ? 'Vence hoy'
                                : `Vence en ${diffDays} día${diffDays === 1 ? '' : 's'}`
                            : 'Sin fecha de vencimiento'}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isPaid ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-[12px] font-black"
                          style={{ background: 'var(--f-income-bg)', color: 'var(--f-income)' }}
                        >
                          Pagado
                        </span>
                      ) : (
                        <span
                          className="px-2.5 py-1 rounded-full text-[12px] font-black"
                          style={{
                            background: isOverdue ? 'var(--f-expense-bg)' : 'var(--f-accent-bg)',
                            color: isOverdue ? 'var(--f-expense)' : 'var(--f-blue)',
                          }}
                        >
                          {isOverdue ? 'Vencido' : 'Pagar'}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {scheduledAction && createPortal(
        <>
          <div className="fixed inset-0 z-[200] bg-black/60 animate-fade-in" onClick={() => setScheduledAction(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[200] rounded-t-[28px] px-5 pt-5 animate-slide-up"
            style={{ background: 'var(--f-bg-elevated)', paddingBottom: 'calc(2rem + var(--safe-bottom))' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 min-w-0">
                <p className="text-[19px] font-black truncate" style={{ color: 'var(--f-text)' }}>{scheduledAction.name}</p>
                <p className="text-[15px] mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                  Recurrente · {formatCurrency(scheduledAction.amount)}
                </p>
              </div>
              <button
                onClick={() => setScheduledAction(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--f-bg-input)' }}
              >
                <i className="fa-solid fa-xmark text-sm" style={{ color: 'var(--f-text)' }} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChargeScheduled(scheduledAction.id, false)}
                disabled={isChargePending}
                className="py-4 rounded-[16px] text-white text-[16px] font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                style={{ background: 'var(--f-blue)', boxShadow: 'var(--f-shadow-accent)' }}
              >
                {isChargePending ? <i className="fa-solid fa-spinner fa-spin" /> : '✓ Registrar pago'}
              </button>
              <button
                onClick={() => handleChargeScheduled(scheduledAction.id, true)}
                disabled={isChargePending}
                className="py-4 rounded-[16px] text-[16px] font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-2)' }}
              >
                Omitir ciclo
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* TDC payment modal — portal to escape stacking context */}
      {tdcModal && createPortal(
        <>
          <div className="fixed inset-0 z-[200] bg-black/60 animate-fade-in" onClick={() => setTdcModal(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[200] rounded-t-[28px] animate-slide-up mx-auto max-w-lg"
            style={{ background: 'var(--f-bg-elevated)', paddingBottom: 'calc(1.5rem + var(--safe-bottom))', maxHeight: '90dvh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div>
                <p className="text-[17px] font-black" style={{ color: 'var(--f-text)' }}>{tdcModal.name}</p>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                  {tdcModal.payment_day != null ? `Fecha límite: día ${tdcModal.payment_day}` : 'Registrar pago'}
                </p>
              </div>
              <button
                onClick={() => setTdcModal(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--f-bg-input)' }}
              >
                <i className="fa-solid fa-xmark text-xs" style={{ color: 'var(--f-text)' }} />
              </button>
            </div>

            <div className="px-5 space-y-4 pb-2">
              {/* Amount */}
              <div>
                <p className="text-[12px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-3)' }}>
                  Monto pagado
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={tdcAmount}
                  onChange={e => setTdcAmount(e.target.value)}
                  className="w-full rounded-[14px] px-4 py-3.5 text-[19px] font-black outline-none tabular-nums"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)', color: 'var(--f-text)' }}
                />
              </div>

              {/* Payment type toggle */}
              <div>
                <p className="text-[12px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-3)' }}>
                  Tipo de pago
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['transfer', 'deposit'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTdcPayType(t)}
                      className="py-3 rounded-[12px] text-[14px] font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={tdcPayType === t
                        ? { background: 'var(--f-blue)', color: 'white' }
                        : { background: 'var(--f-bg-input)', color: 'var(--f-text-2)' }
                      }
                    >
                      <i className={t === 'transfer' ? 'fa-solid fa-arrow-right-arrow-left' : 'fa-solid fa-building-columns'} />
                      {t === 'transfer' ? 'Transferencia' : 'Depósito'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source account — only for transfers */}
              {tdcPayType === 'transfer' && nonTdcAccounts.length > 0 && (
                <div>
                  <p className="text-[12px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-3)' }}>
                    Cuenta origen
                  </p>
                  <div className="space-y-2">
                    {nonTdcAccounts.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setTdcSource(a.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-[12px] transition-all active:opacity-80"
                        style={tdcSource === a.id
                          ? { background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.4)' }
                          : { background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }
                        }
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-[15px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{a.name}</p>
                          <p className="text-[13px] tabular-nums" style={{ color: 'var(--f-text-3)' }}>
                            {formatCurrency(a.balance)}
                          </p>
                        </div>
                        {tdcSource === a.id && (
                          <i className="fa-solid fa-check text-xs flex-shrink-0" style={{ color: 'var(--f-blue)' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save */}
              <button
                onClick={handleSaveTdc}
                disabled={isTdcPending}
                className="w-full py-4 rounded-[16px] text-white text-[16px] font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                style={{ background: 'var(--f-blue)', boxShadow: 'var(--f-shadow-accent)' }}
              >
                {isTdcPending ? <i className="fa-solid fa-spinner fa-spin" /> : '✓ Registrar pago'}
              </button>

              {/* Omitir — solo si no hay pago registrado */}
              {!creditPayMap[tdcModal.id] && (
                <button
                  onClick={handleSkipTdc}
                  disabled={isSkipPending || isTdcPending}
                  className="w-full py-3 rounded-[16px] text-[15px] font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                  style={{ background: 'var(--f-transfer-bg)', color: 'var(--f-transfer)', border: '1px solid var(--f-transfer-border)' }}
                >
                  {isSkipPending
                    ? <i className="fa-solid fa-spinner fa-spin" />
                    : <><i className="fa-solid fa-forward mr-2" />Omitir este mes</>
                  }
                </button>
              )}

              {/* Desmarcar — solo si ya hay pago/omisión registrada */}
              {creditPayMap[tdcModal.id] && (
                <button
                  onClick={handleDeleteTdc}
                  disabled={isTdcPending}
                  className="w-full py-3 rounded-[16px] text-[15px] font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                  style={{ background: 'var(--f-expense-bg)', color: 'var(--f-expense)', border: '1px solid var(--f-expense-border)' }}
                >
                  Desmarcar
                </button>
              )}
            </div>
          </div>
        </>,
        document.body,
      )}

      {auditOpen && createPortal(
        <AuditModal accounts={accounts} onClose={() => setAuditOpen(false)} />,
        document.body
      )}

      <CoachMarkTour pageKey="home" />
    </div>
  )
}
