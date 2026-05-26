'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { settleParticipant, partialSettle, settleAndRecord } from '@/actions/transactions'
import type { Transaction, Person, SplitParticipant, Account, Category, AccountWithBalance } from '@/lib/types'
import TransactionModal from '@/components/transactions/TransactionModal'

interface Props {
  transactions: Transaction[]
  people: Person[]
  accounts: Account[]
  categories: Category[]
}

interface PersonBalance {
  person: Person
  owesMe: number
  iOwe: number
  net: number
  pending: Array<{ tx: Transaction; participant: SplitParticipant }>
}

type ConfirmAction = 'settle' | 'forget' | 'partial'

export default function SharedClient({ transactions, people, accounts, categories }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [settling, setSettling] = useState<string | null>(null)
  const [partialMode, setPartialMode] = useState<string | null>(null)
  const [partialInput, setPartialInput] = useState('')
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isPartialPending, startPartial] = useTransition()
  const [settleAccountId, setSettleAccountId] = useState('')
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

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
      const res = await settleParticipant(txId, participantId)
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
      const res = await partialSettle(txId, participantId, amt)
      if (res.error) { toast.error(res.error); return }
      toast.success('Abono registrado')
      setPartialMode(null)
      setPartialInput('')
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
    <div className="min-h-screen" style={{ background: '#020617' }}>
      <header
        className="sticky top-0 z-40 px-5"
        style={{
          paddingTop: 'calc(1.25rem + var(--safe-top))',
          paddingBottom: '1rem',
          background: 'rgba(2,6,23,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <p className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Gastos</p>
        <h1 className="text-[22px] font-black text-white leading-tight mt-0.5">Compartidos</h1>
      </header>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Summary strip */}
        {balances.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] p-4" style={{ background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)' }}>
              <p className="text-[9px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'rgba(48,209,88,0.7)' }}>Me deben</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#30D158' }}>
                +{formatCurrency(totalOwesMe)}
              </p>
            </div>
            <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)' }}>
              <p className="text-[9px] font-black tracking-[2px] uppercase mb-1" style={{ color: 'rgba(255,69,58,0.7)' }}>Debo</p>
              <p className="text-[22px] font-black tabular-nums leading-none" style={{ color: '#FF453A' }}>
                -{formatCurrency(totalIOwe)}
              </p>
            </div>
          </div>
        )}

        {/* Per-person breakdown */}
        {balances.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-[28px] flex items-center justify-center mb-5 mx-auto"
              style={{ background: 'rgba(100,210,255,0.1)', border: '1px solid rgba(100,210,255,0.2)' }}>
              <i className="fa-solid fa-users text-3xl" style={{ color: '#64D2FF' }} />
            </div>
            <p className="text-[18px] font-black text-white mb-2">Sin gastos compartidos</p>
            <p className="text-[13px] font-bold text-center max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Al agregar un gasto, activa &quot;Compartir&quot; y asigna personas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map(b => {
              const isOpen = expanded === b.person.id
              const netPositive = b.net >= 0
              return (
                <div key={b.person.id} className="rounded-[20px] overflow-hidden" style={{ background: '#0F172A', border: '1px solid rgba(0,122,255,0.12)' }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : b.person.id)}
                    className="w-full flex items-center gap-4 px-5 py-4"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: netPositive ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)' }}>
                      <i className="fa-solid fa-user text-base" style={{ color: netPositive ? '#30D158' : '#FF453A' }} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[16px] font-black text-white">{b.person.name}</p>
                      <p className="text-[12px] mt-0.5 font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {b.pending.length} gasto{b.pending.length !== 1 ? 's' : ''} pendiente{b.pending.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[16px] font-black tabular-nums" style={{ color: netPositive ? '#30D158' : '#FF453A' }}>
                        {netPositive ? '+' : '-'}{formatCurrency(Math.abs(b.net))}
                      </p>
                      <p className="text-[12px] font-black mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {netPositive ? 'me debe' : 'les debo'}
                      </p>
                    </div>
                    <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-xs ml-1 flex-shrink-0`} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {b.pending.map(({ tx, participant }) => {
                        const unpaid = participant.value - (participant.paidAmount ?? 0)
                        const isTheyOwe = tx.split_data?.splitMode === 'THEY' || tx.split_data?.splitMode === 'DIV'
                        const key = `${tx.id}-${participant.id}`
                        const isSettling = settling === key && isPending
                        const isPartialOpen = partialMode === key
                        const isConfirming = confirmKey === key
                        return (
                          <div key={key} className="pt-3 space-y-2">
                            <button
                              onClick={() => setEditingTx(tx)}
                              className="w-full flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-bold text-white truncate">{tx.concept}</p>
                                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                  {formatDateShort(tx.transaction_date)}
                                  {' · '}
                                  {isTheyOwe ? 'te debe' : 'les debes'}
                                  {' · '}
                                  <span style={{ color: '#007AFF' }}>ver</span>
                                </p>
                              </div>
                              <p className="text-[14px] font-black tabular-nums flex-shrink-0" style={{ color: isTheyOwe ? '#30D158' : '#FF453A' }}>
                                {isTheyOwe ? '+' : '-'}{formatCurrency(unpaid)}
                              </p>
                            </button>

                            {/* Confirmation prompt */}
                            {isConfirming ? (
                              <div className="rounded-[10px] p-2.5 space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {confirmAction === 'settle' ? (
                                  <>
                                    <p className="text-[14px] font-bold text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                      {isTheyOwe ? '¿A qué cuenta cayó el cobro?' : '¿De qué cuenta salió el pago?'}
                                    </p>
                                    <select
                                      value={settleAccountId}
                                      onChange={e => setSettleAccountId(e.target.value)}
                                      className="w-full rounded-[8px] px-3 py-2 text-[14px] font-bold text-white outline-none"
                                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }}
                                    >
                                      <option value="">Sin registrar en cuenta</option>
                                      {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                      ))}
                                    </select>
                                  </>
                                ) : (
                                  <p className="text-[14px] font-bold text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {confirmAction === 'forget' ? '¿Olvidar esta deuda?' :
                                      `¿Registrar abono de ${formatCurrency(parseFloat(partialInput.replace(',', '.')) || 0)}?`}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={cancelConfirm}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black"
                                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirmAction === 'settle') {
                                        if (settleAccountId) executeSettleWithRecord(tx.id, participant.id, settleAccountId)
                                        else executeSettle(tx.id, participant.id)
                                      } else if (confirmAction === 'forget') {
                                        executeForget(tx.id, participant.id)
                                      } else {
                                        executePartialSettle(tx.id, participant.id)
                                      }
                                    }}
                                    disabled={isPending || isPartialPending}
                                    className="flex-1 py-1.5 rounded-[8px] text-[14px] font-black text-white disabled:opacity-50"
                                    style={{ background: confirmAction === 'forget' ? '#FF453A' : '#30D158' }}
                                  >
                                    {isPending || isPartialPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Normal action buttons */
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => requestConfirm(key, 'settle')}
                                  disabled={isPending || isPartialPending}
                                  className="flex-1 py-1.5 rounded-[8px] text-[12px] font-black disabled:opacity-40 transition-all active:scale-95"
                                  style={{ background: 'rgba(48,209,88,0.15)', color: '#30D158', border: '1px solid rgba(48,209,88,0.25)' }}
                                >
                                  {isSettling ? <i className="fa-solid fa-spinner fa-spin" /> : isTheyOwe ? '✓ Cobrado' : '✓ Pagado'}
                                </button>
                                <button
                                  onClick={() => { setPartialMode(isPartialOpen ? null : key); setPartialInput(''); cancelConfirm() }}
                                  disabled={isPending || isPartialPending}
                                  className="flex-1 py-1.5 rounded-[8px] text-[12px] font-black disabled:opacity-40 transition-all active:scale-95"
                                  style={{ background: isPartialOpen ? 'rgba(0,122,255,0.2)' : 'rgba(0,122,255,0.1)', color: '#007AFF', border: '1px solid rgba(0,122,255,0.25)' }}
                                >
                                  ± Abono
                                </button>
                                <button
                                  onClick={() => requestConfirm(key, 'forget')}
                                  disabled={isPending || isPartialPending}
                                  className="flex-1 py-1.5 rounded-[8px] text-[12px] font-black disabled:opacity-40 transition-all active:scale-95"
                                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                  Olvidar
                                </button>
                              </div>
                            )}

                            {/* Partial payment input */}
                            {isPartialOpen && !isConfirming && (
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
                                  className="flex-1 rounded-[10px] px-3 py-2 text-[14px] font-bold text-white outline-none tabular-nums"
                                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(0,122,255,0.3)' }}
                                  inputMode="decimal"
                                />
                                <button
                                  onClick={() => requestConfirm(key, 'partial')}
                                  disabled={isPartialPending}
                                  className="px-3 rounded-[10px] text-[14px] font-black text-white disabled:opacity-50"
                                  style={{ background: '#007AFF' }}
                                >
                                  OK
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
    </div>
  )
}
