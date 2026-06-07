'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks'

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <>{formatCurrency(animated)}</>
}
import { settleParticipant, partialSettle, settleAndRecord, settleAllForPerson, abonoGlobalForPerson, collectReceivable } from '@/actions/transactions'
import { linkPersonToUser } from '@/actions/friends'
import CoachMarkTour from '@/components/onboarding/CoachMarkTour'
import type { Transaction, Person, SplitParticipant, Account, Category, AccountWithBalance, Friendship } from '@/lib/types'
import TransactionModal from '@/components/transactions/TransactionModal'
import FriendSearchModal from '@/components/friends/FriendSearchModal'
import LinkPersonModal from '@/components/friends/LinkPersonModal'

interface Props {
  transactions: Transaction[]
  people: Person[]
  accounts: Account[]
  categories: Category[]
  friendships: Friendship[]
  myUserId: string
}

interface PersonBalance {
  person: Person
  owesMe: number
  iOwe: number
  net: number
  pending: Array<{ tx: Transaction; participant: SplitParticipant }>
}

type ConfirmAction = 'settle' | 'forget' | 'partial'

export default function SharedClient({ transactions, people, accounts, categories, friendships, myUserId }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [settling, setSettling] = useState<string | null>(null)
  const [partialMode, setPartialMode] = useState<string | null>(null)
  const [partialInput, setPartialInput] = useState('')
  const [partialAccountId, setPartialAccountId] = useState('')
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPartialPending, startPartial] = useTransition()
  const [isUnlinking, startUnlink] = useTransition()
  const [unlinkConfirmId, setUnlinkConfirmId] = useState<string | null>(null)
  const [settleAccountId, setSettleAccountId] = useState('')

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
  const [collectPartialOpen, setCollectPartialOpen] = useState<string | null>(null)
  const [collectPartialAmount, setCollectPartialAmount] = useState('')
  const [isCollecting, startCollect] = useTransition()

  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [showFriendSearch, setShowFriendSearch] = useState(false)
  const [linkingPerson, setLinkingPerson] = useState<{ id: string; name: string } | null>(null)

  function requestConfirm(key: string, action: ConfirmAction) {
    setConfirmKey(key)
    setConfirmAction(action)
  }

  function cancelConfirm() { setConfirmKey(null); setConfirmAction(null); setSettleAccountId('') }

  function executeSettle(txId: string, participantId: string) {
    const key = `${txId}-${participantId}`
    setSettling(key); cancelConfirm()
    startTransition(async () => {
      const res = await settleParticipant(txId, participantId)
      if (res.error) { toast.error(res.error); setSettling(null); return }
      toast.success('Liquidado')
      setSettling(null)
    })
  }

  function executeForget(txId: string, participantId: string) {
    const key = `${txId}-${participantId}`
    setSettling(key); cancelConfirm()
    startTransition(async () => {
      const res = await settleParticipant(txId, participantId, false)
      if (res.error) { toast.error(res.error); setSettling(null); return }
      toast.success('Deuda olvidada')
      setSettling(null)
    })
  }

  function executeSettleWithRecord(txId: string, participantId: string, accountId: string) {
    const key = `${txId}-${participantId}`
    setSettling(key); cancelConfirm()
    startTransition(async () => {
      const res = await settleAndRecord(txId, participantId, accountId)
      if (res.error) { toast.error(res.error); setSettling(null); return }
      toast.success('Liquidado y registrado')
      setSettling(null)
    })
  }

  function executePartialSettle(txId: string, participantId: string) {
    const amt = parseFloat(partialInput.replace(',', '.'))
    if (isNaN(amt) || amt <= 0) { toast.error('Monto inválido'); return }
    cancelConfirm()
    startPartial(async () => {
      const res = await partialSettle(txId, participantId, amt, partialAccountId || undefined)
      if (res.error) { toast.error(res.error); return }
      toast.success(partialAccountId ? 'Abono registrado' : 'Abono aplicado')
      setPartialMode(null)
      setPartialInput('')
      setPartialAccountId('')
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

  function executeCollect(txId: string, participantId: string, mode: 'full' | 'partial') {
    const amt = mode === 'partial' ? parseFloat(collectPartialAmount.replace(',', '.')) : undefined
    if (mode === 'partial' && (isNaN(amt!) || amt! <= 0)) { toast.error('Monto inválido'); return }
    const key = `${txId}-${participantId}`
    setCollectingKey(key)
    startCollect(async () => {
      const res = await collectReceivable(txId, participantId, mode, amt)
      if (res.error) { toast.error(res.error); setCollectingKey(null); return }
      toast.success(mode === 'full' ? '¡Cobrado!' : 'Abono registrado')
      setCollectingKey(null)
      setCollectPartialOpen(null)
      setCollectPartialAmount('')
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
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
  }, [transactions, personMap])

  const totalOwesMe = balances.reduce((s, b) => s + b.owesMe, 0)
  const totalIOwe = balances.reduce((s, b) => s + b.iOwe, 0)

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
                +<AnimatedCurrency value={totalOwesMe} />
              </p>
            </div>
            <div className="rounded-[20px] p-4 animate-spring-in" style={{ background: 'var(--f-expense-bg)', border: '1px solid var(--f-expense-border)', animationDelay: '0.07s' }}>
              <p className="text-[11px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'var(--f-expense)' }}>Debo</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: 'var(--f-expense)' }}>
                -<AnimatedCurrency value={totalIOwe} />
              </p>
            </div>
          </div>
        )}

        {/* Per-person breakdown */}
        {balances.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-5 mx-auto"
              style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
              <i className="fa-solid fa-users text-3xl" style={{ color: 'var(--f-blue)' }} />
            </div>
            <p className="text-[20px] font-black mb-2" style={{ color: 'var(--f-text)' }}>Sin gastos compartidos</p>
            <p className="text-[15px] font-bold text-center max-w-xs mx-auto" style={{ color: 'var(--f-text-4)' }}>
              Al agregar un gasto, activa &quot;Compartir&quot; y asigna personas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((b, bi) => {
              const isOpen = expanded === b.person.id
              const netPositive = b.net >= 0
              const isGlobalOpen = globalSettleId === b.person.id
              const isAbonoOpen = globalAbonoId === b.person.id
              return (
                <div key={b.person.id} className="rounded-[20px] overflow-hidden animate-spring-in"
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
                        {netPositive ? '+' : '-'}<AnimatedCurrency value={Math.abs(b.net)} />
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
                      Abonar
                    </button>
                    <button
                      onClick={() => { setGlobalSettleId(isGlobalOpen ? null : b.person.id); setGlobalAbonoId(null); setGlobalAccountId('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[14px] font-black transition-all active:scale-95"
                      style={{ background: isGlobalOpen ? 'var(--f-income-bg)' : 'var(--f-bg-input)', color: isGlobalOpen ? 'var(--f-income)' : 'var(--f-text-3)', border: `1px solid ${isGlobalOpen ? 'var(--f-income-border)' : 'var(--f-line)'}` }}
                    >
                      <i className="fa-solid fa-check-double text-[12px]" />
                      Saldar todo
                    </button>
                  </div>

                  {/* Global abono panel — compact inline style */}
                  {isAbonoOpen && (
                    <div className="mx-4 mb-4 space-y-2 animate-fade-up">
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
                          placeholder={`Máx. ${formatCurrency(Math.abs(b.net))}`}
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
                            : globalAccountId ? 'Saldar y registrar' : 'Saldar sin registrar'}
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
                      {b.pending.map(({ tx, participant }) => {
                        const unpaid = participant.value - (participant.paidAmount ?? 0)
                        const isTheyOwe = tx.split_data?.splitMode === 'THEY' || tx.split_data?.splitMode === 'DIV'
                        const isReceivable = tx.is_receivable === true && tx.type === 'TR-INGRESO'
                        const key = `${tx.id}-${participant.id}`
                        const isSettling = settling === key && isPending
                        const isPartialOpen = partialMode === key
                        const isConfirming = confirmKey === key
                        const isCollectPartialOpen = collectPartialOpen === key
                        const isCollectingThis = collectingKey === key && isCollecting
                        return (
                          <div key={key} className="pt-2 space-y-2">
                            <button
                              onClick={() => setEditingTx(tx)}
                              className="w-full flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
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
                                  {' · '}
                                  <span style={{ color: 'var(--f-blue)' }}>ver</span>
                                </p>
                              </div>
                              <p className="text-[16px] font-black tabular-nums flex-shrink-0"
                                style={{ color: isTheyOwe ? 'var(--f-income)' : 'var(--f-expense)' }}>
                                {isTheyOwe ? '+' : '-'}{formatCurrency(unpaid)}
                              </p>
                            </button>

                            {/* Action buttons — receivable incomes get Cobrar/Abonar/Cancelar */}
                            {isReceivable ? (
                              !isConfirming && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => executeCollect(tx.id, participant.id, 'full')}
                                    disabled={isCollecting}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black disabled:opacity-40 transition-all active:scale-95"
                                    style={{ background: 'var(--f-income-bg)', color: 'var(--f-income)', border: '1px solid var(--f-income-border)' }}
                                  >
                                    {isCollectingThis ? <i className="fa-solid fa-spinner fa-spin" /> : '✓ Cobrar'}
                                  </button>
                                  <button
                                    onClick={() => { setCollectPartialOpen(isCollectPartialOpen ? null : key); setCollectPartialAmount('') }}
                                    disabled={isCollecting}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black disabled:opacity-40 transition-all active:scale-95"
                                    style={{ background: isCollectPartialOpen ? 'var(--f-accent-bg)' : 'var(--f-bg-input)', color: 'var(--f-blue)', border: `1px solid ${isCollectPartialOpen ? 'var(--f-accent-border)' : 'var(--f-line)'}` }}
                                  >
                                    ± Abonar
                                  </button>
                                  <button
                                    onClick={() => requestConfirm(key, 'forget')}
                                    disabled={isCollecting}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black disabled:opacity-40 transition-all active:scale-95"
                                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)', border: '1px solid var(--f-line)' }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )
                            ) : (
                              (!isConfirming || confirmAction === 'settle') && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (isConfirming && confirmAction === 'settle') { cancelConfirm(); return }
                                      setPartialMode(null); setPartialInput(''); setPartialAccountId('')
                                      requestConfirm(key, 'settle')
                                    }}
                                    disabled={isPending || isPartialPending}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black disabled:opacity-40 transition-all active:scale-95"
                                    style={{
                                      background: 'var(--f-income-bg)',
                                      color: 'var(--f-income)',
                                      border: `1px solid ${isConfirming && confirmAction === 'settle' ? 'var(--f-income)' : 'var(--f-income-border)'}`,
                                    }}
                                  >
                                    {isSettling ? <i className="fa-solid fa-spinner fa-spin" /> : isTheyOwe ? '✓ Cobrado' : '✓ Pagado'}
                                  </button>
                                  <button
                                    onClick={() => { setPartialMode(isPartialOpen ? null : key); setPartialInput(''); setPartialAccountId(''); cancelConfirm() }}
                                    disabled={isPending || isPartialPending}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black disabled:opacity-40 transition-all active:scale-95"
                                    style={{ background: isPartialOpen ? 'var(--f-accent-bg)' : 'var(--f-bg-input)', color: 'var(--f-blue)', border: `1px solid ${isPartialOpen ? 'var(--f-accent-border)' : 'var(--f-line)'}` }}
                                  >
                                    ± Abono
                                  </button>
                                  <button
                                    onClick={() => requestConfirm(key, 'forget')}
                                    disabled={isPending || isPartialPending}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black disabled:opacity-40 transition-all active:scale-95"
                                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)', border: '1px solid var(--f-line)' }}
                                  >
                                    Olvidar
                                  </button>
                                </div>
                              )
                            )}

                            {/* Settle inline expansion — only for expense debts */}
                            {!isReceivable && isConfirming && confirmAction === 'settle' && (
                              <div className="space-y-2 animate-fade-up">
                                <select
                                  value={settleAccountId}
                                  onChange={e => setSettleAccountId(e.target.value)}
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
                                    onClick={cancelConfirm}
                                    className="flex-1 py-1.5 rounded-[10px] text-[15px] font-black transition-all active:scale-95"
                                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (settleAccountId) executeSettleWithRecord(tx.id, participant.id, settleAccountId)
                                      else executeSettle(tx.id, participant.id)
                                    }}
                                    disabled={isPending}
                                    className="flex-1 py-1.5 rounded-[10px] text-[15px] font-black text-white disabled:opacity-50 transition-all active:scale-95"
                                    style={{ background: 'var(--f-income)' }}
                                  >
                                    {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Forget confirmation card */}
                            {isConfirming && confirmAction === 'forget' && (
                              <div className="rounded-[10px] p-2.5 space-y-2"
                                style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line-strong)' }}>
                                <p className="text-[15px] font-bold text-center" style={{ color: 'var(--f-text-2)' }}>
                                  {isReceivable ? '¿Cancelar este cobro pendiente?' : '¿Olvidar esta deuda?'}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={cancelConfirm}
                                    className="flex-1 py-1.5 rounded-[8px] text-[15px] font-black"
                                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => executeForget(tx.id, participant.id)}
                                    disabled={isPending}
                                    className="flex-1 py-1.5 rounded-[8px] text-[15px] font-black text-white disabled:opacity-50"
                                    style={{ background: 'var(--f-expense)' }}
                                  >
                                    {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Partial abono confirmation card — only for expense debts */}
                            {!isReceivable && isConfirming && confirmAction === 'partial' && (
                              <div className="rounded-[10px] p-2.5 space-y-2"
                                style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line-strong)' }}>
                                <p className="text-[15px] font-bold text-center" style={{ color: 'var(--f-text-2)' }}>
                                  {`¿Registrar abono de ${formatCurrency(parseFloat(partialInput.replace(',', '.')) || 0)}?`}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={cancelConfirm}
                                    className="flex-1 py-1.5 rounded-[8px] text-[15px] font-black"
                                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => executePartialSettle(tx.id, participant.id)}
                                    disabled={isPending || isPartialPending}
                                    className="flex-1 py-1.5 rounded-[8px] text-[15px] font-black text-white disabled:opacity-50"
                                    style={{ background: 'var(--f-income)' }}
                                  >
                                    {isPending || isPartialPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Partial payment input for expense debts */}
                            {!isReceivable && isPartialOpen && !isConfirming && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <input
                                    autoFocus
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={partialInput}
                                    onChange={e => setPartialInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') requestConfirm(key, 'partial') }}
                                    placeholder={`Máx. ${formatCurrency(unpaid)}`}
                                    className="flex-1 rounded-[10px] px-3 py-2 text-[16px] font-bold outline-none tabular-nums"
                                    style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-border)', color: 'var(--f-text)' }}
                                    inputMode="decimal"
                                  />
                                  <button
                                    onClick={() => requestConfirm(key, 'partial')}
                                    disabled={isPartialPending || !partialInput}
                                    className="px-3 rounded-[10px] text-[16px] font-black text-white disabled:opacity-50"
                                    style={{ background: 'var(--f-blue)' }}
                                  >
                                    OK
                                  </button>
                                </div>
                                <select
                                  value={partialAccountId}
                                  onChange={e => setPartialAccountId(e.target.value)}
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

                            {/* Partial collection input for receivable incomes */}
                            {isReceivable && isCollectPartialOpen && !isConfirming && (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={collectPartialAmount}
                                  onChange={e => setCollectPartialAmount(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter' && collectPartialAmount) executeCollect(tx.id, participant.id, 'partial') }}
                                  placeholder={`Máx. ${formatCurrency(unpaid)}`}
                                  className="flex-1 rounded-[10px] px-3 py-2 text-[16px] font-bold outline-none tabular-nums"
                                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-income-border)', color: 'var(--f-text)' }}
                                  inputMode="decimal"
                                />
                                <button
                                  onClick={() => executeCollect(tx.id, participant.id, 'partial')}
                                  disabled={isCollecting || !collectPartialAmount}
                                  className="px-3 rounded-[10px] text-[16px] font-black text-white disabled:opacity-50"
                                  style={{ background: 'var(--f-income)' }}
                                >
                                  {isCollectingThis ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
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
    </div>
  )
}
