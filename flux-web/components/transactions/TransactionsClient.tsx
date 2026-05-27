'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateShort, getCategoryDisplay } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks'

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <>{formatCurrency(animated)}</>
}
import { MONTHS_ES } from '@/lib/constants'
import { searchAllTransactions, fetchSharedTransactions, confirmTransaction } from '@/actions/transactions'
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

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])
  const accMap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a])), [accounts])

  function navigate(dir: -1 | 1) {
    setSlideDir(dir === 1 ? 'right' : 'left')
    let m = month + dir
    let y = year
    if (m < 1)  { m = 12; y-- }
    if (m > 12) { m = 1;  y++ }
    router.push(`/transactions?year=${y}&month=${m}`)
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
    { value: 'TR-GASTO',    label: 'Gastos',          icon: 'fa-solid fa-arrow-up',   color: '#FF453A' },
    { value: 'TR-INGRESO',  label: 'Ingresos',        icon: 'fa-solid fa-arrow-down', color: '#30D158' },
    { value: 'TR-TRANSFER', label: 'Transferencias',  icon: 'fa-solid fa-shuffle',    color: '#64D2FF' },
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
  function openAdd() { setEditing(null); setModalOpen(true) }

  async function handleConfirm(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await confirmTransaction(id)
    router.refresh()
  }

  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === (now.getMonth() + 1)

  return (
    <div className="min-h-screen" style={{ background: '#020617' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top))',
          paddingBottom: '0.75rem',
          background: 'rgba(2,6,23,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Month navigation row */}
        <div className="flex items-center justify-between mb-4 relative">
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
              <button
                onClick={() => router.push('/transactions')}
                className="text-[11px] font-bold block"
                style={{ color: '#007AFF' }}
              >
                Ir al mes actual
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

          {/* Month/Year Picker */}
          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
              <div
                className="absolute left-0 right-0 top-full mt-2 rounded-[20px] p-4 z-50"
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
                          router.push(`/transactions?year=${pickerYear}&month=${i + 1}`)
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
        </div>

        {/* Summary */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
            <p className="text-[9px] font-black tracking-[2px] uppercase mb-0.5" style={{ color: 'rgba(48,209,88,0.7)' }}>Ingresos</p>
            <p className="text-[16px] font-black tabular-nums" style={{ color: '#30D158' }}>+<AnimatedCurrency value={totals.income} /></p>
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)' }}>
            <p className="text-[9px] font-black tracking-[2px] uppercase mb-0.5" style={{ color: 'rgba(255,69,58,0.7)' }}>Gastos</p>
            <p className="text-[16px] font-black tabular-nums" style={{ color: '#FF453A' }}>-<AnimatedCurrency value={totals.expenses} /></p>
          </div>
        </div>

        {/* Filters row — two multi-select dropdowns */}
        <div className="flex gap-2 mt-1">
          {/* Type dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => { setTypeDropOpen(o => !o); setCatDropOpen(false) }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[12px] font-bold"
              style={{
                background: filterTypes.length > 0 ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.07)',
                border: filterTypes.length > 0 ? '1px solid rgba(0,122,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: filterTypes.length > 0 ? '#007AFF' : 'rgba(255,255,255,0.5)',
              }}
            >
              <span>{filterTypes.length > 0 ? `Tipo (${filterTypes.length})` : 'Tipo'}</span>
              <i className={`fa-solid fa-chevron-${typeDropOpen ? 'up' : 'down'} text-[9px]`} />
            </button>
            {typeDropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTypeDropOpen(false)} />
                <div
                  className="absolute top-full mt-1 left-0 right-0 rounded-[16px] p-2 z-50"
                  style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                >
                  {TYPE_OPTIONS.map(opt => {
                    const checked = filterTypes.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleType(opt.value)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all"
                        style={{ background: checked ? 'rgba(0,122,255,0.15)' : 'transparent' }}
                      >
                        <i className={`${opt.icon} text-[11px] w-3.5 flex-shrink-0`} style={{ color: opt.color }} />
                        <span className="text-[13px] font-semibold flex-1" style={{ color: checked ? 'white' : 'rgba(255,255,255,0.65)' }}>{opt.label}</span>
                        {checked && <i className="fa-solid fa-check text-[9px]" style={{ color: '#007AFF' }} />}
                      </button>
                    )
                  })}
                  {filterTypes.length > 0 && (
                    <button
                      onClick={() => setFilterTypes([])}
                      className="w-full py-1.5 text-[11px] font-bold text-center mt-1 rounded-[8px]"
                      style={{ color: '#FF453A', background: 'rgba(255,69,58,0.08)' }}
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
              className="w-full flex items-center justify-between px-3 py-2 rounded-[12px] text-[12px] font-bold"
              style={{
                background: filterCats.length > 0 ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.07)',
                border: filterCats.length > 0 ? '1px solid rgba(0,122,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: filterCats.length > 0 ? '#007AFF' : 'rgba(255,255,255,0.5)',
              }}
            >
              <span>{filterCats.length > 0 ? `Cat. (${filterCats.length})` : 'Categoría'}</span>
              <i className={`fa-solid fa-chevron-${catDropOpen ? 'up' : 'down'} text-[9px]`} />
            </button>
            {catDropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCatDropOpen(false)} />
                <div
                  className="absolute top-full mt-1 left-0 right-0 rounded-[16px] p-2 z-50 max-h-64 overflow-y-auto"
                  style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                >
                  {categories.filter(c => c.id !== 'CAT-AUDIT').map(cat => {
                    const d = getCategoryDisplay(cat)
                    const checked = filterCats.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCat(cat.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all"
                        style={{ background: checked ? 'rgba(0,122,255,0.15)' : 'transparent' }}
                      >
                        <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                          <i className={`${d.icon} ${d.color} text-[9px]`} />
                        </div>
                        <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: checked ? 'white' : 'rgba(255,255,255,0.65)' }}>{cat.name}</span>
                        {checked && <i className="fa-solid fa-check text-[9px]" style={{ color: '#007AFF' }} />}
                      </button>
                    )
                  })}
                  {filterCats.length > 0 && (
                    <button
                      onClick={() => setFilterCats([])}
                      className="w-full py-1.5 text-[11px] font-bold text-center mt-1 rounded-[8px]"
                      style={{ color: '#FF453A', background: 'rgba(255,69,58,0.08)' }}
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
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(0,122,255,0.7)' }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setSearchOpen(false); setSearch('') } }}
                  placeholder="Buscar movimiento…"
                  className="w-full rounded-[14px] pl-9 pr-4 py-2.5 text-[13px] font-medium outline-none"
                  style={{ background: 'rgba(0,122,255,0.1)', border: '1px solid rgba(0,122,255,0.3)', color: 'white' }}
                />
              </div>
              <button
                onClick={() => { setSearchOpen(false); setSearch('') }}
                className="flex-shrink-0 text-[12px] font-bold px-1 py-2"
                style={{ color: '#007AFF' }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
              {hasPending && (
                <button
                  onClick={() => { setShowPending(p => !p); if (showShared) { setShowShared(false); setSharedResults(null) }; setFilterTypes([]); setFilterCats([]) }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all animate-spring-in"
                  style={{
                    background: showPending ? 'rgba(255,159,10,0.2)' : 'rgba(255,159,10,0.08)',
                    border: showPending ? '1px solid rgba(255,159,10,0.45)' : '1px solid rgba(255,159,10,0.2)',
                    color: '#FF9F0A',
                  }}
                >
                  <i className="fa-solid fa-clock text-[9px]" />
                  Por confirmar
                  {showPending && <i className="fa-solid fa-xmark text-[9px] ml-1" />}
                </button>
              )}
              <button
                onClick={toggleShared}
                disabled={isLoadingShared}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-bold transition-all disabled:opacity-60 animate-spring-in"
                style={{
                  animationDelay: hasPending ? '0.06s' : '0s',
                  background: showShared ? 'rgba(100,210,255,0.2)' : 'rgba(100,210,255,0.08)',
                  border: showShared ? '1px solid rgba(100,210,255,0.45)' : '1px solid rgba(100,210,255,0.2)',
                  color: '#64D2FF',
                }}
              >
                {isLoadingShared
                  ? <i className="fa-solid fa-spinner fa-spin text-[9px]" />
                  : <i className="fa-solid fa-users text-[9px]" />
                }
                Compartidos
                {showShared && !isLoadingShared && <i className="fa-solid fa-xmark text-[9px] ml-1" />}
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex-shrink-0 ml-auto w-9 h-9 rounded-[12px] flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <i className="fa-solid fa-magnifying-glass text-xs" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>
          )}
        </div>
      </header>

      {(allSearchResults !== null || isSearchingAll || sharedResults !== null || isLoadingShared) && (
        <div className="px-4 pt-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px]" style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)' }}>
            {(isSearchingAll || isLoadingShared)
              ? <i className="fa-solid fa-spinner fa-spin text-[10px]" style={{ color: '#007AFF' }} />
              : <i className="fa-solid fa-magnifying-glass text-[10px]" style={{ color: '#007AFF' }} />
            }
            <p className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
      >
        {grouped.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <i className="fa-solid fa-magnifying-glass text-4xl mb-3 block opacity-30" />
            <p className="text-sm font-bold">{isSearchingAll || isLoadingShared ? 'Buscando…' : 'Sin movimientos'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([day, txs], gi) => (
              <div key={day} className="animate-fade-up" style={{ animationDelay: `${gi * 0.04}s` }}>
                <p className="text-[10px] font-black uppercase tracking-[2px] mb-2 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {formatDateShort(day + 'T12:00:00')}
                </p>
                <div className="space-y-1.5">
                  {txs.map((tx, ti) => {
                    const isTransfer = tx.type === 'TR-TRANSFER'
                    const cat = catMap[tx.category_id ?? '']
                    const d = isTransfer
                      ? { icon: 'fa-solid fa-shuffle', color: 'text-sky-400', bg: 'bg-sky-500/20', name: `${accMap[tx.account_id]?.name ?? '?'} → ${accMap[tx.destination_account_id ?? '']?.name ?? '?'}` }
                      : getCategoryDisplay(cat)
                    const isIncome  = tx.type === 'TR-INGRESO'
                    const isExpense = tx.type === 'TR-GASTO'
                    const amtColor  = isIncome ? '#30D158' : isExpense ? '#FF453A' : '#64D2FF'
                    const isPending = !tx.is_validated
                    return (
                      <button
                        key={tx.id}
                        onClick={() => openEdit(tx)}
                        className="w-full rounded-[16px] px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform text-left animate-spring-in"
                        style={{
                          background: isPending ? 'rgba(255,159,10,0.07)' : '#0F172A',
                          border: isPending ? '1px solid rgba(255,159,10,0.3)' : '1px solid rgba(0,122,255,0.1)',
                          animationDelay: `${gi * 0.045 + ti * 0.03}s`,
                        }}
                      >
                        <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 ${d.bg}`}>
                          <i className={`${d.icon} ${d.color} text-sm`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white truncate">{tx.concept}</p>
                          <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {isPending && <span style={{ color: '#FF9F0A' }}>Por confirmar · </span>}
                            {d.name}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                          <p className="text-[14px] font-black tabular-nums" style={{ color: amtColor }}>
                            {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(Number(tx.amount))}
                          </p>
                          {isPending ? (
                            <button
                              onClick={(e) => handleConfirm(e, tx.id)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-all active:scale-90"
                              style={{ background: 'rgba(255,159,10,0.2)', color: '#FF9F0A', border: '1px solid rgba(255,159,10,0.35)' }}
                            >
                              <i className="fa-solid fa-check" />
                              Confirmar
                            </button>
                          ) : (tx.is_receivable || tx.is_payable) && (
                            <span className="text-[9px] font-black mt-0.5 inline-block px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }}>
                              {tx.is_receivable ? 'Por cobrar' : 'Por pagar'}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {createPortal(
        <>
          {/* FAB — above nav bar */}
          <button
            onClick={openAdd}
            className="fixed z-[55] flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{
              width: 56,
              height: 56,
              right: '1.25rem',
              bottom: 'calc(5rem + var(--safe-bottom))',
              background: '#007AFF',
              boxShadow: '0 8px 28px rgba(0,122,255,0.55)',
            }}
          >
            <i className="fa-solid fa-plus text-white text-lg" />
          </button>

          {modalOpen && (
            <TransactionModal
              transaction={editing}
              accounts={accounts}
              categories={categories}
              people={people}
              onClose={() => setModalOpen(false)}
            />
          )}
        </>,
        document.body
      )}
    </div>
  )
}
