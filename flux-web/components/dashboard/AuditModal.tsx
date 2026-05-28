'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { applyAdjustment } from '@/actions/config'
import { formatCurrency, getPaymentMethod } from '@/lib/utils'
import type { AccountWithBalance } from '@/lib/types'

function evalMath(expr: string): number | null {
  const clean = expr.trim()
  if (!clean) return null
  if (!/^[0-9.+\-*/() ]+$/.test(clean)) return null
  try {
    const result = Function(`"use strict"; return (${clean})`)()
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch {
    return null
  }
}

interface Props {
  accounts: AccountWithBalance[]
  onClose: () => void
}

export default function AuditModal({ accounts, onClose }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function getComputed(accId: string, isTDC: boolean): number | null {
    const v = inputs[accId]
    if (!v) return null
    const raw = evalMath(v)
    if (raw === null) return null
    return isTDC ? -Math.abs(raw) : raw
  }

  function handleSubmit() {
    startTransition(async () => {
      const toApply = accounts
        .map(acc => {
          const isTDC = acc.payment_method_id === 'MP-TDC'
          const computed = getComputed(acc.id, isTDC)
          if (computed === null) return null
          const delta = computed - acc.balance
          if (Math.abs(delta) < 0.01) return null
          return { acc, delta }
        })
        .filter(Boolean) as { acc: AccountWithBalance; delta: number }[]

      if (toApply.length === 0) {
        toast.info('Sin diferencias — ningún ajuste necesario')
        return
      }

      for (const { acc, delta } of toApply) {
        const res = await applyAdjustment(acc.id, acc.name, delta)
        if (res.error) { toast.error(`${acc.name}: ${res.error}`); return }
      }
      toast.success(`${toApply.length} ajuste(s) aplicado(s)`)
      onClose()
    })
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up flex flex-col mx-auto max-w-lg"
        style={{
          maxHeight: '92dvh',
          background: 'var(--f-bg-elevated)',
          borderRadius: '28px 28px 0 0',
          border: '1px solid var(--f-line-strong)',
          borderBottom: 'none',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--f-line-strong)' }} />
        </div>
        <div className="flex items-start justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--f-line)' }}>
          <div>
            <h2 className="text-[16px] font-black" style={{ color: 'var(--f-text)' }}>Auditoría de cuentas</h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--f-text-3)' }}>
              Ingresa el saldo real — soporta sumas: 500+200+800
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--f-bg-input)' }}>
            <i className="fa-solid fa-xmark text-sm" style={{ color: 'var(--f-text)' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-5 py-4 space-y-3">
            {accounts.map(acc => {
              const isTDC = acc.payment_method_id === 'MP-TDC'
              const method = getPaymentMethod(acc.payment_method_id)
              const computed = getComputed(acc.id, isTDC)
              const delta = computed !== null ? computed - acc.balance : null
              const hasChange = delta !== null && Math.abs(delta) >= 0.01

              return (
                <div
                  key={acc.id}
                  className="rounded-[16px] p-4"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className={`${method.icon} text-xs`} style={{ color: 'var(--f-text-3)' }} />
                      <p className="text-[13px] font-bold" style={{ color: 'var(--f-text)' }}>{acc.name}</p>
                      {isTDC && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--f-expense-bg)', color: 'var(--f-expense)' }}>
                          Crédito
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-black tabular-nums"
                      style={{ color: isTDC ? 'var(--f-expense)' : (acc.balance < 0 ? 'var(--f-expense)' : 'var(--f-text-3)') }}>
                      {isTDC ? `-${formatCurrency(Math.abs(acc.balance))}` : formatCurrency(acc.balance)}
                    </p>
                  </div>

                  <div className="relative">
                    {isTDC && (
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-black pointer-events-none select-none z-10"
                        style={{ color: 'var(--f-expense)' }}
                      >
                        −
                      </span>
                    )}
                    <input
                      value={inputs[acc.id] ?? ''}
                      onChange={e => setInputs(prev => ({ ...prev, [acc.id]: e.target.value }))}
                      placeholder={isTDC ? 'Deuda actual, ej: 5000+320' : 'Saldo real, ej: 1500+800'}
                      className="w-full rounded-[12px] py-2.5 pr-10 text-[14px] font-bold outline-none"
                      style={{
                        paddingLeft: isTDC ? '1.5rem' : '0.75rem',
                        background: isTDC ? 'var(--f-expense-bg)' : 'var(--f-bg-card)',
                        border: `1px solid ${hasChange
                          ? (delta! > 0 ? 'var(--f-income-border)' : 'var(--f-expense-border)')
                          : isTDC ? 'var(--f-expense-border)' : 'var(--f-line)'}`,
                        color: 'var(--f-text)',
                      }}
                      inputMode="decimal"
                    />
                    {/* "+" button kept here intentionally — audit-only feature */}
                    <button
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, [acc.id]: (prev[acc.id] ?? '') + '+' }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-[8px] flex items-center justify-center text-[13px] font-black transition-all active:scale-90"
                      style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)', border: '1px solid var(--f-line)' }}
                    >
                      +
                    </button>
                  </div>

                  {computed !== null && (
                    <div className="flex items-center justify-between mt-2.5">
                      <p className="text-[12px] font-bold" style={{ color: 'var(--f-text-3)' }}>
                        {isTDC ? 'Deuda real:' : 'Saldo real:'}{' '}
                        <span style={{ color: 'var(--f-text)' }}>{formatCurrency(Math.abs(computed))}</span>
                      </p>
                      {hasChange && (
                        <p className="text-[12px] font-black tabular-nums" style={{ color: delta! > 0 ? 'var(--f-income)' : 'var(--f-expense)' }}>
                          {delta! > 0 ? '+' : ''}{formatCurrency(delta!)}
                        </p>
                      )}
                      {!hasChange && (
                        <p className="text-[11px] font-bold" style={{ color: 'var(--f-income)' }}>
                          <i className="fa-solid fa-check mr-1" />Sin diferencia
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div
          className="px-5 py-4 flex-shrink-0"
          style={{
            borderTop: '1px solid var(--f-line)',
            paddingBottom: 'calc(4.5rem + var(--safe-bottom))',
            background: 'var(--f-bg-elevated)',
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-4 rounded-[16px] text-white text-[15px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--f-blue)', boxShadow: 'var(--f-shadow-accent)' }}
          >
            {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Aplicar ajustes'}
          </button>
        </div>
      </div>
    </>
  )
}
