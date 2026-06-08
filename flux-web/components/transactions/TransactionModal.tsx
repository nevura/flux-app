'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addTransaction, updateTransaction, deleteTransaction, confirmTransaction, settlePayable } from '@/actions/transactions'
import { addPerson } from '@/actions/config'
import { getCategoryDisplay, getMexicoNow } from '@/lib/utils'
import { useBottomSheetSwipe } from '@/lib/hooks/useBottomSheetSwipe'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import type { Transaction, AccountWithBalance, Category, Person, SplitData } from '@/lib/types'
import ModalTip from './ModalTip'

interface Props {
  transaction: Transaction | null
  accounts: AccountWithBalance[]
  categories: Category[]
  people: Person[]
  onClose: () => void
  presetType?: 'TR-GASTO' | 'TR-INGRESO' | 'TR-TRANSFER'
}

type TxType = 'TR-GASTO' | 'TR-INGRESO' | 'TR-TRANSFER'

const TYPE_CONFIG = {
  'TR-GASTO':    { label: 'Gasto',          color: 'var(--f-expense)',  rawColor: '#FF453A', icon: 'fa-solid fa-arrow-up-right' },
  'TR-INGRESO':  { label: 'Ingreso',         color: 'var(--f-income)',   rawColor: '#30D158', icon: 'fa-solid fa-arrow-down-left' },
  'TR-TRANSFER': { label: 'Transferencia',   color: 'var(--f-transfer)', rawColor: '#64D2FF', icon: 'fa-solid fa-shuffle' },
}

