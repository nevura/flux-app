'use client'

import { useState, useMemo, useEffect, useRef, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateShort, getCategoryDisplay } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks'

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <>{formatCurrency(animated)}</>
}
import { MONTHS_ES } from '@/lib/constants'
import { searchAllTransactions, fetchSharedTransactions, deleteTransaction, confirmTransaction } from '@/actions/transactions'
import CoachMarkTour from '@/components/onboarding/CoachMarkTour'
import { SwipeableRow } from '@/components/shared/SwipeableRow'
import type { Transaction, Category, AccountWithBalance, Person } from '@/lib/types'
import TransactionModal from './TransactionModal'

interface Props {
  initialTransactions: Transaction[]
  categories: Category[]
  accounts: AccountWithBalance[]
  people: Person[]
  year: number
  month: number
}

export default function TransactionsClient({ initialTransactions, categories, accounts, people, year, month }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isNavigating, startNavigate] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<Transaction | null>(null)
  const [search, setSearch]         = useState('')
  const [filterTypes, setFilterTypes] = useState<string[]>([])
  const [filterCats, setFilterCats]   = useState<string[]>([])
  const [showPending, setShowPending]   = useState(false)
  const [typeDropOpen, setTypeDropOpen] = useState(false)
  const [catDropOpen, setCatDropOpen]   = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)
  const [slideDir, setSlideDir] = useState<'right' | 'left' | null>(null)
  const [displayMonth, setDisplayMonth] = useState(month)
  const [displayYear, setDisplayYear] = useState(year)

  // Sync display state when new server data arrives
  useEffect(() => {
    setDisplayMonth(month)
    setDisplayYear(year)
  }, [month, year])

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const accMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a])), [accounts])

  function navigate(dir: -1 | 1) {
    let m = displayMonth + dir
    let y = displayYear
    if (m < 1)  { m = 12; y-- }
    if (m > 12) { m = 1;  y++ }
    setDisplayMonth(m)
    setDisplayYear(y)
    setSlideDir(dir === 1 ? 'right' : 'left')
    startNavigate(() => router.push(`/transactions?year=${y}&month=${m}`))
  }

  function toggleType(v: string) {
    setFilterTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }
  function toggleCat(v: string) {
    setFilterCats(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const hasPending = useMemo(() => initialTransactions.some(t => !t.is_validated), [initialTransactions])

  const [showShared, setShowShared] = useState(false)

  // Cross-month shared filter
  const [sharedResults, setSharedResults] = useState<Transaction[] | null>(null)
  const [isLoadingShared, setIsLoadingShared] = useState(false)

  function toggleShared() {
    if (showShared) { setShowShared(false); setSharedResults(null); return }
    setShowShared(true); setShowPending(false)
    setFilterTypes([]); setFilterCats([])
    setIsLoadingShared(true)
    fetchSharedTransactions().then(r => {
      setSharedResults(r.data as Transaction[])
      setIsLoadingShared(false)
    })
  }

  // Cross-month name search
  const [allSearchResults, setAllSearchResults] = useState<Transaction[] | null>(null)
  const [isSearchingAll, setIsSearchingAll]     = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!search || search.length < 2) { setAllSearchResults(null); setIsSearchingAll(false); return }
    setIsSearchingAll(true)
    searchTimerRef.current = setTimeout(async () => {
      const result = await searchAllTransactions(search)
      setAllSearchResults(result.data as Transaction[])
      setIsSearchingAll(false)
    }, 400)
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current) }
  }, [search])

  const TYPE_OPTIONS = [
    { value: 'TR-GASTO',    label: 'Gastos',          icon: 'fa-solid fa-arrow-up',   color: 'var(--f-expense)' },
    { value: 'TR-INGRESO',  label: 'Ingresos',        icon: 'fa-solid fa-arrow-down', color: 'var(--f-income)'  },
    { value: 'TR-TRANSFER', label: 'Transferencias',  icon: 'fa-solid fa-shuffle',    color: 'var(--f-transfer)' },
  ]

  const filtered = useMemo(() => {
    const base = sharedResults ?? allSearchResults ?? initialTransactions
    return base.filter(t => {
      if (sharedResults) {
        return !!(t.split_data?.data?.some(p => !p.paidStatus && (p.value - (p.paidAmount ?? 0)) > 0.005))
      }
      if (!allSearchResults) {
        if (showPending) return !t.is_validated
      }
      const matchType = filterTypes.length === 0 || filterTypes.includes(t.type)
      const matchCat  = filterCats.length === 0  || filterCats.includes(t.category_id ?? '')
      return matchType && matchCat
    })
  }, [initialTransactions, sharedResults, allSearchResults, filterTypes, filterCats, showPending])

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      const day = t.transaction_date.slice(0, 10)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(t)
    }
    return Array.from(map.entries())
  }, [filtered])

  const totals = useMemo(() => {
    let income = 0, expenses = 0
    for (const t of filtered) {
      if (t.type === 'TR-INGRESO') income += Number(t.amount)
      else if (t.type === 'TR-GASTO') expenses += Number(t.amount)
    }
    return { income, expenses }
  }, [filtered])

  function openEdit(tx: Transaction) { setEditing(tx); setModalOpen(true) }

  function handleQuickDelete(tx: Transaction) {
    startTransition(async () => {
      await deleteTransaction(tx.id)
      router.refresh()
      window.dispatchEvent(new CustomEvent('flux:refresh'))
    })
  }

  function handleQuickConfirm(tx: Transaction) {
    startTransition(async () => {
      await confirmTransaction(tx.id)
      router.refresh()
      window.dispatchEvent(new CustomEvent('flux:refresh'))
    })
  }


  const now = new Date()
  const isCurrentMonth = displayYear === now.getFullYear() && displayMonth === (now.getMonth() + 1)

  return (
    <div className="min-h-screen" style={{ background: 'var(--f-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top))',
          paddingBottom: '0.75rem',
          background: 'var(--f-bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Month navigation row */}
        <div data-coach="tx-month-nav" className="flex items-center justify-between mb-4 relative">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'var(--f-bg-input)' }}
          >
            <i className="fa-solid fa-chevron-left text-xs" style={{ color: 'var(--f-text)' }} />
          </button>

          <div className="text-center">
            <button
              onClick={() => { setPickerYear(displayYear); setPickerOpen(true) }}
              className="flex items-center gap-1.5 text-[19px] font-black capitalize"
              style={{ color: 'var(--f-text)' }}
            >
              {MONTHS_ES[displayMonth - 1]} {displayYear}
              {isNavigating && <i className="fa-solid fa-spinner fa-spin text-[14px] ml-1" style={{ color: 'var(--f-text-4)' }} />}
              <i className="fa-solid fa-chevron-down text-[12px]" style={{ color: 'var(--f-text-3)' }} />
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => router.push('/transactions')}
                className="text-[13px] font-bold block"
                style={{ color: 'var(--f-blue)' }}
              >
                Ir al mes actual
              </button>
            )}
          </div>

          <button
            onClick={() => navigate(1)}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30"
            style={{ background: 'var(--f-bg-input)' }}
          >
            <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--f-text)' }} />
          </button>

          {/* Month/Year Picker */}
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
              <div
                className="absolute left-0 right-0 top-full mt-2 rounded-[20px] p-4 z-50"
                style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line-strong)', boxShadow: 'var(--f-shadow-pop)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={e => { e.stopPropagation(); setPickerYear(y => y - 1) }}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: 'var(--f-bg-input)' }}
                  >
                    <i className="fa-solid fa-chevron-left text-xs" style={{ color: 'var(--f-text)' }} />
                  </button>
                  <p className="text-[17px] font-black" style={{ color: 'var(--f-text)' }}>{pickerYear}</p>
                  <button
                    onClick={e => { e.stopPropagation(); setPickerYear(y => y + 1) }}
                    disabled={pickerYear >= now.getFullYear()}
                    className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 disabled:opacity-30"
                    style={{ background: 'var(--f-bg-input)' }}
                  >
                    <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--f-text)' }} />
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
                          router.push(`/transactions?year=${pickerYear}&month=${i + 1}`)
                          setPickerOpen(false)
                        }}
                        className="py-2 rounded-[10px] text-[13px] font-black capitalize transition-all"
                        style={{
                          background: isSelected ? 'var(--f-accent-bg)' : 'var(--f-bg-input)',
                          color: isSelected ? 'var(--f-blue)' : isFuture ? 'var(--f-text-4)' : 'var(--f-text-2)',
                          border: isSelected ? '1px solid var(--f-accent-border)' : '1px solid transparent',
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
        </div>

        {/* Summary */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'var(--f-income-bg)', border: '1px solid var(--f-income-border)' }}>
            <p className="text-[11px] font-black tracking-[2px] uppercase mb-0.5" style={{ color: 'var(--f-income)', opacity: 0.7 }}>Ingresos</p>
            <p className="text-[18px] font-black tabular-nums" style={{ color: 'var(--f-income)' }}>+<AnimatedCurrency value={totals.income} /></p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'var(--f-expense-bg)', border: '1px solid var(--f-expense-border)' }}>
            <p className="text-[11px] font-black tracking-[2px] uppercase mb-0.5" style={{ color: 'var(--f-expense)', opacity: 0.7 }}>Gastos</p>
            <p className="text-[18px] font-black tabular-nums" style={{ color: 'var(--f-expense)' }}>-<AnimatedCurrency value={totals.expenses} /></p>
          </div>
        </div>

        {/* Filters row — two multi-select dropdowns */}
        <div data-coach="tx-filter-bar" className="flex gap-2 mt-1">
          {/* Type dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => { setTypeDropOpen(o => !o); setCatDropOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
              style={{
                background: filterTypes.length > 0 ? 'var(--f-accent-bg)' : 'var(--f-bg-input)',
                border: filterTypes.length > 0 ? '1px solid var(--f-accent-border)' : '1px solid var(--f-line)',
                color: filterTypes.length > 0 ? 'var(--f-blue)' : 'var(--f-text-2)',
              }}
            >
              <span>{filterTypes.length > 0 ? `Tipo (${filterTypes.length})` : 'Tipo'}</span>
              <i className={`fa-solid fa-chevron-${typeDropOpen ? 'up' : 'down'} text-[11px]`} />
            </button>
            {typeDropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTypeDropOpen(false)} />
                <div
                  className="absolute top-full mt-1 left-0 right-0 rounded-[16px] p-2 z-50 animate-scale-in"
                  style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line-strong)', boxShadow: 'var(--f-shadow-pop)', transformOrigin: 'top center' }}
                >
                  {TYPE_OPTIONS.map(opt => {
                    const checked = filterTypes.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleType(opt.value)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all"
                        style={{ background: checked ? 'var(--f-accent-bg)' : 'transparent' }}
                      >
                        <i className={`${opt.icon} text-[13px] w-3.5 flex-shrink-0`} style={{ color: opt.color }} />
                        <span className="text-[15px] font-semibold flex-1" style={{ color: checked ? 'var(--f-text)' : 'var(--f-text-2)' }}>{opt.label}</span>
                        {checked && <i className="fa-solid fa-check text-[11px]" style={{ color: 'var(--f-blue)' }} />}
                      </button>
                    )
                  })}
                  {filterTypes.length > 0 && (
                    <button
                      onClick={() => setFilterTypes([])}
                      className="w-full py-1.5 text-[13px] font-bold text-center mt-1 rounded-[8px]"
                      style={{ color: 'var(--f-expense)', background: 'var(--f-expense-bg)' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Category dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => { setCatDropOpen(o => !o); setTypeDropOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[14px] font-bold transition-all active:scale-[0.97]"
              style={{
                background: filterCats.length > 0 ? 'var(--f-accent-bg)' : 'var(--f-bg-input)',
                border: filterCats.length > 0 ? '1px solid var(--f-accent-border)' : '1px solid var(--f-line)',
                color: filterCats.length > 0 ? 'var(--f-blue)' : 'var(--f-text-2)',
              }}
            >
              <span>{filterCats.length > 0 ? `Cat. (${filterCats.length})` : 'Categoría'}</span>
              <i className={`fa-solid fa-chevron-${catDropOpen ? 'up' : 'down'} text-[11px]`} />
            </button>
            {catDropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCatDropOpen(false)} />
                <div
                  className="absolute top-full mt-1 left-0 right-0 rounded-[16px] p-2 z-50 max-h-64 overflow-y-auto animate-scale-in"
                  style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line-strong)', boxShadow: 'var(--f-shadow-pop)', transformOrigin: 'top center' }}
                >
                  {categories.filter(c => c.id !== 'CAT-AUDIT').map(cat => {
                    const d = getCategoryDisplay(cat)
                    const checked = filterCats.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCat(cat.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all"
                        style={{ background: checked ? 'var(--f-accent-bg)' : 'transparent' }}
                      >
                        <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                          <i className={`${d.icon} ${d.color} text-[11px]`} />
                        </div>
                        <span className="text-[15px] font-semibold flex-1 truncate" style={{ color: checked ? 'var(--f-text)' : 'var(--f-text-2)' }}>{cat.name}</span>
                        {checked && <i className="fa-solid fa-check text-[11px]" style={{ color: 'var(--f-blue)' }} />}
                      </button>
                    )
                  })}
                  {filterCats.length > 0 && (
                    <button
                      onClick={() => setFilterCats([])}
                      className="w-full py-1.5 text-[13px] font-bold text-center mt-1 rounded-[8px]"
                      style={{ color: 'var(--f-expense)', background: 'var(--f-expense-bg)' }}
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search / chips row — dynamic */}
        <div className="mt-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 animate-search-expand">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--f-blue)', opacity: 0.7 }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearch('') } }}
                  placeholder="Buscar movimiento…"
                  className="w-full rounded-[14px] pl-9 pr-4 py-2.5 text-[15px] font-medium outline-none"
                  style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)', color: 'var(--f-text)' }}
                />
              </div>
              <button
                onClick={() => { setSearchOpen(false); setSearch('') }}
                className="flex-shrink-0 text-[14px] font-bold px-1 py-2"
                style={{ color: 'var(--f-blue)' }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
              {hasPending && (
                <button
                  onClick={() => { setShowPending(p => !p); if (showShared) { setShowShared(false); setSharedResults(null) }; setFilterTypes([]); setFilterCats([]) }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-bold transition-all animate-spring-in active:scale-[0.95]"
                  style={{
                    background: showPending ? 'var(--f-pending-bg)' : 'var(--f-bg-input)',
                    border: showPending ? '1px solid var(--f-pending-border)' : '1px solid var(--f-line)',
                    color: 'var(--f-pending)',
                  }}
                >
                  <i className="fa-solid fa-clock text-[11px]" />
                  Por confirmar
                  {showPending && <i className="fa-solid fa-xmark text-[11px] ml-1" />}
                </button>
              )}
              <button
                onClick={toggleShared}
                disabled={isLoadingShared}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-bold transition-all disabled:opacity-60 animate-spring-in active:scale-[0.95]"
                style={{
                  animationDelay: hasPending ? '0.06s' : '0s',
                  background: showShared ? 'var(--f-transfer-bg)' : 'var(--f-bg-input)',
                  border: showShared ? '1px solid var(--f-transfer-border)' : '1px solid var(--f-line)',
                  color: 'var(--f-transfer)',
                }}
              >
                {isLoadingShared
                  ? <i className="fa-solid fa-spinner fa-spin text-[11px]" />
                  : <i className="fa-solid fa-users text-[11px]" />
                }
                Compartidos
                {showShared && !isLoadingShared && <i className="fa-solid fa-xmark text-[11px] ml-1" />}
              </button>
              <button
                data-coach="tx-search"
                onClick={() => setSearchOpen(true)}
                className="flex-shrink-0 ml-auto w-9 h-9 rounded-[12px] flex items-center justify-center transition-all active:scale-[0.9]"
                style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
              >
                <i className="fa-solid fa-magnifying-glass text-xs" style={{ color: 'var(--f-text-2)' }} />
              </button>
            </div>
          )}
        </div>
      </header>

      {(allSearchResults !== null || isSearchingAll || sharedResults !== null || isLoadingShared) && (
        <div className="px-4 pt-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
            {(isSearchingAll || isLoadingShared)
              ? <i className="fa-solid fa-spinner fa-spin text-[12px]" style={{ color: 'var(--f-blue)' }} />
              : <i className="fa-solid fa-magnifying-glass text-[12px]" style={{ color: 'var(--f-blue)' }} />
            }
            <p className="text-[13px] font-bold" style={{ color: 'var(--f-text-2)' }}>
              {isSearchingAll || isLoadingShared
                ? 'Buscando…'
                : sharedResults
                  ? `${filtered.length} compartido${filtered.length !== 1 ? 's' : ''} en todos los meses`
                  : `${allSearchResults?.length ?? 0} resultado${(allSearchResults?.length ?? 0) !== 1 ? 's' : ''} en todos los meses`}
            </p>
          </div>
        </div>
      )}

      <div
        key={`${year}-${month}-${search}-${showShared}`}
        className={`px-4 py-4 max-w-lg mx-auto ${slideDir === 'right' ? 'animate-slide-from-right' : slideDir === 'left' ? 'animate-slide-from-left' : 'animate-fade-up'}`}
        style={{ opacity: isNavigating ? 0.35 : 1, transition: 'opacity 0.12s ease' }}
      >
        {grouped.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--f-text-4)' }}>
            <i className="fa-solid fa-magnifying-glass text-4xl mb-3 block opacity-30" />
            <p className="text-sm font-bold">{isSearchingAll || isLoadingShared ? 'Buscando…' : 'Sin movimientos'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([day, txs], gi) => (
              <div key={day} className="animate-fade-up" style={{ animationDelay: `${gi * 0.04}s` }}>
                <p className="text-[12px] font-black uppercase tracking-[2px] mb-2 px-1" style={{ color: 'var(--f-text-3)' }}>
                  {formatDateShort(day + 'T12:00:00')}
                </p>
                <div className="space-y-1.5">
                  {txs.map((tx, ti) => {
                    const isTransfer = tx.type === 'TR-TRANSFER'
                    const cat = catMap[tx.category_id ?? '']
                    const d = isTransfer
                      ? { icon: 'fa-solid fa-shuffle', color: 'text-sky-400', bg: 'bg-sky-500/20', name: `${accMap[tx.account_id]?.name ?? '?'} → ${accMap[tx.destination_account_id ?? '']?.name ?? '?'}` }
                      : getCategoryDisplay(cat)
                    const isIncome   = tx.type === 'TR-INGRESO'
                    const isExpense  = tx.type === 'TR-GASTO'
                    const amtColor   = isIncome ? 'var(--f-income)' : isExpense ? 'var(--f-expense)' : 'var(--f-transfer)'
                    const isTxPending = !tx.is_validated
                    return (
                      <SwipeableRow
                        key={tx.id}
                        className="rounded-[16px]"
                        rightActions={[
                          ...(isTxPending ? [{
                            icon: 'fa-solid fa-circle-check',
                            label: 'Confirmar',
                            bg: 'var(--f-income)',
                            onClick: () => handleQuickConfirm(tx),
                          }] : []),
                          {
                            icon: 'fa-solid fa-trash',
                            label: 'Eliminar',
                            bg: 'var(--f-expense)',
                            onClick: () => handleQuickDelete(tx),
                          },
                        ]}
                      >
                        <button
                          onClick={() => openEdit(tx)}
                          className="w-full rounded-[16px] px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-left animate-spring-in"
                          style={{
                            background: isTxPending ? 'var(--f-pending-bg)' : 'var(--f-bg-card)',
                            border: isTxPending ? '1px solid var(--f-pending-border)' : '1px solid var(--f-accent-border)',
                            animationDelay: `${gi * 0.045 + ti * 0.03}s`,
                          }}
                        >
                          <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                            <i className={`${d.icon} ${d.color} text-base`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{tx.concept}</p>
                            <p className="text-[13px] mt-0.5 truncate" style={{ color: 'var(--f-text-3)' }}>
                              {isTxPending && <span style={{ color: 'var(--f-pending)' }}>Por confirmar · </span>}
                              {d.name}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                            <p className="text-[16px] font-black tabular-nums" style={{ color: amtColor }}>
                              {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(Number(tx.amount))}
                            </p>
                            {!isTxPending && (tx.is_receivable || tx.is_payable) && (
                              <span className="text-[11px] font-black mt-0.5 inline-block px-1.5 py-0.5 rounded-full" style={{ background: 'var(--f-pending-bg)', color: 'var(--f-pending)' }}>
                                {tx.is_receivable ? 'Por cobrar' : 'Por pagar'}
                              </span>
                            )}
                          </div>
                        </button>
                      </SwipeableRow>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {modalOpen && createPortal(
        <TransactionModal
          transaction={editing}
          accounts={accounts}
          categories={categories}
          people={people}
          onClose={() => setModalOpen(false)}
        />,
        document.body
      )}

      <CoachMarkTour pageKey="transactions" />
    </div>
  )
}
