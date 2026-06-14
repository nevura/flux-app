'use client'

import React, { useMemo, useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SwipeableRow } from '@/components/shared/SwipeableRow'
import { toast } from 'sonner'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks'

function AnimatedCurrency({ value, currency }: { value: number; currency?: string }) {
  const animated = useCountUp(value)
  return <>{formatCurrency(animated, currency)}</>
}
import { settleParticipant, partialSettle, settleAndRecord, settleAllForPerson, abonoGlobalForPerson, collectReceivable, proposeSyncTransaction } from '@/actions/transactions'
import { linkPersonToUser } from '@/actions/friends'
import CoachMarkTour from '@/components/onboarding/CoachMarkTour'
import type { Transaction, Person, SplitParticipant, Account, Category, AccountWithBalance, Friendship } from '@/lib/types'
import TransactionModal from '@/components/transactions/TransactionModal'
import FriendSearchModal from '@/components/friends/FriendSearchModal'
import LinkPersonModal from '@/components/friends/LinkPersonModal'

type ActionModalType = 'settle' | 'partial' | 'forget' | 'collectPartial'
interface ActionModalState {
  type: ActionModalType
  txId: string
  participantId: string
  maxAmount: number
  isReceivable: boolean
  isTheyOwe: boolean
  concept: string
  currency: string
}

interface Props {
  transactions: Transaction[]
  people: Person[]
  accounts: Account[]
  categories: Category[]
  friendships: Friendship[]
  myUserId: string
  baseCurrency: string
}

interface PersonBalance {
  person: Person
  owesMe: number
  iOwe: number
  net: number
  pending: Array<{ tx: Transaction; participant: SplitParticipant }>
}

