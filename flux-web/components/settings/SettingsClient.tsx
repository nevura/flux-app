'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getCategoryDisplay, getPaymentMethod, formatCurrency } from '@/lib/utils'
import { STATIC_ICONS, STATIC_COLORS, PAYMENT_METHODS, SHORTCUT_LINKS } from '@/lib/constants'
import { saveCategory, deleteCategory, saveAccount, deleteAccount, saveScheduled, deleteScheduled, updateProfile, saveDefaultBudget, addPerson, updatePerson, deletePerson } from '@/actions/config'
import type { Profile, Category, Account, ScheduledTransaction, Person } from '@/lib/types'
import ShortcutInstall from './ShortcutInstall'

interface Props {
  profile: Profile | null
  shortcutToken: string
  categories: Category[]
  accounts: Account[]
  scheduled: ScheduledTransaction[]
  people: Person[]
}

type Tab = 'shortcuts' | 'categorias' | 'cuentas' | 'planificados' | 'personas'

// ── Bottom Sheet ──────────────────────────────────────────────────────────────

function BottomSheet({ onClose, children, title }: { onClose: () => void; children: React.ReactNode; title?: string }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])
  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 animate-fade-in" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[200] rounded-t-[28px] animate-slide-up mx-auto max-w-lg"
        style={{ background: '#0F172A', paddingBottom: 'calc(1.5rem + var(--safe-bottom))', maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-[15px] font-black text-white">{title}</p>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <i className="fa-solid fa-xmark text-white text-xs" />
            </button>
          </div>
        )}
        {children}
      </div>
    </>,
    document.body
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SettingsClient({ profile, shortcutToken, categories, accounts, scheduled, people }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('shortcuts')
  const [isPending, startTransition] = useTransition()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.full_name ?? '')
  const [isNamePending, startNameTx] = useTransition()
  const [editingDefBudget, setEditingDefBudget] = useState(false)
  const [defBudgetInput, setDefBudgetInput] = useState(profile?.default_monthly_budget ? String(profile.default_monthly_budget) : '')
  const [isDefBudgetPending, startDefBudgetTx] = useTransition()

  function handleSaveName() {
    startNameTx(async () => {
      const res = await updateProfile(nameInput)
      if (res.error) toast.error(res.error)
      else { toast.success('Nombre actualizado'); setEditingName(false) }
    })
  }

  function handleSaveDefBudget() {
    const amount = defBudgetInput.trim() ? parseFloat(defBudgetInput) : null
    if (amount !== null && (isNaN(amount) || amount < 0)) { toast.error('Monto inválido'); return }
    startDefBudgetTx(async () => {
      const res = await saveDefaultBudget(amount)
      if (res.error) toast.error(res.error)
      else { toast.success('Presupuesto predeterminado guardado'); setEditingDefBudget(false) }
    })
  }

  const customCategories = categories.filter(c => c.user_id !== null)
  const defaultCategories = categories.filter(c => c.user_id === null)
  const displayName = nameInput || profile?.full_name

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const TABS: { key: Tab; icon: string; label: string }[] = [
    { key: 'shortcuts', icon: 'fa-solid fa-mobile-screen', label: 'Atajos' },
    { key: 'planificados', icon: 'fa-solid fa-calendar', label: 'Recurrentes' },
    { key: 'cuentas', icon: 'fa-solid fa-wallet', label: 'Cuentas' },
    { key: 'categorias', icon: 'fa-solid fa-tags', label: 'Categorías' },
    { key: 'personas', icon: 'fa-solid fa-users', label: 'Personas' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#020617' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5 pb-3"
        style={{
          paddingTop: 'calc(1rem + var(--safe-top))',
          background: 'rgba(2,6,23,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,122,255,0.12)',
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Ajustes</h1>
          <button
            onClick={handleSignOut}
            className="text-sm flex items-center gap-1.5 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <i className="fa-solid fa-right-from-bracket" />
            Salir
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 mt-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: '#007AFF' }}>
            {(displayName || profile?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                  placeholder="Tu nombre"
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-lg font-semibold text-white outline-none min-w-0"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,122,255,0.4)' }}
                />
                <button onClick={handleSaveName} disabled={isNamePending} className="text-xs font-bold flex-shrink-0" style={{ color: '#007AFF' }}>
                  {isNamePending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                </button>
                <button onClick={() => setEditingName(false)} className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-semibold text-white truncate">{displayName || 'Sin nombre'}</p>
                <button onClick={() => setEditingName(true)} className="transition-colors flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <i className="fa-solid fa-pencil text-[10px]" />
                </button>
              </div>
            )}
            {/* Show email only if no display name set */}
            {!displayName && (
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.email}</p>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold transition-all"
              style={activeTab === tab.key
                ? { background: '#007AFF', color: 'white' }
                : { color: 'rgba(255,255,255,0.4)' }}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div key={activeTab} className="px-4 py-4 max-w-lg mx-auto animate-fade-in">
        {activeTab === 'shortcuts' && (
          <div className="space-y-4">
            {/* Default budget */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0F172A', border: '1px solid rgba(0,122,255,0.15)' }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(0,122,255,0.08)' }}>
                <i className="fa-solid fa-chart-line text-xl" style={{ color: '#007AFF' }} />
                <p className="text-sm font-bold text-white">Presupuesto predeterminado</p>
              </div>
              <div className="px-4 py-3">
                {editingDefBudget ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      autoFocus
                      value={defBudgetInput}
                      onChange={e => setDefBudgetInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveDefBudget(); if (e.key === 'Escape') setEditingDefBudget(false) }}
                      placeholder="0.00 (vacío para quitar)"
                      className="flex-1 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none tabular-nums"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,122,255,0.4)' }}
                      inputMode="decimal"
                    />
                    <button onClick={handleSaveDefBudget} disabled={isDefBudgetPending} className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: '#007AFF' }}>
                      {isDefBudgetPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                    </button>
                    <button onClick={() => setEditingDefBudget(false)} className="px-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold" style={{ color: profile?.default_monthly_budget ? 'white' : 'rgba(255,255,255,0.3)' }}>
                      {profile?.default_monthly_budget ? `${formatCurrency(profile.default_monthly_budget)} / mes` : 'Sin presupuesto predeterminado'}
                    </p>
                    <button onClick={() => setEditingDefBudget(true)} className="text-sm font-semibold flex items-center gap-1" style={{ color: '#007AFF' }}>
                      <i className="fa-solid fa-pencil text-[14px]" /> Editar
                    </button>
                  </div>
                )}
                <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Se aplica cuando no hay presupuesto configurado para el mes actual.
                </p>
              </div>
            </div>

            <ShortcutInstall token={shortcutToken} />
          </div>
        )}

        {activeTab === 'categorias' && (
          <CategoriesTab
            customCategories={customCategories}
            defaultCategories={defaultCategories}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}

        {activeTab === 'cuentas' && (
          <AccountsTab
            accounts={accounts}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}

        {activeTab === 'planificados' && (
          <ScheduledTab
            scheduled={scheduled}
            categories={categories}
            accounts={accounts}
            people={people}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}

        {activeTab === 'personas' && (
          <PeopleTab
            people={people}
            isPending={isPending}
            startTransition={startTransition}
          />
        )}
      </div>
    </div>
  )
}

// ── Categories Tab ────────────────────────────────────────────────────────────

function CategoriesTab({ customCategories, defaultCategories, isPending, startTransition }: {
  customCategories: Category[]
  defaultCategories: Category[]
  isPending: boolean
  startTransition: (fn: () => void) => void
}) {
  const [editing, setEditing] = useState<Partial<Category> | null>(null)

  function handleSave() {
    if (!editing?.name) return
    startTransition(async () => {
      const res = await saveCategory({ name: editing.name!, icon_id: editing.icon_id ?? 'IC-009', color_id: editing.color_id ?? 'COL-21', id: editing.id })
      if (res.error) toast.error(res.error)
      else { toast.success('Categoría guardada'); setEditing(null) }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteCategory(id)
      if (res.error) toast.error(res.error)
      else toast.success('Eliminada')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Mis categorías</p>
        <button onClick={() => setEditing({})} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#007AFF' }}>
          <i className="fa-solid fa-plus" /> Nueva
        </button>
      </div>

      {customCategories.length === 0 && !editing && (
        <p className="text-sm text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>Sin categorías personalizadas</p>
      )}

      <div className="space-y-2">
        {customCategories.map((cat, i) => {
          const d = getCategoryDisplay(cat)
          return (
            <div key={cat.id} className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(0,122,255,0.12)', animationDelay: `${i * 0.04}s` }}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d.bg}`}>
                <i className={`${d.icon} ${d.color} text-sm`} />
              </div>
              <span className="flex-1 text-sm font-semibold text-white">{cat.name}</span>
              <button onClick={() => setEditing(cat)} className="px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <i className="fa-solid fa-pen text-xs" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <i className="fa-solid fa-trash text-xs" />
              </button>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[2px] mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Predeterminadas</p>
      <div className="grid grid-cols-4 gap-2">
        {defaultCategories.map(cat => {
          const d = getCategoryDisplay(cat)
          return (
            <div key={cat.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${d.bg} opacity-60`}>
              <i className={`${d.icon} ${d.color} text-base`} />
              <span className={`text-[9px] font-semibold text-center ${d.color}`}>{cat.name.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>

      {/* Bottom sheet editor */}
      {editing !== null && (
        <BottomSheet title={editing.id ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setEditing(null)}>
          <div className="px-5 pb-2 space-y-4">
            <input
              autoFocus
              value={editing.name ?? ''}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="Nombre de la categoría"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:opacity-30 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Icono</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {STATIC_ICONS.slice(0, 20).map(ic => (
                  <button
                    key={ic.id_icon}
                    type="button"
                    onClick={() => setEditing({ ...editing, icon_id: ic.id_icon })}
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={editing.icon_id === ic.id_icon
                      ? { background: '#007AFF' }
                      : { background: 'rgba(255,255,255,0.07)' }}
                  >
                    <i className={`${ic.icon_base} text-sm`} style={{ color: editing.icon_id === ic.id_icon ? 'white' : 'rgba(255,255,255,0.5)' }} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[1.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Color</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {STATIC_COLORS.map(col => (
                  <button
                    key={col.id_color}
                    type="button"
                    onClick={() => setEditing({ ...editing, color_id: col.id_color })}
                    className="flex-shrink-0 w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: col.hex,
                      borderColor: editing.color_id === col.id_color ? 'white' : 'transparent',
                      transform: editing.color_id === col.id_color ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending || !editing.name} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: '#007AFF' }}>
                Guardar
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// ── Accounts Tab ──────────────────────────────────────────────────────────────

function AccountsTab({ accounts, isPending, startTransition }: {
  accounts: Account[]
  isPending: boolean
  startTransition: (fn: () => void) => void
}) {
  const [editing, setEditing] = useState<Partial<Account> | null>(null)

  function handleSave() {
    if (!editing?.name) return
    startTransition(async () => {
      const res = await saveAccount({ name: editing.name!, payment_method_id: editing.payment_method_id ?? 'MP-EFECTIVO', id: editing.id, payment_day: editing.payment_day, color_id: editing.color_id ?? 'COL-01' })
      if (res.error) toast.error(res.error)
      else { toast.success('Cuenta guardada'); setEditing(null) }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteAccount(id)
      if (res.error) toast.error(res.error)
      else toast.success('Eliminada')
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Cuentas</p>
        <button onClick={() => setEditing({})} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#007AFF' }}>
          <i className="fa-solid fa-plus" /> Nueva
        </button>
      </div>

      <div className="space-y-2">
        {accounts.map((acc, i) => {
          const method = getPaymentMethod(acc.payment_method_id)
          return (
            <div key={acc.id} className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(0,122,255,0.12)', animationDelay: `${i * 0.04}s` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,122,255,0.12)' }}>
                <i className={`${method.icon} text-sm`} style={{ color: '#007AFF' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{acc.name}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{method.nombre}</p>
              </div>
              <button onClick={() => setEditing(acc)} className="px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <i className="fa-solid fa-pen text-xs" />
              </button>
              <button onClick={() => handleDelete(acc.id)} className="px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <i className="fa-solid fa-trash text-xs" />
              </button>
            </div>
          )
        })}
      </div>

      {editing !== null && (
        <BottomSheet title={editing.id ? 'Editar cuenta' : 'Nueva cuenta'} onClose={() => setEditing(null)}>
          <div className="px-5 pb-2 space-y-4">
            <input
              autoFocus
              value={editing.name ?? ''}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="Nombre de la cuenta"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:opacity-30 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id_metodo_pago}
                  type="button"
                  onClick={() => setEditing({ ...editing, payment_method_id: m.id_metodo_pago })}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  style={editing.payment_method_id === m.id_metodo_pago
                    ? { background: 'rgba(0,122,255,0.15)', borderColor: 'rgba(0,122,255,0.5)', color: '#007AFF' }
                    : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
            {editing.payment_method_id === 'MP-TDC' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-[1.5px] mb-1.5 block" style={{ color: 'rgba(255,255,255,0.35)' }}>Día de pago</label>
                <input
                  type="number"
                  min={1} max={31}
                  value={editing.payment_day ?? ''}
                  onChange={e => setEditing({ ...editing, payment_day: Number(e.target.value) })}
                  placeholder="Ej: 15"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>Cancelar</button>
              <button onClick={handleSave} disabled={isPending || !editing.name} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: '#007AFF' }}>Guardar</button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

// ── Scheduled Tab ─────────────────────────────────────────────────────────────

type SchedForm = {
  id?: string
  name: string
  type: 'TR-GASTO' | 'TR-INGRESO' | 'TR-TRANSFER'
  amount: string
  category_id: string
  account_id: string
  destination_account_id: string
  frequency_num: number
  frequency_unit: 'dia' | 'semana' | 'mes' | 'año'
  payment_day: string
  notification_days: number
  status: 'ACTIVO' | 'PAUSADO'
  splitEnabled: boolean
  quickMode: 'equal' | 'manual'
  splitSelected: string[]
  manualAmounts: Record<string, string>
}

const EMPTY_FORM: SchedForm = {
  name: '', type: 'TR-GASTO', amount: '',
  category_id: '', account_id: '', destination_account_id: '',
  frequency_num: 1, frequency_unit: 'mes', payment_day: '',
  notification_days: 1, status: 'ACTIVO',
  splitEnabled: false, quickMode: 'equal', splitSelected: [], manualAmounts: {},
}

function evalExpr(s: string): number {
  const clean = s.replace(/[^0-9+\-*/.()]/g, '')
  if (!clean) return 0
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${clean})`)()
    return typeof result === 'number' && isFinite(result) ? Math.max(0, Math.round(result * 100) / 100) : 0
  } catch { return 0 }
}

const TYPE_CONFIG = {
  'TR-GASTO': { label: 'Gasto', color: '#FF453A', icon: 'fa-solid fa-arrow-up-right' },
  'TR-INGRESO': { label: 'Ingreso', color: '#30D158', icon: 'fa-solid fa-arrow-down-left' },
  'TR-TRANSFER': { label: 'Transferencia', color: '#64D2FF', icon: 'fa-solid fa-shuffle' },
}

function ScheduledTab({ scheduled, categories, accounts, people, isPending, startTransition }: {
  scheduled: ScheduledTransaction[]
  categories: Category[]
  accounts: Account[]
  people: Person[]
  isPending: boolean
  startTransition: (fn: () => void) => void
}) {
  const [editing, setEditing] = useState<SchedForm | null>(null)
  const [localPeople, setLocalPeople] = useState(people)
  const [newPersonName, setNewPersonName] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)
  const [isAddingPerson, startAddPerson] = useTransition()
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const otherPeople = localPeople.filter(p => !p.is_me)

  function handleAddPerson() {
    const name = newPersonName.trim()
    if (!name) return
    startAddPerson(async () => {
      const res = await addPerson(name)
      if (res.error) { toast.error(res.error); return }
      if (res.person) {
        setLocalPeople(prev => [...prev, res.person!])
        if (editing) setEditing({ ...editing, splitSelected: [...editing.splitSelected, res.person!.id] })
      }
      setNewPersonName(''); setAddingPerson(false)
    })
  }

  // Monthly expense metric — normalize all active expenses to monthly cost
  const monthlyExpenses = scheduled
    .filter(s => s.status === 'ACTIVO' && s.type === 'TR-GASTO')
    .reduce((sum, s) => {
      const daysMap: Record<string, number> = { dia: 1, semana: 7, mes: 30, año: 365 }
      const daysPerCycle = s.frequency_num * daysMap[s.frequency_unit]
      return sum + Number(s.amount) * (30 / daysPerCycle)
    }, 0)

  function openNew() {
    setEditing({ ...EMPTY_FORM, account_id: accounts[0]?.id ?? '' })
  }

  function openEdit(s: ScheduledTransaction) {
    const sd = s.split_data as { splitMode?: string; data?: Array<{ id: string; value: number }> } | null
    setEditing({
      id: s.id,
      name: s.name,
      type: s.type,
      amount: String(s.amount),
      category_id: s.category_id ?? '',
      account_id: s.account_id,
      destination_account_id: s.destination_account_id ?? '',
      frequency_num: s.frequency_num,
      frequency_unit: s.frequency_unit,
      payment_day: s.payment_day ? String(s.payment_day) : '',
      notification_days: s.notification_days,
      status: s.status === 'CANCELADO' ? 'PAUSADO' : s.status,
      splitEnabled: sd != null,
      quickMode: sd?.splitMode === 'DIV' ? 'equal' : 'manual',
      splitSelected: sd?.data?.filter(d => d.id !== 'PER-YO').map(d => d.id) ?? [],
      manualAmounts: Object.fromEntries(sd?.data?.filter(d => d.id !== 'PER-YO').map(d => [d.id, String(d.value)]) ?? []),
    })
  }

  function handleSave() {
    if (!editing?.name || !editing.amount || !editing.account_id) {
      toast.error('Completa nombre, monto y cuenta'); return
    }
    const amount = parseFloat(editing.amount)
    if (isNaN(amount) || amount <= 0) { toast.error('Monto inválido'); return }

    let split_data = null
    if (editing.splitEnabled && editing.type === 'TR-GASTO' && editing.splitSelected.length > 0) {
      const selected = otherPeople.filter(p => editing.splitSelected.includes(p.id))
      const n = selected.length
      const perPerson = Math.round((amount / (n + 1)) * 100) / 100
      split_data = {
        mode: 'AMT',
        splitMode: editing.quickMode === 'equal' ? 'DIV' : 'THEY',
        data: selected.map(p => ({
          id: p.id, nombre: p.name,
          value: editing.quickMode === 'manual' ? evalExpr(editing.manualAmounts[p.id] ?? '0') : perPerson,
          paidAmount: 0, paidStatus: false,
        })),
      }
    }

    startTransition(async () => {
      const payload: Partial<ScheduledTransaction> = {
        id: editing.id,
        name: editing.name,
        type: editing.type,
        amount,
        category_id: editing.category_id || null,
        account_id: editing.account_id,
        destination_account_id: editing.type === 'TR-TRANSFER' ? editing.destination_account_id || null : null,
        frequency_num: editing.frequency_num,
        frequency_unit: editing.frequency_unit,
        payment_day: editing.payment_day ? Number(editing.payment_day) : null,
        notification_days: editing.notification_days,
        status: editing.status,
        split_data: split_data as import('@/lib/types').SplitData | null,
      }
      const res = await saveScheduled(payload)
      if (res.error) toast.error(res.error)
      else { toast.success(editing.id ? 'Recurrente actualizado' : 'Recurrente creado'); setEditing(null) }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteScheduled(id)
      if (res.error) toast.error(res.error)
      else toast.success('Eliminado')
    })
  }

  function handleToggle(s: ScheduledTransaction) {
    startTransition(async () => {
      const res = await saveScheduled({ ...s, status: s.status === 'ACTIVO' ? 'PAUSADO' : 'ACTIVO' })
      if (res.error) toast.error(res.error)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Transacciones recurrentes</p>
        <button onClick={openNew} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#007AFF' }}>
          <i className="fa-solid fa-plus" /> Nueva
        </button>
      </div>

      {/* Monthly expense metric */}
      {scheduled.filter(s => s.status === 'ACTIVO' && s.type === 'TR-GASTO').length > 0 && (
        <div
          className="rounded-[16px] px-4 py-3 flex items-center justify-between"
          style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-repeat text-xs" style={{ color: '#FF453A' }} />
            <p className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Gastos recurrentes / mes</p>
          </div>
          <p className="text-[15px] font-black tabular-nums" style={{ color: '#FF453A' }}>
            −{formatCurrency(monthlyExpenses)}
          </p>
        </div>
      )}

      {scheduled.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.25)' }}>Sin recurrentes configurados</p>
      )}

      {scheduled.map((s, i) => {
        const cat = catMap[s.category_id ?? '']
        const d = getCategoryDisplay(cat)
        const isActive = s.status === 'ACTIVO'
        return (
          <div key={s.id} className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(0,122,255,0.12)', animationDelay: `${i * 0.04}s` }}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d.bg}`}>
              <i className={`${d.icon} ${d.color} text-sm`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{s.name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Cada {s.frequency_num} {s.frequency_unit} · {formatCurrency(Number(s.amount))}
              </p>
            </div>
            <button onClick={() => openEdit(s)} className="px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <i className="fa-solid fa-pen text-xs" />
            </button>
            <div
              onClick={() => handleToggle(s)}
              className="w-9 h-5 rounded-full relative cursor-pointer transition-colors flex-shrink-0"
              style={{ background: isActive ? '#007AFF' : 'rgba(255,255,255,0.15)' }}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <button onClick={() => handleDelete(s.id)} className="px-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <i className="fa-solid fa-trash text-xs" />
            </button>
          </div>
        )
      })}

      {/* New / Edit modal */}
      {editing !== null && (() => {
        const cfg = TYPE_CONFIG[editing.type]
        const filteredCats = categories.filter(c => {
          if (c.id === 'CAT-AUDIT') return false
          if (editing.type === 'TR-INGRESO') return ['CAT-DEF-HON', 'CAT-DEF-INV', 'CAT-DEF-VENT', 'CAT-DEF-OTHER'].includes(c.id) || c.user_id !== null
          return true
        })
        const splitCount = editing.splitSelected.length
        const splitAmt = splitCount > 0 ? Math.round((parseFloat(editing.amount || '0') / (splitCount + 1)) * 100) / 100 : 0
        return (
          <BottomSheet title={editing.id ? 'Editar recurrente' : 'Nuevo recurrente'} onClose={() => setEditing(null)}>
            <div className="px-5 pb-2 space-y-5">

              {/* Type selector */}
              <div className="flex gap-2">
                {(Object.entries(TYPE_CONFIG) as [SchedForm['type'], typeof TYPE_CONFIG[SchedForm['type']]][]).map(([t, c]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditing({ ...editing, type: t })}
                    className="flex-1 py-2.5 rounded-[14px] text-[11px] font-black flex items-center justify-center gap-1.5 transition-all"
                    style={editing.type === t ? {
                      background: `${c.color}20`,
                      border: `1px solid ${c.color}50`,
                      color: c.color,
                    } : {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <i className={c.icon} />
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Amount — big centered display */}
              <div className="text-center">
                <p className="text-[10px] font-black tracking-[3px] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Monto</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[28px] font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editing.amount}
                    onChange={e => setEditing({ ...editing, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-transparent border-none outline-none text-[44px] font-black tabular-nums text-center w-full max-w-[220px]"
                    style={{ color: editing.amount ? cfg.color : 'rgba(255,255,255,0.2)' }}
                    inputMode="decimal"
                  />
                </div>
                <div
                  className="h-0.5 rounded-full mt-2 mx-auto"
                  style={{ width: '160px', background: `linear-gradient(to right, transparent, ${cfg.color})` }}
                />
              </div>

              {/* Name / Concept */}
              <div>
                <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Nombre</p>
                <input
                  autoFocus
                  type="text"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ej: Spotify, Netflix, Renta…"
                  className="w-full rounded-[14px] px-4 py-3.5 text-[14px] font-bold text-white placeholder:font-medium outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = cfg.color + '80' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Category (only for non-transfer) */}
              {editing.type !== 'TR-TRANSFER' && (
                <div>
                  <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Categoría</p>
                  <div className="grid grid-cols-4 gap-1">
                    {filteredCats.map(cat => {
                      const d = getCategoryDisplay(cat)
                      const sel = editing.category_id === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setEditing({ ...editing, category_id: sel ? '' : cat.id })}
                          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-[12px] transition-all"
                          style={sel ? {
                            background: `${cfg.color}15`,
                            border: `1px solid ${cfg.color}40`,
                          } : {
                            background: 'transparent',
                            border: '1px solid transparent',
                          }}
                        >
                          <i
                            className={`${d.icon} text-[18px]`}
                            style={{ color: sel ? cfg.color : 'rgba(255,255,255,0.5)' }}
                          />
                          <span
                            className="text-[8px] font-bold uppercase tracking-wide text-center leading-tight px-0.5"
                            style={{ color: sel ? cfg.color : 'rgba(255,255,255,0.4)' }}
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
                <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {editing.type === 'TR-TRANSFER' ? 'Cuenta origen' : 'Cuenta'}
                </p>
                <select
                  value={editing.account_id}
                  onChange={e => setEditing({ ...editing, account_id: e.target.value })}
                  className="w-full rounded-[14px] px-4 py-3 text-[14px] font-bold text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${cfg.color}40`, colorScheme: 'dark' }}
                >
                  <option value="">Seleccionar cuenta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination account (transfer) */}
              {editing.type === 'TR-TRANSFER' && (
                <div>
                  <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Cuenta destino</p>
                  <select
                    value={editing.destination_account_id}
                    onChange={e => setEditing({ ...editing, destination_account_id: e.target.value })}
                    className="w-full rounded-[14px] px-4 py-3 text-[14px] font-bold text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(100,210,255,0.4)', colorScheme: 'dark' }}
                  >
                    <option value="">Seleccionar cuenta destino</option>
                    {accounts.filter(a => a.id !== editing.account_id).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Frequency */}
              <div>
                <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Frecuencia</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editing.frequency_num}
                    onChange={e => setEditing({ ...editing, frequency_num: Math.max(1, Number(e.target.value)) })}
                    className="w-16 rounded-[14px] px-3 py-2.5 text-[13px] font-bold text-white text-center focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div className="flex gap-1.5 flex-1">
                    {(['dia', 'semana', 'mes', 'año'] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setEditing({ ...editing, frequency_unit: u })}
                        className="flex-1 py-2.5 rounded-[14px] text-[11px] font-bold border transition-all"
                        style={editing.frequency_unit === u
                          ? { background: `${cfg.color}15`, borderColor: `${cfg.color}50`, color: cfg.color }
                          : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment day + notification days */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Día de cobro</p>
                  <input
                    type="number"
                    min="1" max="31"
                    value={editing.payment_day}
                    onChange={e => setEditing({ ...editing, payment_day: e.target.value })}
                    placeholder="—"
                    className="w-full rounded-[14px] px-3 py-2.5 text-[13px] font-bold text-white text-center focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Aviso (días antes)</p>
                  <input
                    type="number"
                    min="0" max="30"
                    value={editing.notification_days}
                    onChange={e => setEditing({ ...editing, notification_days: Number(e.target.value) })}
                    className="w-full rounded-[14px] px-3 py-2.5 text-[13px] font-bold text-white text-center focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              {/* Split / Compartir — only for expenses with people */}
              {editing.type === 'TR-GASTO' && otherPeople.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, splitEnabled: !editing.splitEnabled })}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-[14px] transition-all"
                    style={{
                      background: editing.splitEnabled ? 'rgba(100,210,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${editing.splitEnabled ? 'rgba(100,210,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    }}
                  >
                    <div>
                      <p className="text-[13px] font-bold text-white text-left">Compartir al cargar</p>
                      <p className="text-[11px] text-left mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Asignar deuda al registrarse
                      </p>
                    </div>
                    <div className="w-10 h-6 rounded-full relative flex-shrink-0 transition-colors" style={{ background: editing.splitEnabled ? '#64D2FF' : 'rgba(255,255,255,0.15)' }}>
                      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: editing.splitEnabled ? 'translateX(20px)' : 'translateX(4px)' }} />
                    </div>
                  </button>

                  {editing.splitEnabled && (
                    <div className="mt-3 space-y-3">
                      {/* Quick mode selector */}
                      <div className="flex gap-1.5">
                        {([
                          { id: 'equal' as const, label: 'Partes iguales', sub: 'Yo pagué todo — ellos me deben', icon: 'fa-solid fa-equals' },
                          { id: 'manual' as const, label: 'Personalizado', sub: 'Monto libre por persona', icon: 'fa-solid fa-sliders' },
                        ]).map(opt => (
                          <button key={opt.id} type="button"
                            onClick={() => setEditing({ ...editing, quickMode: opt.id })}
                            className="flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-[12px] transition-all"
                            style={editing.quickMode === opt.id
                              ? { background: 'rgba(100,210,255,0.15)', border: '1px solid rgba(100,210,255,0.35)', color: '#64D2FF' }
                              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}
                          >
                            <i className={`${opt.icon} text-[15px]`} />
                            <span className="text-[10px] font-black text-center leading-tight mt-0.5">{opt.label}</span>
                            <span className="text-[9px] font-medium text-center leading-tight mt-0.5" style={{ opacity: 0.65 }}>{opt.sub}</span>
                          </button>
                        ))}
                      </div>

                      {/* My share pill — equal mode */}
                      {editing.quickMode === 'equal' && splitCount > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-[10px]"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <i className="fa-solid fa-user text-[9px] mr-1.5" />Tu parte
                          </span>
                          <span className="text-[13px] font-black tabular-nums" style={{ color: '#64D2FF' }}>
                            {formatCurrency(splitAmt)}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        {otherPeople.map(person => {
                          const sel = editing.splitSelected.includes(person.id)
                          return (
                            <div key={person.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all"
                              style={{ background: sel ? 'rgba(100,210,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sel ? 'rgba(100,210,255,0.25)' : 'rgba(255,255,255,0.06)'}` }}
                            >
                              <button type="button"
                                className="flex items-center gap-2.5 flex-1 min-w-0"
                                onClick={() => setEditing({ ...editing, splitSelected: sel ? editing.splitSelected.filter(id => id !== person.id) : [...editing.splitSelected, person.id] })}
                              >
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{ background: sel ? '#64D2FF' : 'rgba(255,255,255,0.15)' }}>
                                  {sel && <i className="fa-solid fa-check text-[9px] text-black" />}
                                </div>
                                <span className="text-[13px] font-bold text-white truncate">{person.name}</span>
                              </button>
                              {sel && editing.quickMode === 'manual' ? (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={editing.manualAmounts[person.id] ?? ''}
                                  onChange={e => setEditing({ ...editing, manualAmounts: { ...editing.manualAmounts, [person.id]: e.target.value } })}
                                  onBlur={e => {
                                    const val = evalExpr(e.target.value)
                                    setEditing(prev => prev ? { ...prev, manualAmounts: { ...prev.manualAmounts, [person.id]: val > 0 ? String(val) : '' } } : prev)
                                  }}
                                  placeholder="0 ó 40+20"
                                  className="w-24 rounded-[8px] px-2 py-1 text-[12px] font-black text-white text-right outline-none"
                                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(100,210,255,0.3)' }}
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : sel && splitAmt > 0 ? (
                                <span className="text-[12px] font-black tabular-nums flex-shrink-0" style={{ color: '#64D2FF' }}>
                                  {formatCurrency(splitAmt)}
                                </span>
                              ) : null}
                            </div>
                          )
                        })}
                        {addingPerson ? (
                          <div className="flex gap-2">
                            <input autoFocus value={newPersonName} onChange={e => setNewPersonName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleAddPerson(); if (e.key === 'Escape') setAddingPerson(false) }}
                              placeholder="Nombre"
                              className="flex-1 rounded-[10px] px-3 py-2 text-[13px] font-bold text-white outline-none"
                              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(100,210,255,0.4)' }} />
                            <button type="button" onClick={handleAddPerson} disabled={isAddingPerson || !newPersonName.trim()}
                              className="px-3 rounded-[10px] text-[12px] font-black disabled:opacity-50"
                              style={{ background: 'rgba(100,210,255,0.15)', border: '1px solid rgba(100,210,255,0.4)', color: '#64D2FF' }}>
                              {isAddingPerson ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                            </button>
                            <button type="button" onClick={() => setAddingPerson(false)} className="w-9 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <i className="fa-solid fa-xmark text-xs text-white" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setAddingPerson(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-[12px]"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                            <i className="fa-solid fa-plus text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }} />
                            <span className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>Agregar persona</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status / Active toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 rounded-[14px]" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-[13px] font-bold text-white">Activo</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {editing.status === 'ACTIVO' ? 'Se ejecutará automáticamente' : 'Pausado — no se ejecutará'}
                  </p>
                </div>
                <div
                  onClick={() => setEditing({ ...editing, status: editing.status === 'ACTIVO' ? 'PAUSADO' : 'ACTIVO' })}
                  className="w-10 h-6 rounded-full relative cursor-pointer transition-colors flex-shrink-0"
                  style={{ background: editing.status === 'ACTIVO' ? '#007AFF' : 'rgba(255,255,255,0.15)' }}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${editing.status === 'ACTIVO' ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="space-y-2.5 pt-1 pb-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full py-4 rounded-[16px] text-white text-[15px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: '#007AFF', boxShadow: '0 4px 20px rgba(0,122,255,0.35)' }}
                >
                  {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : editing.id ? 'Guardar cambios' : 'Crear recurrente'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="w-full py-3 rounded-[14px] text-[13px] font-black transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                >
                  Cancelar
                </button>
                {editing.id && (
                  <button
                    type="button"
                    onClick={() => { handleDelete(editing.id!); setEditing(null) }}
                    className="w-full py-3 rounded-[14px] text-[13px] font-black transition-all"
                    style={{ color: '#FF453A', background: 'rgba(255,69,58,0.08)' }}
                  >
                    Eliminar recurrente
                  </button>
                )}
              </div>

            </div>
          </BottomSheet>
        )
      })()}
    </div>
  )
}

// ── People Tab ────────────────────────────────────────────────────────────────

function PeopleTab({ people: initialPeople, isPending, startTransition }: {
  people: Person[]
  isPending: boolean
  startTransition: (fn: () => void) => void
}) {
  const [contacts, setContacts] = useState(initialPeople.filter(p => !p.is_me))
  const [editing, setEditing] = useState<{ id?: string; name: string } | null>(null)

  function handleSave() {
    if (!editing || !editing.name.trim()) return
    const name = editing.name.trim()
    startTransition(async () => {
      if (editing.id) {
        const res = await updatePerson(editing.id, name)
        if (res.error) { toast.error(res.error); return }
        setContacts(prev => prev.map(p => p.id === editing.id ? { ...p, name } : p))
        toast.success('Contacto actualizado')
      } else {
        const res = await addPerson(name)
        if (res.error) { toast.error(res.error); return }
        if (res.person) setContacts(prev => [...prev, res.person!])
        toast.success('Contacto agregado')
      }
      setEditing(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePerson(id)
      if (res.error) { toast.error(res.error); return }
      setContacts(prev => prev.filter(p => p.id !== id))
      toast.success('Eliminado')
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Contactos</p>
        <button onClick={() => setEditing({ name: '' })} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#007AFF' }}>
          <i className="fa-solid fa-plus" /> Nuevo
        </button>
      </div>

      {contacts.length === 0 && !editing && (
        <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.25)' }}>Sin contactos configurados</p>
      )}

      {contacts.map((person, i) => (
        <div key={person.id} className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ background: '#0F172A', border: '1px solid rgba(0,122,255,0.12)', animationDelay: `${i * 0.04}s` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-[15px]" style={{ background: 'rgba(100,210,255,0.12)', color: '#64D2FF' }}>
            {person.name[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="flex-1 text-sm font-semibold text-white truncate">{person.name}</span>
          <button onClick={() => setEditing({ id: person.id, name: person.name })} className="px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <i className="fa-solid fa-pen text-xs" />
          </button>
          <button onClick={() => handleDelete(person.id)} className="px-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <i className="fa-solid fa-trash text-xs" />
          </button>
        </div>
      ))}

      {editing !== null && (
        <BottomSheet title={editing.id ? 'Editar contacto' : 'Nuevo contacto'} onClose={() => setEditing(null)}>
          <div className="px-5 pb-2 space-y-4">
            <input
              autoFocus
              value={editing.name}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              placeholder="Nombre del contacto"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:opacity-30 focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>Cancelar</button>
              <button onClick={handleSave} disabled={isPending || !editing.name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: '#007AFF' }}>Guardar</button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