export default function TransactionModal({ transaction, accounts, categories, people, onClose, presetType }: Props) {
  const isEdit = Boolean(transaction)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { handleProps: swipeHandleProps, sheetStyle } = useBottomSheetSwipe(onClose)
  useBodyScrollLock()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const needsConfirm = isEdit && transaction?.is_validated === false

  async function handleConfirm() {
    if (!transaction) return
    await confirmTransaction(transaction.id)
    toast.success('Movimiento confirmado')
    router.refresh()
    window.dispatchEvent(new CustomEvent('flux:refresh'))
    onClose()
  }

  const [type, setType] = useState<TxType>(transaction?.type ?? presetType ?? 'TR-GASTO')
  const [concept, setConcept] = useState(transaction?.concept ?? '')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [catId, setCatId] = useState(transaction?.category_id ?? '')
  const [accId, setAccId] = useState(transaction?.account_id ?? accounts[0]?.id ?? '')
  const [destId, setDestId] = useState(transaction?.destination_account_id ?? '')
  const [date, setDate] = useState(transaction?.transaction_date?.slice(0, 16) ?? getMexicoNow().slice(0, 16))
  type ExcludeMode = 'none' | 'all' | 'shared_only'
  const [excludeMode, setExcludeMode] = useState<ExcludeMode>(
    transaction?.exclude_mode ?? (transaction?.exclude_from_budget ? 'all' : 'none')
  )
  const [notes, setNotes] = useState(transaction?.notes ?? '')

  const initSplit = transaction?.split_data
  const initIoweData = transaction?.is_payable && transaction?.split_data?.splitMode === 'IOWE'
    ? transaction.split_data : null
  const initReceivable = transaction?.is_receivable === true

  const [localPeople, setLocalPeople] = useState(people)
  const [newPersonName, setNewPersonName] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)
  const [isAddingPerson, startAddPerson] = useTransition()
  const otherPeople = localPeople.filter(p => !p.is_me)

  // Receivable income state — "Pendiente de cobro"
  const [receivableEnabled, setReceivableEnabled] = useState(initReceivable)
  const [receivablePersonId, setReceivablePersonId] = useState<string>(
    initReceivable ? (transaction?.split_data?.data[0]?.id ?? '') : ''
  )

  function handleAddPerson() {
    const name = newPersonName.trim()
    if (!name) return
    startAddPerson(async () => {
      const res = await addPerson(name)
      if (res.error) { toast.error(res.error); return }
      if (res.person) {
        setLocalPeople(prev => [...prev, res.person!])
        setSplitSelected(prev => new Set([...prev, res.person!.id]))
      }
      setNewPersonName('')
      setAddingPerson(false)
    })
  }
  type QuickMode = 'equal' | 'manual'

  const [splitEnabled, setSplitEnabled] = useState(initSplit != null && initSplit.splitMode !== 'IOWE')
  const [quickMode, setQuickMode] = useState<QuickMode>(
    initSplit?.splitMode === 'DIV' ? 'equal' : initSplit?.splitMode === 'THEY' ? 'manual' : 'equal'
  )
  const [splitSelected, setSplitSelected] = useState<Set<string>>(
    new Set(initSplit?.splitMode !== 'IOWE' ? initSplit?.data.filter(d => d.id !== 'PER-YO').map(d => d.id) ?? [] : [])
  )
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>(
    Object.fromEntries(initSplit?.splitMode !== 'IOWE' ? initSplit?.data.filter(d => d.id !== 'PER-YO').map(d => [d.id, String(d.value)]) ?? [] : [])
  )

  // IOWE (I owe) state — someone else paid, I owe them
  const [iOweEnabled, setIOweEnabled] = useState(!!initIoweData)
  // 'full' = todo el monto a una o más personas (usa el campo amount principal)
  // 'custom' = monto libre por persona
  const [ioweMode, setIoweMode] = useState<'full' | 'custom'>(
    initIoweData && initIoweData.data.length > 1 ? 'custom' : 'full'
  )
  const [ioweSelected, setIoweSelected] = useState<Set<string>>(
    new Set(initIoweData?.data.map(d => d.id) ?? [])
  )
  const [ioweAmounts, setIoweAmounts] = useState<Record<string, string>>(
    Object.fromEntries(initIoweData?.data.map(d => [d.id, String(d.value)]) ?? [])
  )
  const ioweCustomTotal = otherPeople
    .filter(p => ioweSelected.has(p.id))
    .reduce((s, p) => s + evalExpr(ioweAmounts[p.id] ?? '0'), 0)

  function evalExpr(s: string): number {
    const clean = s.replace(/[^0-9+\-*/.()]/g, '')
    if (!clean) return 0
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${clean})`)()
      return typeof result === 'number' && isFinite(result) ? Math.max(0, Math.round(result * 100) / 100) : 0
    } catch { return 0 }
  }

  function buildIoweData(): SplitData | null {
    if (!iOweEnabled || type !== 'TR-GASTO') return null
    const selected = otherPeople.filter(p => ioweSelected.has(p.id))
    if (selected.length === 0) return null
    if (ioweMode === 'full') {
      const amt = parseFloat(amount) || 0
      const perPerson = Math.round((amt / Math.max(selected.length, 1)) * 100) / 100
      return {
        mode: 'AMT',
        splitMode: 'IOWE',
        data: selected.map(p => ({ id: p.id, nombre: p.name, value: perPerson, paidAmount: 0, paidStatus: false })),
      }
    }
    return {
      mode: 'AMT',
      splitMode: 'IOWE',
      data: selected.map(p => ({
        id: p.id, nombre: p.name,
        value: evalExpr(ioweAmounts[p.id] ?? '0'),
        paidAmount: 0, paidStatus: false,
      })),
    }
  }

  function buildSplitData(): SplitData | null {
    if (!splitEnabled || type !== 'TR-GASTO' || splitSelected.size === 0) return null
    const amt = parseFloat(amount) || 0
    const selected = otherPeople.filter(p => splitSelected.has(p.id))
    if (selected.length === 0) return null
    const n = selected.length
    const perPerson = Math.round((amt / (n + 1)) * 100) / 100
    return {
      mode: 'AMT',
      splitMode: quickMode === 'equal' ? 'DIV' : 'THEY',
      data: selected.map(person => ({
        id: person.id,
        nombre: person.name,
        value: quickMode === 'manual'
          ? evalExpr(manualAmounts[person.id] ?? '0')
          : perPerson,
        paidAmount: 0,
        paidStatus: false,
      })),
    }
  }

  function togglePerson(id: string) {
    setSplitSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const cfg = TYPE_CONFIG[type]

  const filteredCats = categories.filter(c => {
    if (c.id === 'CAT-AUDIT' || c.id === 'CAT-APPLE') return false
    if (type === 'TR-INGRESO') return ['CAT-DEF-HON', 'CAT-DEF-INV', 'CAT-DEF-VENT', 'CAT-DEF-OTHER'].includes(c.id) || c.user_id !== null
    return true
  })

  function buildReceivableData(): import('@/lib/types').SplitData | null {
    if (!receivableEnabled || type !== 'TR-INGRESO' || !receivablePersonId) return null
    const person = otherPeople.find(p => p.id === receivablePersonId)
    if (!person) return null
    const amt = parseFloat(amount) || 0
    return {
      mode: 'AMT',
      splitMode: 'THEY',
      data: [{ id: person.id, nombre: person.name, value: amt, paidAmount: 0, paidStatus: false }],
    }
  }

  async function handleSubmit() {
    if (iOweEnabled) {
      if (ioweSelected.size === 0) { toast.error('Selecciona a quién le debes'); return }
      if (ioweMode === 'custom' && ioweCustomTotal <= 0) { toast.error('Agrega el monto que debes'); return }
      if (ioweMode === 'full' && (parseFloat(amount) || 0) <= 0) { toast.error('Agrega el monto que debes'); return }
    }
    if (receivableEnabled && type === 'TR-INGRESO' && !receivablePersonId) {
      toast.error('Selecciona a quién le cobrarás'); return
    }
    const effectiveAmount = iOweEnabled && ioweMode === 'custom' ? String(ioweCustomTotal) : amount
    const isReceivable = receivableEnabled && type === 'TR-INGRESO' && !!receivablePersonId
    const form = {
      concept, type,
      amount: effectiveAmount,
      category_id: catId,
      account_id: accId,
      destination_account_id: destId,
      transaction_date: date,
      exclude_mode: excludeMode,
      notes,
      split_data: isReceivable ? buildReceivableData() : iOweEnabled ? buildIoweData() : buildSplitData(),
      is_payable: iOweEnabled,
      is_receivable: isReceivable,
    }
    startTransition(async () => {
      const res = isEdit && transaction
        ? await updateTransaction(transaction.id, form)
        : await addTransaction(form)
      if (res.error) { toast.error(res.error); return }
      toast.success(isEdit ? 'Movimiento actualizado' : 'Movimiento guardado')
      window.dispatchEvent(new CustomEvent('flux:refresh'))
      onClose()
      if (!isEdit) {
        router.push('/transactions')
      }
    })
  }

  async function handleSettle() {
    if (!transaction) return
    startTransition(async () => {
      const res = await settlePayable(transaction.id)
      if (res.error) { toast.error(res.error); return }
      toast.success('Deuda marcada como pagada')
      router.refresh()
      window.dispatchEvent(new CustomEvent('flux:refresh'))
      onClose()
    })
  }

  async function handleDelete() {
    if (!transaction) return
    startTransition(async () => {
      const res = await deleteTransaction(transaction.id)
      if (res.error) { toast.error(res.error); return }
      toast.success('Movimiento eliminado')
      window.dispatchEvent(new CustomEvent('flux:refresh'))
      onClose()
    })
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up flex flex-col mx-auto max-w-lg"
        style={{
          maxHeight: '94dvh',
          background: 'var(--f-bg-elevated)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid var(--f-line-strong)',
          borderBottom: 'none',
          ...sheetStyle,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0" {...swipeHandleProps}>
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--f-line)' }}>
          <h2 className="text-[18px] font-black" style={{ color: 'var(--f-text)' }}>
            {isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--f-bg-input)' }}
          >
            <i className="fa-solid fa-xmark text-sm" style={{ color: 'var(--f-text)' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div className="px-5 py-5 space-y-5">

            {/* Type selector */}
            <div className="flex gap-2">
              {(Object.entries(TYPE_CONFIG) as [TxType, typeof TYPE_CONFIG[TxType]][]).map(([t, c]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="flex-1 py-2.5 rounded-[14px] text-[13px] font-black flex items-center justify-center gap-1.5 transition-all"
                  style={type === t ? {
                    background: `color-mix(in srgb, ${c.rawColor} 13%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${c.rawColor} 35%, transparent)`,
                    color: c.color,
                  } : {
                    background: 'var(--f-bg-input)',
                    border: '1px solid var(--f-line)',
                    color: 'var(--f-text-3)',
                  }}
                >
                  <i className={c.icon} />
                  {c.label}
                </button>
              ))}
            </div>

            {/* Amount — big centered display */}
            <div className="text-center">
              <p className="text-[12px] font-black tracking-[3px] uppercase mb-3" style={{ color: 'var(--f-text-4)' }}>
                {iOweEnabled ? 'Total que debo' : 'Monto'}
              </p>
              {iOweEnabled && ioweMode === 'custom' ? (
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[28px] font-black" style={{ color: 'var(--f-text-3)' }}>$</span>
                  <span className="text-[44px] font-black tabular-nums" style={{ color: ioweCustomTotal > 0 ? '#FF9F0A' : 'var(--f-text-4)' }}>
                    {ioweCustomTotal > 0 ? ioweCustomTotal.toFixed(2) : '0.00'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[28px] font-black" style={{ color: 'var(--f-text-3)' }}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onBlur={() => {
                      const v = evalExpr(amount)
                      if (v > 0) setAmount(String(v))
                    }}
                    placeholder="0.00"
                    className="bg-transparent border-none outline-none text-[44px] font-black tabular-nums text-center w-full max-w-[220px]"
                    style={{ color: amount ? cfg.color : 'var(--f-text-4)' }}
                  />
                </div>
              )}
              <div
                className="h-0.5 rounded-full mt-2 mx-auto"
                style={{
                  width: '160px',
                  background: `linear-gradient(to right, transparent, ${iOweEnabled ? '#FF9F0A' : cfg.color})`,
                }}
              />
            </div>

            {/* Concept */}
            <div>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>
                Concepto
              </p>
              <input
                type="text"
                required
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder={type === 'TR-GASTO' ? 'Ej: Súper, Uber…' : type === 'TR-INGRESO' ? 'Ej: Sueldo, Venta…' : 'Ej: Ahorro mensual…'}
                className="w-full rounded-[14px] px-4 py-3.5 text-[16px] font-bold placeholder:font-medium outline-none transition-all"
                style={{
                  background: 'var(--f-bg-input)',
                  border: '1px solid var(--f-line)',
                  color: 'var(--f-text)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = cfg.rawColor + '80' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--f-line)' }}
              />
            </div>

            {/* Category */}
            {type !== 'TR-TRANSFER' && (
              <div>
                <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>
                  Categoría
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {filteredCats.map(cat => {
                    const d = getCategoryDisplay(cat)
                    const selected = catId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCatId(selected ? '' : cat.id)}
                        className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-[12px] transition-all"
                        style={selected ? {
                          background: `color-mix(in srgb, ${cfg.rawColor} 10%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${cfg.rawColor} 30%, transparent)`,
                        } : {
                          background: 'transparent',
                          border: '1px solid transparent',
                        }}
                      >
                        <i
                          className={`${d.icon} text-[20px]`}
                          style={{ color: selected ? cfg.color : 'var(--f-text-3)' }}
                        />
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight px-0.5"
                          style={{ color: selected ? cfg.color : 'var(--f-text-4)' }}
                        >
                          {cat.name.split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Account */}
            <div>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>
                {type === 'TR-TRANSFER' ? 'Cuenta origen' : iOweEnabled ? 'Pagaré con' : 'Cuenta'}
              </p>
              <select
                value={accId}
                onChange={e => setAccId(e.target.value)}
                className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold outline-none appearance-none"
                style={{
                  background: 'var(--f-bg-input)',
                  border: `1px solid color-mix(in srgb, ${cfg.rawColor} 35%, transparent)`,
                  color: 'var(--f-text)',
                  colorScheme: 'dark',
                }}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Destination */}
            {type === 'TR-TRANSFER' && (
              <div>
                <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>
                  Cuenta destino
                </p>
                <select
                  value={destId}
                  onChange={e => setDestId(e.target.value)}
                  className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold outline-none appearance-none"
                  style={{
                    background: 'var(--f-bg-input)',
                    border: '1px solid var(--f-transfer)',
                    color: 'var(--f-text)',
                    colorScheme: 'dark',
                  }}
                >
                  <option value="">Selecciona cuenta destino</option>
                  {accounts.filter(a => a.id !== accId).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date — overflow-hidden on wrapper forces the native datetime-local to stay within bounds on iOS */}
            <div>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>
                Fecha
              </p>
              <div className="overflow-hidden rounded-[14px]">
                <input
                  type="datetime-local"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="block w-full min-w-0 rounded-[14px] px-2 py-2 text-[13px] font-bold outline-none"
                  style={{
                    background: 'var(--f-bg-input)',
                    border: '1px solid var(--f-line)',
                    color: 'var(--f-text)',
                    colorScheme: 'dark',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>
                Notas (opcional)
              </p>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Referencia, nota adicional…"
                className="w-full rounded-[14px] px-4 py-3 text-[15px] font-medium outline-none"
                style={{
                  background: 'var(--f-bg-input)',
                  border: '1px solid var(--f-line)',
                  color: 'var(--f-text)',
                }}
              />
            </div>

            {/* First-use tip for exclude */}
            {type === 'TR-GASTO' && excludeMode !== 'none' && (
              <ModalTip
                tipKey="exclude_budget"
                icon="fa-solid fa-eye-slash"
                iconColor="#FF9F0A"
                iconBg="rgba(255,159,10,0.08)"
                title="Excluido del presupuesto"
                body="Este gasto no contará en tu límite mensual ni en las estadísticas. Ideal para gastos extraordinarios como viajes o médicos."
              />
            )}

            {/* Exclude toggle */}
            {type === 'TR-GASTO' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setExcludeMode(excludeMode === 'none' ? (splitEnabled ? 'shared_only' : 'all') : 'none')}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] transition-all"
                  style={{
                    background: excludeMode !== 'none' ? 'rgba(255,159,10,0.1)' : 'var(--f-bg-input)',
                    border: `1px solid ${excludeMode !== 'none' ? 'rgba(255,159,10,0.3)' : 'var(--f-line)'}`,
                  }}
                >
                  <div>
                    <p className="text-[15px] font-bold text-left" style={{ color: 'var(--f-text)' }}>Excluir del presupuesto</p>
                    <p className="text-[13px] text-left mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                      No contar en métricas ni en el límite mensual
                    </p>
                  </div>
                  <div
                    className="w-10 h-6 rounded-full relative flex-shrink-0 transition-colors"
                    style={{ background: excludeMode !== 'none' ? '#FF9F0A' : 'var(--f-line-strong)' }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: excludeMode !== 'none' ? 'translateX(20px)' : 'translateX(4px)' }}
                    />
                  </div>
                </button>

                {/* Mode selector — only when excluded AND split is active */}
                {excludeMode !== 'none' && splitEnabled && (
                  <div className="flex gap-2 px-1">
                    {([
                      { id: 'all' as ExcludeMode, label: 'Todo el gasto', icon: 'fa-solid fa-ban' },
                      { id: 'shared_only' as ExcludeMode, label: 'Solo lo compartido', icon: 'fa-solid fa-users' },
                    ]).map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setExcludeMode(opt.id)}
                        className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-[12px] transition-all"
                        style={excludeMode === opt.id
                          ? { background: 'rgba(255,159,10,0.15)', border: '1px solid rgba(255,159,10,0.4)' }
                          : { background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                      >
                        <i className={opt.icon} style={{ fontSize: 12, color: excludeMode === opt.id ? '#FF9F0A' : 'var(--f-text-3)' }} />
                        <span className="text-[13px] font-semibold text-left leading-tight" style={{ color: excludeMode === opt.id ? '#FF9F0A' : 'var(--f-text-2)' }}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Split / IOWE — segmented control, mutually exclusive */}
            {type === 'TR-GASTO' && (
              <div className="space-y-3">

                {/* Selector row */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setSplitEnabled(v => !v); setIOweEnabled(false) }}
                    className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[14px] transition-all"
                    style={splitEnabled
                      ? { background: 'var(--f-transfer-bg)', border: '1px solid var(--f-transfer-border)' }
                      : { background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                  >
                    <i className="fa-solid fa-users text-[17px]" style={{ color: splitEnabled ? 'var(--f-transfer)' : 'var(--f-text-3)' }} />
                    <span className="text-[12px] font-black leading-tight" style={{ color: splitEnabled ? 'var(--f-transfer)' : 'var(--f-text-3)' }}>
                      Compartir gasto
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-center" style={{ color: splitEnabled ? 'var(--f-transfer)' : 'var(--f-text-4)', opacity: 0.75 }}>
                      Yo pagué, ellos me deben
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIOweEnabled(v => !v); setSplitEnabled(false) }}
                    className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[14px] transition-all"
                    style={iOweEnabled
                      ? { background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.35)' }
                      : { background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                  >
                    <i className="fa-solid fa-hand-holding-dollar text-[17px]" style={{ color: iOweEnabled ? '#FF9F0A' : 'var(--f-text-3)' }} />
                    <span className="text-[12px] font-black leading-tight" style={{ color: iOweEnabled ? '#FF9F0A' : 'var(--f-text-3)' }}>
                      Lo pagó otra persona
                    </span>
                    <span className="text-[11px] font-medium leading-tight text-center" style={{ color: iOweEnabled ? '#FF9F0A' : 'var(--f-text-4)', opacity: 0.75 }}>
                      Ellos pagaron, yo les debo
                    </span>
                  </button>
                </div>

                {/* First-use tips for shared features */}
                {!splitEnabled && !iOweEnabled && (
                  <ModalTip
                    tipKey="share_iowe"
                    icon="fa-solid fa-lightbulb"
                    iconColor="var(--f-transfer)"
                    iconBg="var(--f-transfer-bg)"
                    title="Divide gastos con otras personas"
                    body="'Compartir gasto' registra lo que cada quien te debe. 'Lo pagó otra persona' guarda una deuda tuya sin mover tu saldo hasta que pagues."
                  />
                )}

                {/* IOWE expanded */}
                {iOweEnabled && (
                  <div className="space-y-2">
                    {/* Quick mode buttons */}
                    <div className="flex gap-1.5">
                      {([
                        { id: 'full' as const, label: 'Todo a él/ella', sub: 'Usa el monto ingresado', icon: 'fa-solid fa-circle-dollar-to-slot' },
                        { id: 'custom' as const, label: 'Personalizado', sub: 'Monto libre por persona', icon: 'fa-solid fa-sliders' },
                      ]).map(opt => (
                        <button key={opt.id} type="button" onClick={() => setIoweMode(opt.id)}
                          className="flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-[12px] transition-all"
                          style={ioweMode === opt.id
                            ? { background: 'rgba(255,149,0,0.12)', border: '1px solid rgba(255,149,0,0.4)' }
                            : { background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}>
                          <i className={`${opt.icon} text-[15px]`} style={{ color: ioweMode === opt.id ? '#FF9F0A' : 'var(--f-text-3)' }} />
                          <span className="text-[11px] font-black text-center leading-tight" style={{ color: ioweMode === opt.id ? '#FF9F0A' : 'var(--f-text-3)' }}>{opt.label}</span>
                          <span className="text-[10px] font-medium text-center leading-tight" style={{ color: ioweMode === opt.id ? '#FF9F0A' : 'var(--f-text-4)', opacity: 0.75 }}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>

                    {otherPeople.length === 0 ? (
                      <p className="text-[14px] font-medium text-center py-3" style={{ color: 'var(--f-text-3)' }}>
                        Agrega personas desde Configuración → Personas
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-black tracking-[2px] uppercase px-1" style={{ color: 'var(--f-text-4)' }}>
                          {ioweMode === 'full' ? '¿A quién le debes?' : '¿A quién le debes y cuánto?'}
                        </p>
                        {otherPeople.map(person => {
                          const selected = ioweSelected.has(person.id)
                          const amt = parseFloat(amount) || 0
                          const fullShare = ioweMode === 'full' && ioweSelected.size > 0
                            ? Math.round((amt / ioweSelected.size) * 100) / 100
                            : amt
                          return (
                            <div key={person.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all"
                              style={{
                                background: selected ? 'rgba(255,149,0,0.08)' : 'var(--f-bg-input)',
                                border: `1px solid ${selected ? 'rgba(255,149,0,0.3)' : 'var(--f-line)'}`,
                              }}>
                              <button type="button"
                                onClick={() => {
                                  if (ioweMode === 'full') {
                                    // multi-select in full mode (split equally)
                                    setIoweSelected(prev => {
                                      const next = new Set(prev)
                                      if (next.has(person.id)) next.delete(person.id)
                                      else next.add(person.id)
                                      return next
                                    })
                                  } else {
                                    setIoweSelected(prev => {
                                      const next = new Set(prev)
                                      if (next.has(person.id)) next.delete(person.id)
                                      else next.add(person.id)
                                      return next
                                    })
                                  }
                                }}
                                className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                  style={{ background: selected ? '#FF9F0A' : 'var(--f-line-strong)' }}>
                                  {selected && <i className="fa-solid fa-check text-[11px] text-white" />}
                                </div>
                                <span className="text-[15px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{person.name}</span>
                              </button>
                              {selected && ioweMode === 'full' && (
                                <span className="text-[14px] font-black tabular-nums flex-shrink-0" style={{ color: '#FF9F0A' }}>
                                  ${fullShare.toFixed(2)}
                                </span>
                              )}
                              {selected && ioweMode === 'custom' && (
                                <input type="text" inputMode="decimal"
                                  value={ioweAmounts[person.id] ?? ''}
                                  onChange={e => setIoweAmounts(prev => ({ ...prev, [person.id]: e.target.value }))}
                                  onBlur={e => {
                                    const val = evalExpr(e.target.value)
                                    setIoweAmounts(prev => ({ ...prev, [person.id]: val > 0 ? String(val) : '' }))
                                  }}
                                  placeholder="0.00"
                                  className="w-24 rounded-[8px] px-2 py-1 text-[14px] font-black text-right outline-none"
                                  style={{ background: 'var(--f-bg-elevated)', border: '1px solid rgba(255,149,0,0.4)', color: 'var(--f-text)' }}
                                  onClick={e => e.stopPropagation()}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Split expanded */}
                {splitEnabled && otherPeople.length > 0 && (
                  <div className="mt-3 space-y-3">

                    {/* Quick mode selector */}
                    <div className="flex gap-1.5">
                      {([
                        { id: 'equal' as const, label: 'Partes iguales', sub: 'Yo pagué todo — ellos me deben', icon: 'fa-solid fa-equals' },
                        { id: 'manual' as const, label: 'Personalizado', sub: 'Monto libre por persona', icon: 'fa-solid fa-sliders' },
                      ]).map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setQuickMode(opt.id)}
                          className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[12px] transition-all"
                          style={quickMode === opt.id
                            ? { background: 'var(--f-transfer-bg)', border: '1px solid var(--f-transfer-border)', color: 'var(--f-transfer)' }
                            : { background: 'var(--f-bg-input)', border: '1px solid var(--f-line)', color: 'var(--f-text-3)' }}
                        >
                          <i className={`${opt.icon} text-[17px]`} />
                          <span className="text-[12px] font-black text-center leading-tight mt-0.5">{opt.label}</span>
                          <span className="text-[11px] font-medium text-center leading-tight mt-0.5" style={{ opacity: 0.65 }}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>

                    {/* My share pill — equal mode */}
                    {quickMode === 'equal' && splitSelected.size > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-[10px]"
                        style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}>
                        <span className="text-[13px] font-bold" style={{ color: 'var(--f-text-3)' }}>
                          <i className="fa-solid fa-user text-[11px] mr-1.5" />Tu parte
                        </span>
                        <span className="text-[15px] font-black tabular-nums" style={{ color: 'var(--f-transfer)' }}>
                          ${((parseFloat(amount) || 0) / (splitSelected.size + 1)).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* People list */}
                    <div className="space-y-1.5">
                      {otherPeople.length === 0 && !addingPerson && (
                        <p className="text-[14px] font-bold text-center py-2" style={{ color: 'var(--f-text-3)' }}>
                          No hay personas — agrega una abajo
                        </p>
                      )}
                      {otherPeople.map(person => {
                        const selected = splitSelected.has(person.id)
                        const amt = parseFloat(amount) || 0
                        const n = splitSelected.size
                        const perPerson = Math.round((amt / Math.max(n + 1, 1)) * 100) / 100
                        return (
                          <div
                            key={person.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all"
                            style={{
                              background: selected ? 'var(--f-transfer-bg)' : 'var(--f-bg-input)',
                              border: `1px solid ${selected ? 'var(--f-transfer-border)' : 'var(--f-line)'}`,
                            }}
                          >
                            <button type="button" onClick={() => togglePerson(person.id)} className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                style={{ background: selected ? 'var(--f-transfer)' : 'var(--f-line-strong)' }}>
                                {selected && <i className="fa-solid fa-check text-[11px] text-black" />}
                              </div>
                              <span className="text-[15px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{person.name}</span>
                            </button>
                            {selected && quickMode === 'manual' ? (
                              <input
                                type="text"
                                value={manualAmounts[person.id] ?? ''}
                                onChange={e => setManualAmounts(prev => ({ ...prev, [person.id]: e.target.value }))}
                                onBlur={e => {
                                  const val = evalExpr(e.target.value)
                                  setManualAmounts(prev => ({ ...prev, [person.id]: val > 0 ? String(val) : '' }))
                                }}
                                placeholder="0 ó 40+20"
                                className="w-24 rounded-[8px] px-2 py-1 text-[14px] font-black text-right outline-none"
                                style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-transfer-border)', color: 'var(--f-text)' }}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : selected ? (
                              <span className="text-[14px] font-black tabular-nums flex-shrink-0" style={{ color: 'var(--f-transfer)' }}>
                                ${perPerson.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        )
                      })}

                      {/* Add person */}
                      {addingPerson ? (
                        <div className="flex gap-2">
                          <input
                            autoFocus
                            value={newPersonName}
                            onChange={e => setNewPersonName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddPerson(); if (e.key === 'Escape') setAddingPerson(false) }}
                            placeholder="Nombre de la persona"
                            className="flex-1 rounded-[10px] px-3 py-2 text-[15px] font-bold outline-none"
                            style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-transfer-border)', color: 'var(--f-text)' }}
                          />
                          <button
                            type="button"
                            onClick={handleAddPerson}
                            disabled={isAddingPerson || !newPersonName.trim()}
                            className="px-3 rounded-[10px] text-[14px] font-black disabled:opacity-50"
                            style={{ background: 'var(--f-transfer-bg)', border: '1px solid var(--f-transfer-border)', color: 'var(--f-transfer)' }}
                          >
                            {isAddingPerson ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                          </button>
                          <button type="button" onClick={() => setAddingPerson(false)}
                            className="w-9 rounded-[10px] flex items-center justify-center"
                            style={{ background: 'var(--f-bg-input)' }}>
                            <i className="fa-solid fa-xmark text-xs" style={{ color: 'var(--f-text)' }} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingPerson(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-[12px] transition-all"
                          style={{ background: 'var(--f-bg-input)', border: '1px dashed var(--f-line-strong)' }}
                        >
                          <i className="fa-solid fa-plus text-[12px]" style={{ color: 'var(--f-text-3)' }} />
                          <span className="text-[14px] font-bold" style={{ color: 'var(--f-text-3)' }}>Agregar persona</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Receivable toggle — only for TR-INGRESO */}
            {type === 'TR-INGRESO' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setReceivableEnabled(v => !v); setReceivablePersonId('') }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] transition-all"
                  style={{
                    background: receivableEnabled ? 'var(--f-income-bg)' : 'var(--f-bg-input)',
                    border: `1px solid ${receivableEnabled ? 'var(--f-income-border)' : 'var(--f-line)'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-file-invoice-dollar text-[17px]" style={{ color: receivableEnabled ? 'var(--f-income)' : 'var(--f-text-3)' }} />
                    <div className="text-left">
                      <p className="text-[14px] font-black leading-tight" style={{ color: receivableEnabled ? 'var(--f-income)' : 'var(--f-text)' }}>
                        Pendiente de cobro
                      </p>
                      <p className="text-[12px] font-medium leading-tight mt-0.5" style={{ color: receivableEnabled ? 'var(--f-income)' : 'var(--f-text-4)', opacity: 0.8 }}>
                        No afecta saldo hasta cobrar
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-10 h-6 rounded-full relative flex-shrink-0 transition-colors"
                    style={{ background: receivableEnabled ? 'var(--f-income)' : 'var(--f-line-strong)' }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: receivableEnabled ? 'translateX(20px)' : 'translateX(4px)' }}
                    />
                  </div>
                </button>

                {receivableEnabled && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black tracking-[2px] uppercase px-1" style={{ color: 'var(--f-text-4)' }}>
                      ¿Quién te debe?
                    </p>
                    {otherPeople.length === 0 ? (
                      <p className="text-[14px] font-medium text-center py-3" style={{ color: 'var(--f-text-3)' }}>
                        Agrega personas desde Configuración → Personas
                      </p>
                    ) : (
                      otherPeople.map(person => {
                        const selected = receivablePersonId === person.id
                        return (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => setReceivablePersonId(selected ? '' : person.id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all"
                            style={{
                              background: selected ? 'var(--f-income-bg)' : 'var(--f-bg-input)',
                              border: `1px solid ${selected ? 'var(--f-income-border)' : 'var(--f-line)'}`,
                            }}
                          >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                              style={{ background: selected ? 'var(--f-income)' : 'var(--f-line-strong)' }}>
                              {selected && <i className="fa-solid fa-check text-[11px] text-white" />}
                            </div>
                            <span className="text-[15px] font-bold flex-1 text-left truncate" style={{ color: 'var(--f-text)' }}>{person.name}</span>
                            {person.linked_profile?.username && (
                              <span className="text-[13px] font-semibold flex-shrink-0" style={{ color: 'var(--f-blue)' }}>
                                @{person.linked_profile.username}
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="h-2" />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 pt-4 flex-shrink-0 space-y-2.5"
          style={{
            borderTop: '1px solid var(--f-line)',
            paddingBottom: 'calc(1rem + var(--safe-bottom))',
            background: 'var(--f-bg-elevated)',
          }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-4 rounded-[16px] text-white text-[17px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: cfg.color,
              boxShadow: `0 4px 20px color-mix(in srgb, ${cfg.rawColor} 30%, transparent)`,
            }}
          >
            {isPending
              ? <i className="fa-solid fa-spinner fa-spin" />
              : isEdit ? 'Guardar cambios' : 'Agregar movimiento'}
          </button>

          {needsConfirm && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="w-full py-3 rounded-[14px] text-[15px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ color: '#FF9F0A', background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.3)' }}
            >
              <i className="fa-solid fa-check mr-2" />
              Confirmar movimiento
            </button>
          )}

          {isEdit && transaction?.is_payable && !confirmDelete && (
            <button
              type="button"
              onClick={handleSettle}
              disabled={isPending}
              className="w-full py-3 rounded-[14px] text-[15px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ color: '#FF9F0A', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)' }}
            >
              <i className="fa-solid fa-circle-check mr-2" />
              Ya pagué esta deuda
            </button>
          )}

          {isEdit && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full py-3 rounded-[14px] text-[15px] font-black transition-all"
              style={{ color: 'var(--f-expense)', background: 'var(--f-expense-bg)' }}
            >
              Eliminar movimiento
            </button>
          )}
          {isEdit && confirmDelete && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 rounded-[14px] text-[15px] font-black"
                style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-2)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-3 rounded-[14px] text-white text-[15px] font-black disabled:opacity-50"
                style={{ background: 'var(--f-expense)' }}
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