export default function SharedClient({ transactions, people, accounts, categories, friendships, myUserId, baseCurrency }: Props) {
  const [mounted, setMounted] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPartialPending, startPartial] = useTransition()
  const [isUnlinking, startUnlink] = useTransition()
  const [unlinkConfirmId, setUnlinkConfirmId] = useState<string | null>(null)

  // Global settle state — keyed by person id
  const [globalSettleId, setGlobalSettleId] = useState<string | null>(null)
  const [globalAccountId, setGlobalAccountId] = useState('')
  const [isGlobalPending, startGlobal] = useTransition()

  // Global abono state
  const [globalAbonoId, setGlobalAbonoId] = useState<string | null>(null)
  const [globalAbonoAmount, setGlobalAbonoAmount] = useState('')
  const [globalAbonoAccountId, setGlobalAbonoAccountId] = useState('')
  const [isAbonoPending, startAbono] = useTransition()

  // Receivable collect state
  const [collectingKey, setCollectingKey] = useState<string | null>(null)
  const [isCollecting, startCollect] = useTransition()

  // Action bottom modal
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null)
  const [modalAmount, setModalAmount] = useState('')
  const [modalAccount, setModalAccount] = useState('')

  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showFriendSearch, setShowFriendSearch] = useState(false)
  const [linkingPerson, setLinkingPerson] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => setMounted(true), [])

  function closeModal() {
    setActionModal(null)
    setModalAmount('')
    setModalAccount('')
  }

  function executeSettle(txId: string, participantId: string) {
    closeModal()
    startTransition(async () => {
      const res = await settleParticipant(txId, participantId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Liquidado')
    })
  }

  function executeForget(txId: string, participantId: string) {
    closeModal()
    startTransition(async () => {
      const res = await settleParticipant(txId, participantId, false)
      if (res.error) { toast.error(res.error); return }
      toast.success('Deuda olvidada')
    })
  }

  function executeSettleWithRecord(txId: string, participantId: string, accountId: string) {
    closeModal()
    startTransition(async () => {
      const res = await settleAndRecord(txId, participantId, accountId)
      if (res.error) { toast.error(res.error); return }
      toast.success('Liquidado y registrado')
    })
  }

  function executePartialSettle(txId: string, participantId: string, amt: number, accountId: string) {
    closeModal()
    startPartial(async () => {
      const res = await partialSettle(txId, participantId, amt, accountId || undefined)
      if (res.error) { toast.error(res.error); return }
      toast.success(accountId ? 'Abono registrado' : 'Abono aplicado')
    })
  }

  function executeGlobalSettle(personId: string, personName: string, withRecord: boolean) {
    startGlobal(async () => {
      const res = await settleAllForPerson(personId, personName, withRecord && globalAccountId ? globalAccountId : undefined)
      if (res.error) { toast.error(res.error); return }
      toast.success(withRecord ? 'Saldo liquidado y registrado' : 'Saldo liquidado')
      setGlobalSettleId(null)
      setGlobalAccountId('')
    })
  }

  function executeAbonoGlobal(personId: string, personName: string) {
    const amt = parseFloat(globalAbonoAmount.replace(',', '.'))
    if (isNaN(amt) || amt <= 0) { toast.error('Monto inválido'); return }
    startAbono(async () => {
      const res = await abonoGlobalForPerson(personId, personName, amt, globalAbonoAccountId || undefined)
      if (res.error) { toast.error(res.error); return }
      toast.success(globalAbonoAccountId ? 'Abono registrado' : 'Abono aplicado')
      setGlobalAbonoId(null)
      setGlobalAbonoAmount('')
      setGlobalAbonoAccountId('')
    })
  }

  function executeCollect(txId: string, participantId: string, mode: 'full' | 'partial', amt?: number) {
    if (mode === 'partial' && (!amt || isNaN(amt) || amt <= 0)) { toast.error('Monto inválido'); return }
    closeModal()
    const key = `${txId}-${participantId}`
    setCollectingKey(key)
    startCollect(async () => {
      const res = await collectReceivable(txId, participantId, mode, amt)
      if (res.error) { toast.error(res.error); setCollectingKey(null); return }
      toast.success(mode === 'full' ? '¡Cobrado!' : 'Abono registrado')
      setCollectingKey(null)
    })
  }

  function handleUnlink(personId: string) {
    startUnlink(async () => {
      const res = await linkPersonToUser(personId, null)
      if (res.error) { toast.error(res.error); return }
      toast.success('Desvinculado')
    })
  }

  const personMap = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people])

  const balances = useMemo((): PersonBalance[] => {
    const map: Record<string, PersonBalance> = {}

    function ensure(pid: string): PersonBalance {
      if (!map[pid]) {
        map[pid] = { person: personMap[pid], owesMe: 0, iOwe: 0, net: 0, pending: [] }
      }
      return map[pid]
    }

    for (const tx of transactions) {
      if (!tx.split_data) continue
      const sd = tx.split_data
      if (!sd || !Array.isArray(sd.data)) continue
      const { splitMode, data } = sd

      for (const participant of data) {
        if (participant.id === 'PER-YO') continue
        if (participant.paidStatus) continue
        const unpaid = participant.value - (participant.paidAmount ?? 0)
        if (unpaid <= 0.005) continue

        const b = ensure(participant.id)
        if (splitMode === 'THEY' || splitMode === 'DIV') {
          b.owesMe += unpaid
        } else {
          b.iOwe += unpaid
        }
        b.pending.push({ tx, participant })
      }
    }

    for (const b of Object.values(map)) {
      b.net = b.owesMe - b.iOwe
    }

    return Object.values(map)
      .filter(b => b.person)
      .sort((a, b) => {
        if (a.net > 0 && b.net <= 0) return -1
        if (a.net <= 0 && b.net > 0) return 1
        return Math.abs(b.net) - Math.abs(a.net)
      })
  }, [transactions, personMap])

  const totalOwesMe = balances.reduce((s, b) => s + b.owesMe, 0)
  const totalIOwe = balances.reduce((s, b) => s + b.iOwe, 0)
  const hasOwesMe = balances.some(b => b.net > 0)
  const hasIOwe = balances.some(b => b.net < 0)
  const firstIoweIdx = balances.findIndex(b => b.net < 0)

  return (
    <div className="min-h-screen" style={{ background: 'var(--f-bg)' }}>
      <header
        className="sticky top-0 z-40 px-5"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top))',
          paddingBottom: '1rem',
          background: 'var(--f-bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--f-line)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-black tracking-[3px] uppercase" style={{ color: 'var(--f-text-4)' }}>Gastos</p>
            <h1 className="text-[22px] font-black leading-tight mt-0.5" style={{ color: 'var(--f-text)' }}>Compartidos</h1>
          </div>
          <button
            data-coach="shared-add-friends"
            onClick={() => setShowFriendSearch(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] text-[14px] font-black transition-all active:scale-95"
            style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)', border: '1px solid var(--f-accent-border)' }}
          >
            <i className="fa-solid fa-user-plus text-[13px]" />
            Amigos
          </button>
        </div>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Summary strip */}
        {balances.length > 0 && (
          <div data-coach="shared-summary" className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] p-4 animate-spring-in" style={{ background: 'var(--f-income-bg)', border: '1px solid var(--f-income-border)' }}>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'var(--f-income)' }}>Me deben</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: 'var(--f-income)' }}>
                +<AnimatedCurrency value={totalOwesMe} currency={baseCurrency} />
              </p>
            </div>
            <div className="rounded-[20px] p-4 animate-spring-in" style={{ background: 'var(--f-expense-bg)', border: '1px solid var(--f-expense-border)', animationDelay: '0.07s' }}>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'var(--f-expense)' }}>Debo</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: 'var(--f-expense)' }}>
                -<AnimatedCurrency value={totalIOwe} currency={baseCurrency} />
              </p>
            </div>
          </div>
        )}

        {/* Per-person breakdown */}
        {balances.length === 0 ? (
          <div className="py-12 space-y-5">
            <div className="text-center">
              <div className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-4 mx-auto"
                style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
                <i className="fa-solid fa-users text-3xl" style={{ color: 'var(--f-blue)' }} />
              </div>
              <p className="text-[20px] font-black mb-1" style={{ color: 'var(--f-text)' }}>Sin gastos compartidos</p>
              <p className="text-[14px] font-medium" style={{ color: 'var(--f-text-4)' }}>
                Registra deudas con otras personas
              </p>
            </div>
            <div className="space-y-2">
              <div className="rounded-[16px] p-4" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--f-income-bg)' }}>
                    <i className="fa-solid fa-receipt text-[16px]" style={{ color: 'var(--f-income)' }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-black" style={{ color: 'var(--f-text)' }}>Pagué yo — me deben</p>
                    <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                      En un nuevo gasto activa <strong>Compartir gasto</strong> y selecciona a los participantes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[16px] p-4" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,159,10,0.1)' }}>
                    <i className="fa-solid fa-hand-holding-dollar text-[16px]" style={{ color: '#FF9F0A' }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-black" style={{ color: 'var(--f-text)' }}>Alguien más pagó — yo les debo</p>
                    <p className="text-[13px] font-medium mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                      Usa <strong>Lo pagó otra persona</strong> para registrar lo que debes sin afectar tu saldo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((b, bi) => {
              const isOpen = expanded === b.person.id
              const netPositive = b.net >= 0
              const isGlobalOpen = globalSettleId === b.person.id
              const isAbonoOpen = globalAbonoId === b.person.id
              return (
                <React.Fragment key={b.person.id}>
                  {bi === 0 && hasOwesMe && hasIOwe && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-px" style={{ background: 'var(--f-line)' }} />
                      <p className="text-[11px] font-black tracking-[2px] uppercase px-1" style={{ color: 'var(--f-income)' }}>Me deben</p>
                      <div className="flex-1 h-px" style={{ background: 'var(--f-line)' }} />
                    </div>
                  )}
                  {bi === firstIoweIdx && firstIoweIdx > 0 && (
                    <div className="flex items-center gap-2 mt-1 mb-1">
                      <div className="flex-1 h-px" style={{ background: 'var(--f-line)' }} />
                      <p className="text-[11px] font-black tracking-[2px] uppercase px-1" style={{ color: 'var(--f-expense)' }}>Les debo</p>
                      <div className="flex-1 h-px" style={{ background: 'var(--f-line)' }} />
                    </div>
                  )}
                <div className="rounded-[20px] overflow-hidden animate-spring-in"
                  style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)', animationDelay: `${bi * 0.07}s` }}>

                  {/* Header row — tap to toggle desglose */}
                  <button
                    className="w-full flex items-center gap-3 px-4 pt-4 pb-3 text-left transition-all active:opacity-70"
                    onClick={() => { setExpanded(isOpen ? null : b.person.id); setGlobalSettleId(null); setGlobalAbonoId(null) }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: netPositive ? 'var(--f-income-bg)' : 'var(--f-expense-bg)', border: `1px solid ${netPositive ? 'var(--f-income-border)' : 'var(--f-expense-border)'}` }}>
                      <i className="fa-solid fa-user text-sm" style={{ color: netPositive ? 'var(--f-income)' : 'var(--f-expense)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[18px] font-black" style={{ color: 'var(--f-text)' }}>{b.person.name}</p>
                      <p className="text-[14px] mt-0.5 font-bold" style={{ color: 'var(--f-text-4)' }}>
                        {b.pending.length} gasto{b.pending.length !== 1 ? 's' : ''} pendiente{b.pending.length !== 1 ? 's' : ''}
                        {b.person.linked_profile?.username && (
                          <> · <span style={{ color: 'var(--f-blue)' }}>@{b.person.linked_profile.username}</span></>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[18px] font-black tabular-nums" style={{ color: netPositive ? 'var(--f-income)' : 'var(--f-expense)' }}>
                        {netPositive ? '+' : '-'}<AnimatedCurrency value={Math.abs(b.net)} currency={baseCurrency} />
                      </p>
                      <p className="text-[13px] font-bold mt-0.5" style={{ color: 'var(--f-text-4)' }}>
                        {netPositive ? 'me debe' : 'les debo'}
                      </p>
                    </div>
                    <i
                      className="fa-solid fa-chevron-right text-[13px] flex-shrink-0 ml-1 transition-transform duration-200"
                      style={{ color: 'var(--f-text-4)', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {/* 2 action buttons */}
                  <div className="flex gap-2 px-4 pb-3">
                    <button
                      onClick={() => { setGlobalAbonoId(isAbonoOpen ? null : b.person.id); setGlobalSettleId(null); setGlobalAbonoAmount(''); setGlobalAbonoAccountId('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[14px] font-black transition-all active:scale-95"
                      style={{ background: isAbonoOpen ? 'var(--f-accent-bg)' : 'var(--f-bg-input)', color: isAbonoOpen ? 'var(--f-blue)' : 'var(--f-text-3)', border: `1px solid ${isAbonoOpen ? 'var(--f-accent-border)' : 'var(--f-line)'}` }}
                    >
                      <i className="fa-solid fa-coins text-[12px]" />
                      {netPositive ? 'Me pagó' : 'Registrar pago'}
                    </button>
                    <button
                      onClick={() => { setGlobalSettleId(isGlobalOpen ? null : b.person.id); setGlobalAbonoId(null); setGlobalAccountId('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[14px] font-black transition-all active:scale-95"
                      style={{ background: isGlobalOpen ? 'var(--f-income-bg)' : 'var(--f-bg-input)', color: isGlobalOpen ? 'var(--f-income)' : 'var(--f-text-3)', border: `1px solid ${isGlobalOpen ? 'var(--f-income-border)' : 'var(--f-line)'}` }}
                    >
                      <i className="fa-solid fa-check-double text-[12px]" />
                      {netPositive ? 'Cobrar todo' : 'Liquidar deuda'}
                    </button>
                  </div>

                  {/* Global abono panel — compact inline style */}
                  {isAbonoOpen && (
                    <div className="mx-4 mb-4 space-y-2 animate-fade-up">
                      <p className="text-[13px] font-bold" style={{ color: 'var(--f-text-3)' }}>
                        {netPositive ? `¿Cuánto te pagó ${b.person.name}?` : `¿Cuánto le pagaste a ${b.person.name}?`}
                      </p>
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={globalAbonoAmount}
                          onChange={e => setGlobalAbonoAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && globalAbonoAmount) executeAbonoGlobal(b.person.id, b.person.name) }}
                          placeholder={`Máx. ${formatCurrency(Math.abs(b.net), baseCurrency)}`}
                          className="flex-1 rounded-[10px] px-3 py-2 text-[16px] font-bold outline-none tabular-nums"
                          style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-border)', color: 'var(--f-text)' }}
                        />
                        <button
                          onClick={() => executeAbonoGlobal(b.person.id, b.person.name)}
                          disabled={isAbonoPending || !globalAbonoAmount}
                          className="px-3 rounded-[10px] text-[16px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                          style={{ background: 'var(--f-blue)' }}
                        >
                          {isAbonoPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                        </button>
                      </div>
                      <select
                        value={globalAbonoAccountId}
                        onChange={e => setGlobalAbonoAccountId(e.target.value)}
                        className="w-full rounded-[10px] px-3 py-2 text-[15px] font-bold outline-none"
                        style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)', colorScheme: 'dark' }}
                      >
                        <option value="">Sin registrar en cuenta</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Global settle panel — compact inline style */}
                  {isGlobalOpen && (
                    <div className="mx-4 mb-4 space-y-2 animate-fade-up">
                      <select
                        value={globalAccountId}
                        onChange={e => setGlobalAccountId(e.target.value)}
                        className="w-full rounded-[10px] px-3 py-2 text-[15px] font-bold outline-none"
                        style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)', colorScheme: 'dark' }}
                      >
                        <option value="">Sin registrar en cuenta</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setGlobalSettleId(null); setGlobalAccountId('') }}
                          className="flex-1 py-2 rounded-[10px] text-[15px] font-black transition-all active:scale-95"
                          style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => executeGlobalSettle(b.person.id, b.person.name, !!globalAccountId)}
                          disabled={isGlobalPending}
                          className="flex-1 py-2 rounded-[10px] text-[15px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                          style={{ background: 'var(--f-income)', flex: 2 }}
                        >
                          {isGlobalPending
                            ? <i className="fa-solid fa-spinner fa-spin" />
                            : globalAccountId
                              ? (netPositive ? 'Cobrar y registrar' : 'Liquidar y registrar')
                              : (netPositive ? 'Cobrar todo' : 'Liquidar deuda')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Transaction-level breakdown */}
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2 animate-fade-up" style={{ borderTop: '1px solid var(--f-line)' }}>
                      <div className="pt-1" />
                      {/* Link / unlink Flux user */}
                      {b.person.linked_user_id ? (
                        unlinkConfirmId === b.person.id ? (
                          <div className="flex gap-2 py-1">
                            <button
                              onClick={() => setUnlinkConfirmId(null)}
                              className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black"
                              style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                            >
                              No
                            </button>
                            <button
                              onClick={() => { handleUnlink(b.person.id); setUnlinkConfirmId(null) }}
                              disabled={isUnlinking}
                              className="flex-[2] py-1.5 rounded-[8px] text-[14px] font-black text-white disabled:opacity-50"
                              style={{ background: 'var(--f-expense)' }}
                            >
                              {isUnlinking ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sí, desvincular'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUnlinkConfirmId(b.person.id)}
                            className="w-full flex items-center gap-2 py-2 text-left"
                          >
                            <i className="fa-solid fa-link-slash text-[13px]" style={{ color: 'var(--f-text-4)' }} />
                            <p className="text-[14px] font-bold" style={{ color: 'var(--f-text-4)' }}>
                              Desvincular de @{b.person.linked_profile?.username ?? '...'}
                            </p>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => setLinkingPerson({ id: b.person.id, name: b.person.name })}
                          className="w-full flex items-center gap-2 py-2 text-left"
                        >
                          <i className="fa-solid fa-link text-[13px]" style={{ color: 'var(--f-blue)' }} />
                          <p className="text-[14px] font-bold" style={{ color: 'var(--f-blue)' }}>
                            Vincular con usuario de Flux
                          </p>
                        </button>
                      )}
                      {b.pending.length > 0 && (
                        <div className="flex items-center justify-end mb-2">
                          <span className="text-[11px] font-black flex items-center gap-1" style={{ color: 'var(--f-text-4)' }}>
                            <i className="fa-solid fa-hand-point-left text-[10px]" />
                            desliza para opciones
                          </span>
                        </div>
                      )}
                      {b.pending.map(({ tx, participant }) => {
                        const unpaid = participant.value - (participant.paidAmount ?? 0)
                        const isTheyOwe = tx.split_data?.splitMode === 'THEY' || tx.split_data?.splitMode === 'DIV'
                        const isReceivable = tx.is_receivable === true && tx.type === 'TR-INGRESO'
                        const key = `${tx.id}-${participant.id}`
                        const isCollectingThis = collectingKey === key && isCollecting
                        const canSync = isTheyOwe && !!b.person.linked_user_id && !participant.paidStatus && !isReceivable
                        return (
                          <div key={key} className="pt-1">
                            <SwipeableRow
                              rightActions={[
                                isReceivable
                                  ? {
                                      icon: 'fa-solid fa-check',
                                      label: 'Cobrar',
                                      bg: 'var(--f-income)',
                                      onClick: () => executeCollect(tx.id, participant.id, 'full'),
                                    }
                                  : {
                                      icon: 'fa-solid fa-check',
                                      label: isTheyOwe ? 'Cobrado' : 'Pagado',
                                      bg: 'var(--f-income)',
                                      onClick: () => setActionModal({ type: 'settle', txId: tx.id, participantId: participant.id, maxAmount: unpaid, isReceivable, isTheyOwe, concept: tx.concept, currency: tx.currency ?? 'MXN' }),
                                    },
                                {
                                  icon: 'fa-solid fa-coins',
                                  label: isReceivable ? 'Abonar' : 'Abono',
                                  bg: 'var(--f-blue)',
                                  onClick: () => setActionModal({ type: isReceivable ? 'collectPartial' : 'partial', txId: tx.id, participantId: participant.id, maxAmount: unpaid, isReceivable, isTheyOwe, concept: tx.concept, currency: tx.currency ?? 'MXN' }),
                                },
                                {
                                  icon: 'fa-solid fa-trash',
                                  label: isReceivable ? 'Cancelar' : 'Olvidar',
                                  bg: 'var(--f-expense)',
                                  onClick: () => setActionModal({ type: 'forget', txId: tx.id, participantId: participant.id, maxAmount: unpaid, isReceivable, isTheyOwe, concept: tx.concept, currency: tx.currency ?? 'MXN' }),
                                },
                                ...(canSync ? [{
                                  icon: 'fa-solid fa-arrows-rotate',
                                  label: 'Sincronizar',
                                  bg: '#5E5CE6',
                                  onClick: () => {
                                    startTransition(async () => {
                                      const r = await proposeSyncTransaction(tx.id, participant.id)
                                      if (r.error) toast.error(r.error)
                                      else toast.success('Propuesta enviada')
                                    })
                                  },
                                }] : []),
                              ]}
                            >
                              <button
                                onClick={() => setEditingTx(tx)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:scale-[0.98] transition-transform"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    {isReceivable && (
                                      <span className="text-[10px] font-black tracking-[1px] uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                                        style={{ background: 'var(--f-income-bg)', color: 'var(--f-income)', border: '1px solid var(--f-income-border)' }}>
                                        por cobrar
                                      </span>
                                    )}
                                    <p className="text-[16px] font-bold truncate" style={{ color: 'var(--f-text)' }}>{tx.concept}</p>
                                  </div>
                                  <p className="text-[14px]" style={{ color: 'var(--f-text-4)' }}>
                                    {formatDateShort(tx.transaction_date)}
                                    {' · '}
                                    {isReceivable ? 'pendiente de cobro' : isTheyOwe ? 'te debe' : 'les debes'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <p className="text-[17px] font-black tabular-nums"
                                    style={{ color: isTheyOwe ? 'var(--f-income)' : 'var(--f-expense)' }}>
                                    {isTheyOwe ? '+' : '-'}{formatCurrency(unpaid, tx.currency ?? 'MXN')}
                                  </p>
                                  {isCollectingThis
                                    ? <i className="fa-solid fa-spinner fa-spin text-[12px]" style={{ color: 'var(--f-text-4)' }} />
                                    : <i className="fa-solid fa-chevron-right text-[10px] opacity-20" style={{ color: 'var(--f-text-3)' }} />
                                  }
                                </div>
                              </button>
                            </SwipeableRow>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                </React.Fragment>
              )
            })}
          </div>
        )}

        <div className="h-6" />
      </div>

      {editingTx && (
        <TransactionModal
          transaction={editingTx}
          accounts={accounts as unknown as AccountWithBalance[]}
          categories={categories}
          people={people}
          onClose={() => setEditingTx(null)}
        />
      )}

      {showFriendSearch && (
        <FriendSearchModal
          onClose={() => setShowFriendSearch(false)}
          existingFriendships={friendships}
          myUserId={myUserId}
        />
      )}

      {linkingPerson && (
        <LinkPersonModal
          personId={linkingPerson.id}
          personName={linkingPerson.name}
          onClose={() => setLinkingPerson(null)}
        />
      )}

      <CoachMarkTour pageKey="shared" />

      {/* Action bottom modal */}
      {mounted && actionModal && createPortal(
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'var(--f-bg-overlay)' }}
          onClick={closeModal}
        >
          <div
            className="animate-slide-up rounded-t-[28px] p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--f-bg-elevated)', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'var(--f-line-strong)' }} />

            {/* Concept */}
            <div>
              <p className="text-[13px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'var(--f-text-4)' }}>
                {actionModal.type === 'settle' ? (actionModal.isTheyOwe ? 'Confirmar cobro' : 'Confirmar pago')
                  : actionModal.type === 'partial' ? 'Registrar abono'
                  : actionModal.type === 'collectPartial' ? 'Registrar cobro parcial'
                  : actionModal.isReceivable ? 'Cancelar cobro' : 'Olvidar deuda'}
              </p>
              <p className="text-[20px] font-black" style={{ color: 'var(--f-text)' }}>{actionModal.concept}</p>
              <p className="text-[15px] font-bold mt-0.5 tabular-nums" style={{ color: actionModal.isTheyOwe ? 'var(--f-income)' : 'var(--f-expense)' }}>
                {actionModal.isTheyOwe ? '+' : '-'}{formatCurrency(actionModal.maxAmount, actionModal.currency)} pendiente
              </p>
            </div>

            {/* Settle: account selector */}
            {actionModal.type === 'settle' && (
              <div className="space-y-3">
                <select
                  value={modalAccount}
                  onChange={e => setModalAccount(e.target.value)}
                  className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold outline-none"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)', colorScheme: 'dark' }}
                >
                  <option value="">Sin registrar en cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-[14px] text-[16px] font-black transition-all active:scale-95"
                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (modalAccount) executeSettleWithRecord(actionModal.txId, actionModal.participantId, modalAccount)
                      else executeSettle(actionModal.txId, actionModal.participantId)
                    }}
                    disabled={isPending}
                    className="flex-[2] py-3 rounded-[14px] text-[16px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                    style={{ background: 'var(--f-income)' }}
                  >
                    {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : modalAccount ? (actionModal.isTheyOwe ? 'Cobrado y registrado' : 'Pagado y registrado') : (actionModal.isTheyOwe ? 'Sí, me pagó' : 'Sí, lo pagué')}
                  </button>
                </div>
              </div>
            )}

            {/* Partial abono: amount + account */}
            {actionModal.type === 'partial' && (
              <div className="space-y-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={modalAmount}
                  onChange={e => setModalAmount(e.target.value)}
                  placeholder={`Máx. ${formatCurrency(actionModal.maxAmount, actionModal.currency)}`}
                  className="w-full rounded-[14px] px-4 py-3 text-[20px] font-bold outline-none tabular-nums"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-border)', color: 'var(--f-text)' }}
                />
                <select
                  value={modalAccount}
                  onChange={e => setModalAccount(e.target.value)}
                  className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold outline-none"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)', colorScheme: 'dark' }}
                >
                  <option value="">Sin registrar en cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-[14px] text-[16px] font-black transition-all active:scale-95" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>Cancelar</button>
                  <button
                    onClick={() => {
                      const amt = parseFloat(modalAmount.replace(',', '.'))
                      if (isNaN(amt) || amt <= 0) { toast.error('Monto inválido'); return }
                      executePartialSettle(actionModal.txId, actionModal.participantId, amt, modalAccount)
                    }}
                    disabled={isPartialPending || !modalAmount}
                    className="flex-[2] py-3 rounded-[14px] text-[16px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                    style={{ background: 'var(--f-blue)' }}
                  >
                    {isPartialPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Registrar abono'}
                  </button>
                </div>
              </div>
            )}

            {/* Collect partial: amount only */}
            {actionModal.type === 'collectPartial' && (
              <div className="space-y-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={modalAmount}
                  onChange={e => setModalAmount(e.target.value)}
                  placeholder={`Máx. ${formatCurrency(actionModal.maxAmount, actionModal.currency)}`}
                  className="w-full rounded-[14px] px-4 py-3 text-[20px] font-bold outline-none tabular-nums"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-income-border)', color: 'var(--f-text)' }}
                />
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-[14px] text-[16px] font-black transition-all active:scale-95" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>Cancelar</button>
                  <button
                    onClick={() => {
                      const amt = parseFloat(modalAmount.replace(',', '.'))
                      executeCollect(actionModal.txId, actionModal.participantId, 'partial', amt)
                    }}
                    disabled={isCollecting || !modalAmount}
                    className="flex-[2] py-3 rounded-[14px] text-[16px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                    style={{ background: 'var(--f-income)' }}
                  >
                    {isCollecting ? <i className="fa-solid fa-spinner fa-spin" /> : 'Registrar cobro'}
                  </button>
                </div>
              </div>
            )}

            {/* Forget: confirmation */}
            {actionModal.type === 'forget' && (
              <div className="space-y-3">
                <p className="text-[15px] font-medium text-center" style={{ color: 'var(--f-text-3)' }}>
                  {actionModal.isReceivable
                    ? 'Esto cancelará el cobro pendiente sin registrar nada.'
                    : 'Esto marcará la deuda como saldada sin registrar ningún movimiento en tu cuenta.'}
                </p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-[14px] text-[16px] font-black transition-all active:scale-95" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>Cancelar</button>
                  <button
                    onClick={() => executeForget(actionModal.txId, actionModal.participantId)}
                    disabled={isPending}
                    className="flex-[2] py-3 rounded-[14px] text-[16px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                    style={{ background: 'var(--f-expense)' }}
                  >
                    {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : actionModal.isReceivable ? 'Cancelar cobro' : 'Olvidar deuda'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
