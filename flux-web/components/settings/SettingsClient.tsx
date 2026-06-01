'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getCategoryDisplay, getPaymentMethod, formatCurrency } from '@/lib/utils'
import { STATIC_ICONS, STATIC_COLORS, PAYMENT_METHODS, SHORTCUT_LINKS } from '@/lib/constants'
import { saveCategory, deleteCategory, saveAccount, deleteAccount, reorderAccounts, saveScheduled, deleteScheduled, updateProfile, saveDefaultBudget, updateThemePreference, addPerson, updatePerson, deletePerson } from '@/actions/config'
import { sendSupportMessage, getMyTickets, type SupportTicket } from '@/actions/admin'
import { setUsername, updatePhone, checkUsernameAvailable, linkPersonToUser } from '@/actions/friends'
import type { Profile, Category, Account, ScheduledTransaction, Person, PublicProfile } from '@/lib/types'
import ShortcutInstall from './ShortcutInstall'
import GuideTab from './GuideTab'
import LinkPersonModal from '@/components/friends/LinkPersonModal'
import CoachMarkTour from '@/components/onboarding/CoachMarkTour'

interface Props {
  profile: Profile | null
  shortcutToken: string
  categories: Category[]
  accounts: Account[]
  scheduled: ScheduledTransaction[]
  people: Person[]
}

type Tab = 'shortcuts' | 'categorias' | 'cuentas' | 'planificados' | 'personas' | 'suscripcion' | 'apariencia' | 'perfil' | 'guia' | 'presupuesto' | 'soporte'

// ── Bottom Sheet ──────────────────────────────────────────────────────────────

function BottomSheet({ onClose, children, title }: { onClose: () => void; children: React.ReactNode; title?: string }) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Lift sheet above keyboard on mobile using visualViewport
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function onViewportResize() {
      if (!sheetRef.current) return
      const kh = Math.max(0, window.innerHeight - vv!.height - vv!.offsetTop)
      if (kh > 0) {
        sheetRef.current.style.bottom = `${kh}px`
        sheetRef.current.style.maxHeight = `${vv!.height * 0.92}px`
      } else {
        sheetRef.current.style.bottom = ''
        sheetRef.current.style.maxHeight = ''
      }
    }
    vv.addEventListener('resize', onViewportResize)
    vv.addEventListener('scroll', onViewportResize)
    return () => {
      vv.removeEventListener('resize', onViewportResize)
      vv.removeEventListener('scroll', onViewportResize)
    }
  }, [])

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 animate-fade-in" onClick={onClose} />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[200] rounded-t-[28px] animate-slide-up mx-auto max-w-lg"
        style={{
          background: 'var(--f-bg-elevated)',
          paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
          maxHeight: '90dvh',
          overflowY: 'auto',
          transition: 'bottom 0.15s ease-out, max-height 0.15s ease-out',
          willChange: 'bottom',
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <p className="text-[17px] font-black text-white">{title}</p>
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--f-bg-input)' }}>
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

const SECTIONS: { key: Tab; icon: string; label: string; description: string; hidden?: boolean }[] = [
  { key: 'perfil' as Tab, icon: 'fa-solid fa-user', label: 'Perfil', description: 'Nombre, usuario y contacto', hidden: true },
  { key: 'apariencia' as Tab, icon: 'fa-solid fa-circle-half-stroke', label: 'Apariencia', description: 'Modo claro u oscuro' },
  { key: 'shortcuts' as Tab, icon: 'fa-solid fa-mobile-screen', label: 'Atajos', description: 'iPhone Shortcuts para registrar movimientos' },
  { key: 'presupuesto' as Tab, icon: 'fa-solid fa-chart-bar', label: 'Presupuesto', description: 'Límite mensual de gastos' },
  { key: 'categorias' as Tab, icon: 'fa-solid fa-tags', label: 'Categorías', description: 'Categorías personalizadas' },
  { key: 'cuentas' as Tab, icon: 'fa-solid fa-wallet', label: 'Cuentas', description: 'Efectivo, débito y crédito' },
  { key: 'personas' as Tab, icon: 'fa-solid fa-users', label: 'Personas', description: 'Contactos para dividir gastos' },
  { key: 'planificados' as Tab, icon: 'fa-solid fa-calendar', label: 'Recurrentes', description: 'Suscripciones y cobros fijos' },
  { key: 'suscripcion' as Tab, icon: 'fa-solid fa-crown', label: 'Plan', description: 'Suscripción y facturación' },
  { key: 'guia' as Tab, icon: 'fa-solid fa-book-open', label: 'Guía', description: 'Aprende a usar Flux' },
  { key: 'soporte' as Tab, icon: 'fa-solid fa-headset', label: 'Soporte', description: 'Envía un mensaje al equipo' },
].sort((a, b) => {
  if (a.hidden) return -1
  if (b.hidden) return 1
  if (a.key === 'suscripcion') return 1
  if (b.key === 'suscripcion') return -1
  return a.label.localeCompare(b.label, 'es')
})

export default function SettingsClient({ profile, shortcutToken, categories, accounts, scheduled, people }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [section, setSection] = useState<Tab | null>(() => {
    const s = searchParams.get('section') as Tab | null
    return s && SECTIONS.some(sec => sec.key === s) ? s : null
  })
  const [isPending, startTransition] = useTransition()
  const [theme, setTheme] = useState<'dark' | 'light'>(profile?.theme_preference ?? 'dark')

  function applyTheme(t: 'dark' | 'light') {
    setTheme(t)
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    try { localStorage.setItem('flux-theme', t) } catch { }
    updateThemePreference(t)
  }
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.full_name ?? '')
  const [isNamePending, startNameTx] = useTransition()
  const [editingDefBudget, setEditingDefBudget] = useState(false)
  const [defBudgetInput, setDefBudgetInput] = useState(profile?.default_monthly_budget ? String(profile.default_monthly_budget) : '')
  const [isDefBudgetPending, startDefBudgetTx] = useTransition()

  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState(profile?.username ?? '')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [isUsernamePending, startUsernameTx] = useTransition()

  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState(profile?.phone ?? '')
  const [isPhonePending, startPhoneTx] = useTransition()

  function handleUsernameInput(v: string) {
    const clean = v.toLowerCase().replace(/[^a-z0-9_.\-]/g, '').slice(0, 20)
    setUsernameInput(clean)
    setUsernameAvailable(null)
    if (clean === profile?.username) return
    if (!/^[a-z0-9_.\-]{3,20}$/.test(clean)) return
    setUsernameChecking(true)
    // debounced check happens in useEffect
  }

  useEffect(() => {
    if (!editingUsername) return
    const clean = usernameInput.toLowerCase()
    if (clean === profile?.username || !/^[a-z0-9_.\-]{3,20}$/.test(clean)) return
    const t = setTimeout(async () => {
      const res = await checkUsernameAvailable(clean)
      setUsernameAvailable(res.available)
      setUsernameChecking(false)
    }, 400)
    return () => clearTimeout(t)
  }, [usernameInput, editingUsername, profile?.username])

  function handleSaveUsername() {
    startUsernameTx(async () => {
      const res = await setUsername(usernameInput)
      if (res.error) toast.error(res.error)
      else { toast.success('@' + usernameInput + ' guardado'); setEditingUsername(false) }
    })
  }

  function handleSavePhone() {
    startPhoneTx(async () => {
      const res = await updatePhone(phoneInput)
      if (res.error) toast.error(res.error)
      else { toast.success('Teléfono actualizado'); setEditingPhone(false) }
    })
  }

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      toast.success('¡Suscripción activada! Bienvenido a Flux Pro')
      window.history.replaceState({}, '', '/settings')
      setSection('suscripcion')
    }
  }, [])

  const customCategories = categories.filter(c => c.user_id !== null)
  const defaultCategories = categories.filter(c => c.user_id === null)
  const displayName = nameInput || profile?.full_name

  const trialDaysLeft = profile?.subscription_status === 'trialing' && profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // ── Section view ─────────────────────────────────────────────────────────────
  if (section !== null) {
    const current = SECTIONS.find(s => s.key === section)!
    return (
      <div className="min-h-screen" data-settings style={{ background: 'var(--f-bg)' }}>
        <header
          className="sticky top-0 z-40 px-5 pb-4"
          style={{
            paddingTop: 'calc(1rem + var(--safe-top))',
            background: 'var(--f-bg-glass)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--f-accent-bg)',
          }}
        >
          <div className="relative flex items-center">
            <button
              onClick={() => setSection(null)}
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors z-10"
              style={{ color: 'var(--f-blue)' }}
            >
              <i className="fa-solid fa-chevron-left text-xs" />
              Ajustes
            </button>
            <h1 className="absolute inset-0 flex items-center justify-center text-[17px] font-bold text-white pointer-events-none">
              {current.label}
            </h1>
          </div>
        </header>

        <div key={section} className="px-4 py-4 max-w-lg mx-auto animate-fade-up">
          {section === 'perfil' && (
            <div className="space-y-3">
              {/* Avatar */}
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-[24px] flex items-center justify-center text-3xl font-black"
                  style={{ background: 'linear-gradient(135deg, #007AFF, #0056CC)', color: '#fff' }}>
                  {(displayName || profile?.email || 'U')[0].toUpperCase()}
                </div>
              </div>

              <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--f-line)' }}>
                {/* Nombre */}
                <div className="px-4 py-4" style={{ background: 'var(--f-bg-card)', borderBottom: '1px solid var(--f-line)' }}>
                  <p className="text-[13px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Nombre</p>
                  {editingName ? (
                    <div className="flex gap-2 items-center">
                      <input autoFocus value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                        placeholder="Tu nombre completo"
                        className="flex-1 rounded-[12px] px-3 py-2.5 text-[17px] font-semibold text-white outline-none"
                        style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-glow)' }}
                      />
                      <button onClick={handleSaveName} disabled={isNamePending} className="px-3 py-2 rounded-[10px] text-[15px] font-black text-white disabled:opacity-50" style={{ background: 'var(--f-blue)' }}>
                        {isNamePending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                      </button>
                      <button onClick={() => setEditingName(false)} className="px-2 py-2 rounded-[10px] text-[15px]" style={{ background: 'var(--f-line)', color: 'var(--f-text-3)' }}>✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-bold" style={{ color: 'var(--f-text)' }}>{displayName || 'Sin nombre'}</p>
                      <button onClick={() => setEditingName(true)} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--f-blue)' }}>
                        <i className="fa-solid fa-pencil text-[14px]" /> Editar
                      </button>
                    </div>
                  )}
                </div>

                {/* @username */}
                <div className="px-4 py-4" style={{ background: 'var(--f-bg-card)', borderBottom: '1px solid var(--f-line)' }}>
                  <p className="text-[13px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Usuario</p>
                  {editingUsername ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[17px] font-black select-none" style={{ color: 'var(--f-blue)' }}>@</span>
                        <input autoFocus value={usernameInput}
                          onChange={e => handleUsernameInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') setEditingUsername(false) }}
                          placeholder="tunombre"
                          className="w-full rounded-[12px] pl-8 pr-10 py-2.5 text-[17px] font-semibold text-white outline-none"
                          style={{ background: 'var(--f-bg-input)', border: `1px solid ${usernameAvailable === false ? 'var(--f-expense)' : usernameAvailable === true ? 'var(--f-income)' : 'var(--f-accent-glow)'}` }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                          {usernameChecking && <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--f-text-4)' }} />}
                          {!usernameChecking && usernameAvailable === true && <i className="fa-solid fa-check" style={{ color: 'var(--f-income)' }} />}
                          {!usernameChecking && usernameAvailable === false && <i className="fa-solid fa-xmark" style={{ color: 'var(--f-expense)' }} />}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium" style={{ color: usernameAvailable === false ? 'var(--f-expense)' : 'var(--f-text-4)' }}>
                        {usernameAvailable === false ? 'Ese usuario ya está en uso'
                          : usernameAvailable === true ? '¡Disponible!'
                          : '3-20 caracteres · letras, números, _ . -'}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingUsername(false); setUsernameInput(profile?.username ?? '') }}
                          className="flex-1 py-2 rounded-[10px] text-[15px] font-black" style={{ background: 'var(--f-line)', color: 'var(--f-text-3)' }}>
                          Cancelar
                        </button>
                        <button onClick={handleSaveUsername}
                          disabled={isUsernamePending || usernameAvailable === false || usernameChecking}
                          className="flex-[2] py-2 rounded-[10px] text-[15px] font-black text-white disabled:opacity-40" style={{ background: 'var(--f-blue)' }}>
                          {isUsernamePending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-bold" style={{ color: profile?.username ? 'var(--f-blue)' : 'var(--f-text-4)' }}>
                        {profile?.username ? `@${profile.username}` : 'Sin @username'}
                      </p>
                      <button onClick={() => setEditingUsername(true)} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--f-blue)' }}>
                        <i className="fa-solid fa-pencil text-[14px]" /> Editar
                      </button>
                    </div>
                  )}
                </div>

                {/* Teléfono */}
                <div className="px-4 py-4" style={{ background: 'var(--f-bg-card)', borderBottom: '1px solid var(--f-line)' }}>
                  <p className="text-[13px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Teléfono</p>
                  {editingPhone ? (
                    <div className="flex gap-2 items-center">
                      <input autoFocus type="tel" value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSavePhone(); if (e.key === 'Escape') setEditingPhone(false) }}
                        placeholder="+52 55 0000 0000"
                        className="flex-1 rounded-[12px] px-3 py-2.5 text-[17px] font-semibold text-white outline-none"
                        style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-glow)' }}
                      />
                      <button onClick={handleSavePhone} disabled={isPhonePending} className="px-3 py-2 rounded-[10px] text-[15px] font-black text-white disabled:opacity-50" style={{ background: 'var(--f-blue)' }}>
                        {isPhonePending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                      </button>
                      <button onClick={() => setEditingPhone(false)} className="px-2 py-2 rounded-[10px] text-[15px]" style={{ background: 'var(--f-line)', color: 'var(--f-text-3)' }}>✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-[17px] font-bold" style={{ color: profile?.phone ? 'var(--f-text)' : 'var(--f-text-4)' }}>
                        {profile?.phone || 'Sin teléfono'}
                      </p>
                      <button onClick={() => setEditingPhone(true)} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--f-blue)' }}>
                        <i className="fa-solid fa-pencil text-[14px]" /> Editar
                      </button>
                    </div>
                  )}
                </div>

                {/* Correo (read-only) */}
                <div className="px-4 py-4" style={{ background: 'var(--f-bg-card)' }}>
                  <p className="text-[13px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Correo electrónico</p>
                  <p className="text-[17px] font-bold" style={{ color: 'var(--f-text-3)' }}>{profile?.email}</p>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--f-text-4)' }}>El correo no se puede cambiar desde aquí</p>
                </div>
              </div>
            </div>
          )}

          {section === 'shortcuts' && (
            <ShortcutInstall token={shortcutToken} />
          )}

          {section === 'presupuesto' && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-accent-border)' }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--f-accent-bg)' }}>
                <i className="fa-solid fa-chart-bar text-xl" style={{ color: 'var(--f-blue)' }} />
                <p className="text-sm font-bold text-white">Presupuesto predeterminado</p>
              </div>
              <div className="px-4 py-3">
                {editingDefBudget ? (
                  <div className="flex gap-2">
                    <input
                      type="number" min="0" step="0.01" autoFocus
                      value={defBudgetInput}
                      onChange={e => setDefBudgetInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveDefBudget(); if (e.key === 'Escape') setEditingDefBudget(false) }}
                      placeholder="0.00 (vacío para quitar)"
                      className="flex-1 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none tabular-nums"
                      style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-accent-glow)' }}
                      inputMode="decimal"
                    />
                    <button onClick={handleSaveDefBudget} disabled={isDefBudgetPending} className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: 'var(--f-blue)' }}>
                      {isDefBudgetPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                    </button>
                    <button onClick={() => setEditingDefBudget(false)} className="px-2 rounded-lg" style={{ background: 'var(--f-line)', color: 'var(--f-text-3)' }}>✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold" style={{ color: profile?.default_monthly_budget ? 'white' : 'var(--f-text-4)' }}>
                      {profile?.default_monthly_budget ? `${formatCurrency(profile.default_monthly_budget)} / mes` : 'Sin presupuesto predeterminado'}
                    </p>
                    <button onClick={() => setEditingDefBudget(true)} className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--f-blue)' }}>
                      <i className="fa-solid fa-pencil text-[16px]" /> Editar
                    </button>
                  </div>
                )}
                <p className="text-sm mt-1.5" style={{ color: 'var(--f-text-4)' }}>
                  Se aplica cuando no hay presupuesto configurado para el mes actual. También puedes editarlo directamente desde Inicio tocando el lápiz en la tarjeta de presupuesto.
                </p>
              </div>
            </div>
          )}

          {section === 'apariencia' && (
            <div className="space-y-3">
              {([
                { key: 'dark' as const, icon: 'fa-solid fa-moon', label: 'Oscuro', desc: 'Fondo oscuro — ideal para usar de noche' },
                { key: 'light' as const, icon: 'fa-solid fa-sun', label: 'Claro', desc: 'Fondo claro — más fácil con mucha luz' },
              ]).map(opt => {
                const active = theme === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => applyTheme(opt.key)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-[18px] text-left transition-all active:scale-[0.99]"
                    style={{
                      background: active ? 'var(--f-accent-bg)' : 'var(--f-bg-card)',
                      border: active ? '1.5px solid var(--f-accent-border)' : '1px solid var(--f-line)',
                    }}
                  >
                    <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? 'var(--f-accent-bg)' : 'var(--f-bg-input)' }}>
                      <i className={`${opt.icon} text-sm`} style={{ color: active ? 'var(--f-blue)' : 'var(--f-text-3)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-bold" style={{ color: 'var(--f-text)' }}>{opt.label}</p>
                      <p className="text-[14px]" style={{ color: 'var(--f-text-3)' }}>{opt.desc}</p>
                    </div>
                    {active && <i className="fa-solid fa-check text-sm" style={{ color: 'var(--f-blue)' }} />}
                  </button>
                )
              })}
            </div>
          )}

          {section === 'categorias' && (
            <CategoriesTab customCategories={customCategories} defaultCategories={defaultCategories} isPending={isPending} startTransition={startTransition} />
          )}
          {section === 'cuentas' && (
            <AccountsTab accounts={accounts} isPending={isPending} startTransition={startTransition} />
          )}
          {section === 'planificados' && (
            <ScheduledTab scheduled={scheduled} categories={categories} accounts={accounts} people={people} isPending={isPending} startTransition={startTransition} />
          )}
          {section === 'personas' && (
            <PeopleTab people={people} isPending={isPending} startTransition={startTransition} />
          )}
          {section === 'suscripcion' && (
            <SubscriptionTab profile={profile} />
          )}
          {section === 'guia' && (
            <GuideTab />
          )}
          {section === 'soporte' && (
            <SupportTab />
          )}
        </div>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" data-settings style={{ background: 'var(--f-bg)' }}>
      <header
        className="sticky top-0 z-40 px-5 pb-4"
        style={{
          paddingTop: 'calc(1rem + var(--safe-top))',
          background: 'var(--f-bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--f-accent-bg)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => section ? setSection(null) : router.back()}
            className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: 'var(--f-bg-input)' }}
          >
            <i className="fa-solid fa-chevron-left" style={{ color: 'var(--f-text-3)', fontSize: 15 }} />
          </button>
          <h1 className="text-xl font-black" style={{ color: 'var(--f-text)' }}>
            {section ? (SECTIONS.find(s => s.key === section)?.label ?? 'Ajustes') : 'Ajustes'}
          </h1>
        </div>

        {/* Profile card — tap to edit in Perfil section */}
        <button
          data-coach="settings-profile-header"
          onClick={() => { setSection('perfil'); window.scrollTo({ top: 0 }) }}
          className="flex items-center gap-3 w-full text-left transition-all active:scale-[0.98]"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #007AFF, #0056CC)', color: '#fff' }}
          >
            {(displayName || profile?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-white truncate">{displayName || 'Sin nombre'}</p>
            <p className="text-xs font-semibold truncate" style={{ color: profile?.username ? 'var(--f-blue)' : 'var(--f-text-4)' }}>
              {profile?.username ? `@${profile.username}` : 'Sin @username · toca para configurar'}
            </p>
          </div>
          <i className="fa-solid fa-chevron-right text-sm flex-shrink-0" style={{ color: 'var(--f-text-3)' }} />
        </button>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-3 animate-fade-up">

        {/* Trial banner */}
        {trialDaysLeft !== null && (
          <button
            onClick={() => setSection('suscripcion')}
            className="w-full rounded-[18px] px-4 py-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.35)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,159,10,0.18)' }}>
              <i className="fa-solid fa-clock text-sm" style={{ color: '#FF9F0A' }} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-black" style={{ color: '#FF9F0A' }}>
                {trialDaysLeft === 0 ? 'Tu prueba expira hoy' : `${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'} de prueba restantes`}
              </p>
              <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,159,10,0.7)' }}>Toca para suscribirte y no perder acceso</p>
            </div>
            <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'rgba(255,159,10,0.5)' }} />
          </button>
        )}

        {/* Options list */}
        <div className="rounded-[20px] overflow-hidden" style={{ border: '1px solid var(--f-line)' }}>
          {SECTIONS.filter(s => !s.hidden).map((s, i, arr) => {
            const isLast = i === arr.length - 1
            const isPlan = s.key === 'suscripcion'
            return (
              <button
                key={s.key}
                {...(i === 0 ? { 'data-coach': 'settings-list' } : {})}
                onClick={() => { setSection(s.key); window.scrollTo({ top: 0 }) }}
                className="w-full flex items-center gap-4 px-4 py-4 text-left transition-all active:scale-[0.99]"
                style={{
                  background: isPlan && profile?.subscription_status === 'active'
                    ? 'var(--f-income-bg)'
                    : 'var(--f-bg-card)',
                  borderBottom: isLast ? 'none' : '1px solid var(--f-line)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isPlan && profile?.subscription_status === 'active'
                      ? 'var(--f-income-border)'
                      : 'var(--f-accent-bg)',
                  }}
                >
                  <i
                    className={`${s.icon} text-sm`}
                    style={{
                      color: isPlan && profile?.subscription_status === 'active'
                        ? 'var(--f-income)'
                        : isPlan && trialDaysLeft !== null
                          ? '#FF9F0A'
                          : 'var(--f-blue)',
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-bold text-white">{s.label}</p>
                  <p className="text-[14px]" style={{ color: 'var(--f-text-4)' }}>
                    {isPlan && profile?.subscription_status === 'active'
                      ? 'Flux Pro · Activo'
                      : isPlan && trialDaysLeft !== null
                        ? `${trialDaysLeft} días de prueba`
                        : s.description}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--f-line-strong)' }} />
              </button>
            )
          })}
        </div>

        {!section && profile?.email === 'bernardo.perezro06@gmail.com' && (
          <Link
            href="/admin"
            className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-left transition-all active:scale-[0.99]"
            style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.20)' }}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,149,0,0.15)' }}>
              <i className="fa-solid fa-shield-halved text-sm" style={{ color: '#FF9500' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold" style={{ color: 'var(--f-text)' }}>Panel de admin</p>
              <p className="text-[14px]" style={{ color: 'var(--f-text-4)' }}>Gestionar usuarios y accesos</p>
            </div>
            <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--f-line-strong)' }} />
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className="w-full py-3.5 rounded-[16px] text-[15px] font-bold transition-all active:scale-[0.98]"
          style={{ background: 'var(--f-expense-bg)', color: 'var(--f-expense)', border: '1px solid var(--f-expense-border)' }}
        >
          <i className="fa-solid fa-right-from-bracket mr-2" />
          Cerrar sesión
        </button>

        <p className="text-center text-[13px] pb-8" style={{ color: 'var(--f-line-strong)' }}>
          Flux · Powered by Nevura
        </p>
      </div>

      <CoachMarkTour pageKey="settings" />
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
      else { toast.success('Eliminada'); setDeleteConfirm(null) }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Mis categorías</p>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[15px] font-bold transition-all active:scale-95" style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
          <i className="fa-solid fa-plus" /> Nueva
        </button>
      </div>

      {customCategories.length === 0 && !editing && (
        <p className="text-sm text-center py-6" style={{ color: 'var(--f-text-4)' }}>Sin categorías personalizadas</p>
      )}

      <div className="space-y-2">
        {customCategories.map((cat, i) => {
          const d = getCategoryDisplay(cat)
          return (
            <div key={cat.id} className="rounded-2xl px-4 py-4 flex items-center gap-4 animate-fade-up" style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-accent-bg)', animationDelay: `${i * 0.04}s` }}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${d.bg}`}>
                <i className={`${d.icon} ${d.color} text-sm`} />
              </div>
              <span className="flex-1 text-[17px] font-semibold text-white">{cat.name}</span>
              <button onClick={() => setEditing(cat)} className="px-2" style={{ color: 'var(--f-text-3)' }}>
                <i className="fa-solid fa-pen text-xs" />
              </button>
              {deleteConfirm === cat.id ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold" style={{ color: 'var(--f-text-2)', background: 'var(--f-bg-input)' }}>No</button>
                  <button onClick={() => handleDelete(cat.id)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold text-white" style={{ background: 'var(--f-expense)' }}>Sí</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(cat.id)} className="px-2" style={{ color: 'var(--f-text-3)' }}>
                  <i className="fa-solid fa-trash text-xs" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[12px] font-black uppercase tracking-[2px] mt-4" style={{ color: 'var(--f-text-4)' }}>Predeterminadas</p>
      <div className="grid grid-cols-4 gap-2">
        {defaultCategories.map(cat => {
          const d = getCategoryDisplay(cat)
          return (
            <div key={cat.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${d.bg} opacity-60`}>
              <i className={`${d.icon} ${d.color} text-base`} />
              <span className={`text-[11px] font-semibold text-center ${d.color}`}>{cat.name.split(' ')[0]}</span>
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
              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
            />
            <div>
              <p className="text-[12px] font-black uppercase tracking-[1.5px]" style={{ color: 'var(--f-text-4)' }}>Icono</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {STATIC_ICONS.slice(0, 20).map(ic => (
                  <button
                    key={ic.id_icon}
                    type="button"
                    onClick={() => setEditing({ ...editing, icon_id: ic.id_icon })}
                    className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                    style={editing.icon_id === ic.id_icon
                      ? { background: 'var(--f-blue)' }
                      : { background: 'var(--f-bg-input)' }}
                  >
                    <i className={`${ic.icon_base} text-sm`} style={{ color: editing.icon_id === ic.id_icon ? 'white' : 'var(--f-text-3)' }} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-[1.5px]" style={{ color: 'var(--f-text-4)' }}>Color</p>
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
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending || !editing.name} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: 'var(--f-blue)' }}>
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [ordered, setOrdered] = useState<Account[]>(accounts)

  // Sync when server revalidates
  useEffect(() => { setOrdered(accounts) }, [accounts])

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
      else { toast.success('Eliminada'); setDeleteConfirm(null) }
    })
  }

  function handleMove(id: string, dir: 'up' | 'down') {
    const idx = ordered.findIndex(a => a.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === ordered.length - 1) return
    const next = [...ordered]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setOrdered(next)
    startTransition(async () => { await reorderAccounts(next.map(a => a.id)) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Cuentas</p>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[15px] font-bold transition-all active:scale-95" style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
          <i className="fa-solid fa-plus" /> Nueva
        </button>
      </div>

      <div className="space-y-2">
        {ordered.map((acc, i) => {
          const method = getPaymentMethod(acc.payment_method_id)
          return (
            <div key={acc.id} className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-accent-bg)', animationDelay: `${i * 0.04}s` }}>
              {/* Reorder arrows */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => handleMove(acc.id, 'up')}
                  disabled={i === 0 || isPending}
                  className="w-6 h-5 flex items-center justify-center rounded disabled:opacity-20 transition-opacity"
                  style={{ color: 'var(--f-text-4)' }}
                >
                  <i className="fa-solid fa-chevron-up text-[10px]" />
                </button>
                <button
                  onClick={() => handleMove(acc.id, 'down')}
                  disabled={i === ordered.length - 1 || isPending}
                  className="w-6 h-5 flex items-center justify-center rounded disabled:opacity-20 transition-opacity"
                  style={{ color: 'var(--f-text-4)' }}
                >
                  <i className="fa-solid fa-chevron-down text-[10px]" />
                </button>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--f-accent-bg)' }}>
                <i className={`${method.icon} text-sm`} style={{ color: 'var(--f-blue)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{acc.name}</p>
                <p className="text-xs" style={{ color: 'var(--f-text-3)' }}>{method.nombre}</p>
              </div>
              <button onClick={() => setEditing(acc)} className="px-2 flex-shrink-0" style={{ color: 'var(--f-text-3)' }}>
                <i className="fa-solid fa-pen text-xs" />
              </button>
              {deleteConfirm === acc.id ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold" style={{ color: 'var(--f-text-2)', background: 'var(--f-bg-input)' }}>No</button>
                  <button onClick={() => handleDelete(acc.id)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold text-white" style={{ background: 'var(--f-expense)' }}>Sí</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(acc.id)} className="px-2 flex-shrink-0" style={{ color: 'var(--f-text-3)' }}>
                  <i className="fa-solid fa-trash text-xs" />
                </button>
              )}
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
              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
            />
            {(editing.payment_method_id === 'MP-TDD' || editing.payment_method_id === 'MP-TDC') && (
              <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.3)' }}>
                <i className="fa-solid fa-triangle-exclamation text-[14px] mt-0.5 flex-shrink-0" style={{ color: '#ff9f0a' }} />
                <div>
                  <p className="text-[14px] font-black leading-snug" style={{ color: '#ff9f0a' }}>El nombre debe coincidir con Wallet</p>
                  <p className="text-[13px] font-semibold mt-0.5 leading-snug" style={{ color: 'var(--f-text-3)' }}>
                    Verifica el nombre exacto en: Configuración → Wallet y Apple Pay → Tarjetas de pago
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id_metodo_pago}
                  type="button"
                  onClick={() => setEditing({ ...editing, payment_method_id: m.id_metodo_pago })}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all"
                  style={editing.payment_method_id === m.id_metodo_pago
                    ? { background: 'var(--f-accent-bg)', borderColor: 'var(--f-accent-border)', color: 'var(--f-blue)' }
                    : { background: 'var(--f-bg-card)', borderColor: 'var(--f-line)', color: 'var(--f-text-3)' }}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
            {editing.payment_method_id === 'MP-TDC' && (
              <div>
                <label className="text-[12px] font-black uppercase tracking-[1.5px] mb-1.5 block" style={{ color: 'var(--f-text-4)' }}>Día de pago</label>
                <input
                  type="number"
                  min={1} max={31}
                  value={editing.payment_day ?? ''}
                  onChange={e => setEditing({ ...editing, payment_day: Number(e.target.value) })}
                  placeholder="Ej: 15"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>Cancelar</button>
              <button onClick={handleSave} disabled={isPending || !editing.name} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: 'var(--f-blue)' }}>Guardar</button>
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
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
      else { toast.success('Eliminado'); setDeleteConfirm(null) }
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
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[15px] font-bold transition-all active:scale-95" style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
          <i className="fa-solid fa-plus" /> Nueva
        </button>
      </div>

      {/* Monthly expense metric */}
      {scheduled.filter(s => s.status === 'ACTIVO' && s.type === 'TR-GASTO').length > 0 && (
        <div
          className="rounded-[16px] px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--f-expense-bg)', border: '1px solid var(--f-expense-border)' }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-repeat text-xs" style={{ color: 'var(--f-expense)' }} />
            <p className="text-[14px] font-bold" style={{ color: 'var(--f-text-2)' }}>Gastos recurrentes / mes</p>
          </div>
          <p className="text-[17px] font-black tabular-nums" style={{ color: 'var(--f-expense)' }}>
            −{formatCurrency(monthlyExpenses)}
          </p>
        </div>
      )}

      {scheduled.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--f-text-4)' }}>Sin recurrentes configurados</p>
      )}

      {scheduled.map((s, i) => {
        const cat = catMap[s.category_id ?? '']
        const d = getCategoryDisplay(cat)
        const isActive = s.status === 'ACTIVO'
        return (
          <div key={s.id} className="rounded-2xl px-4 py-4 flex items-center gap-4 animate-fade-up" style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-accent-bg)', animationDelay: `${i * 0.04}s` }}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${d.bg}`}>
              <i className={`${d.icon} ${d.color} text-sm`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{s.name}</p>
              <p className="text-xs" style={{ color: 'var(--f-text-3)' }}>
                Cada {s.frequency_num} {s.frequency_unit} · {formatCurrency(Number(s.amount))}
              </p>
            </div>
            <button onClick={() => openEdit(s)} className="px-1" style={{ color: 'var(--f-text-3)' }}>
              <i className="fa-solid fa-pen text-xs" />
            </button>
            <div
              onClick={() => handleToggle(s)}
              className="w-9 h-5 rounded-full relative cursor-pointer transition-colors flex-shrink-0"
              style={{ background: isActive ? 'var(--f-blue)' : 'var(--f-line-strong)' }}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            {deleteConfirm === s.id ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold" style={{ color: 'var(--f-text-2)', background: 'var(--f-bg-input)' }}>No</button>
                <button onClick={() => handleDelete(s.id)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold text-white" style={{ background: 'var(--f-expense)' }}>Sí</button>
              </div>
            ) : (
              <button onClick={() => setDeleteConfirm(s.id)} className="px-1" style={{ color: 'var(--f-text-3)' }}>
                <i className="fa-solid fa-trash text-xs" />
              </button>
            )}
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
                    className="flex-1 py-2.5 rounded-[14px] text-[13px] font-black flex items-center justify-center gap-1.5 transition-all"
                    style={editing.type === t ? {
                      background: `${c.color}20`,
                      border: `1px solid ${c.color}50`,
                      color: c.color,
                    } : {
                      background: 'var(--f-line)',
                      border: '1px solid var(--f-bg-input)',
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
                <p className="text-[12px] font-black tracking-[3px] uppercase mb-3" style={{ color: 'var(--f-text-4)' }}>Monto</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[28px] font-black" style={{ color: 'var(--f-text-3)' }}>$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editing.amount}
                    onChange={e => setEditing({ ...editing, amount: e.target.value })}
                    placeholder="0.00"
                    className="bg-transparent border-none outline-none text-[44px] font-black tabular-nums text-center w-full max-w-[220px]"
                    style={{ color: editing.amount ? cfg.color : 'var(--f-line-strong)' }}
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
                <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Nombre</p>
                <input
                  autoFocus
                  type="text"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Ej: Spotify, Netflix, Renta…"
                  className="w-full rounded-[14px] px-4 py-3.5 text-[16px] font-bold text-white placeholder:font-medium outline-none transition-all"
                  style={{
                    background: 'var(--f-bg-input)',
                    border: '1px solid var(--f-bg-input)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = cfg.color + '80' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--f-bg-input)' }}
                />
              </div>

              {/* Category (only for non-transfer) */}
              {editing.type !== 'TR-TRANSFER' && (
                <div>
                  <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Categoría</p>
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
                            className={`${d.icon} text-[20px]`}
                            style={{ color: sel ? cfg.color : 'var(--f-text-3)' }}
                          />
                          <span
                            className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight px-0.5"
                            style={{ color: sel ? cfg.color : 'var(--f-text-3)' }}
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
                  {editing.type === 'TR-TRANSFER' ? 'Cuenta origen' : 'Cuenta'}
                </p>
                <select
                  value={editing.account_id}
                  onChange={e => setEditing({ ...editing, account_id: e.target.value })}
                  className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold text-white focus:outline-none"
                  style={{ background: 'var(--f-bg-input)', border: `1px solid ${cfg.color}40`, colorScheme: 'dark' }}
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
                  <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Cuenta destino</p>
                  <select
                    value={editing.destination_account_id}
                    onChange={e => setEditing({ ...editing, destination_account_id: e.target.value })}
                    className="w-full rounded-[14px] px-4 py-3 text-[16px] font-bold text-white focus:outline-none"
                    style={{ background: 'var(--f-bg-input)', border: '1px solid rgba(100,210,255,0.4)', colorScheme: 'dark' }}
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
                <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Frecuencia</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editing.frequency_num}
                    onChange={e => setEditing({ ...editing, frequency_num: Math.max(1, Number(e.target.value)) })}
                    className="w-16 rounded-[14px] px-3 py-2.5 text-[15px] font-bold text-white text-center focus:outline-none"
                    style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                  />
                  <div className="flex gap-1.5 flex-1">
                    {(['dia', 'semana', 'mes', 'año'] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setEditing({ ...editing, frequency_unit: u })}
                        className="flex-1 py-2.5 rounded-[14px] text-[13px] font-bold border transition-all"
                        style={editing.frequency_unit === u
                          ? { background: `${cfg.color}15`, borderColor: `${cfg.color}50`, color: cfg.color }
                          : { background: 'var(--f-bg-card)', borderColor: 'var(--f-line)', color: 'var(--f-text-3)' }}
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
                  <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Día de cobro</p>
                  <input
                    type="number"
                    min="1" max="31"
                    value={editing.payment_day}
                    onChange={e => setEditing({ ...editing, payment_day: e.target.value })}
                    placeholder="—"
                    className="w-full rounded-[14px] px-3 py-2.5 text-[15px] font-bold text-white text-center focus:outline-none"
                    style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black tracking-[2px] uppercase mb-2" style={{ color: 'var(--f-text-4)' }}>Aviso (días antes)</p>
                  <input
                    type="number"
                    min="0" max="30"
                    value={editing.notification_days}
                    onChange={e => setEditing({ ...editing, notification_days: Number(e.target.value) })}
                    className="w-full rounded-[14px] px-3 py-2.5 text-[15px] font-bold text-white text-center focus:outline-none"
                    style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
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
                      background: editing.splitEnabled ? 'rgba(100,210,255,0.1)' : 'var(--f-bg-card)',
                      border: `1px solid ${editing.splitEnabled ? 'rgba(100,210,255,0.3)' : 'var(--f-bg-input)'}`,
                    }}
                  >
                    <div>
                      <p className="text-[15px] font-bold text-white text-left">Compartir al cargar</p>
                      <p className="text-[13px] text-left mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                        Asignar deuda al registrarse
                      </p>
                    </div>
                    <div className="w-10 h-6 rounded-full relative flex-shrink-0 transition-colors" style={{ background: editing.splitEnabled ? 'var(--f-transfer)' : 'var(--f-line-strong)' }}>
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
                              ? { background: 'rgba(100,210,255,0.15)', border: '1px solid rgba(100,210,255,0.35)', color: 'var(--f-transfer)' }
                              : { background: 'var(--f-bg-card)', border: '1px solid var(--f-bg-input)', color: 'var(--f-text-4)' }}
                          >
                            <i className={`${opt.icon} text-[17px]`} />
                            <span className="text-[12px] font-black text-center leading-tight mt-0.5">{opt.label}</span>
                            <span className="text-[11px] font-medium text-center leading-tight mt-0.5" style={{ opacity: 0.65 }}>{opt.sub}</span>
                          </button>
                        ))}
                      </div>

                      {/* My share pill — equal mode */}
                      {editing.quickMode === 'equal' && splitCount > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 rounded-[10px]"
                          style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-bg-input)' }}>
                          <span className="text-[13px] font-bold" style={{ color: 'var(--f-text-3)' }}>
                            <i className="fa-solid fa-user text-[11px] mr-1.5" />Tu parte
                          </span>
                          <span className="text-[15px] font-black tabular-nums" style={{ color: 'var(--f-transfer)' }}>
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
                              style={{ background: sel ? 'rgba(100,210,255,0.08)' : 'var(--f-bg-card)', border: `1px solid ${sel ? 'rgba(100,210,255,0.25)' : 'var(--f-line)'}` }}
                            >
                              <button type="button"
                                className="flex items-center gap-2.5 flex-1 min-w-0"
                                onClick={() => setEditing({ ...editing, splitSelected: sel ? editing.splitSelected.filter(id => id !== person.id) : [...editing.splitSelected, person.id] })}
                              >
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all" style={{ background: sel ? 'var(--f-transfer)' : 'var(--f-line-strong)' }}>
                                  {sel && <i className="fa-solid fa-check text-[11px] text-black" />}
                                </div>
                                <span className="text-[15px] font-bold text-white truncate">{person.name}</span>
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
                                  className="w-24 rounded-[8px] px-2 py-1 text-[14px] font-black text-white text-right outline-none"
                                  style={{ background: 'var(--f-bg-input)', border: '1px solid rgba(100,210,255,0.3)' }}
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : sel && splitAmt > 0 ? (
                                <span className="text-[14px] font-black tabular-nums flex-shrink-0" style={{ color: 'var(--f-transfer)' }}>
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
                              className="flex-1 rounded-[10px] px-3 py-2 text-[15px] font-bold text-white outline-none"
                              style={{ background: 'var(--f-bg-input)', border: '1px solid rgba(100,210,255,0.4)' }} />
                            <button type="button" onClick={handleAddPerson} disabled={isAddingPerson || !newPersonName.trim()}
                              className="px-3 rounded-[10px] text-[14px] font-black disabled:opacity-50"
                              style={{ background: 'rgba(100,210,255,0.15)', border: '1px solid rgba(100,210,255,0.4)', color: 'var(--f-transfer)' }}>
                              {isAddingPerson ? <i className="fa-solid fa-spinner fa-spin" /> : 'OK'}
                            </button>
                            <button type="button" onClick={() => setAddingPerson(false)} className="w-9 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--f-line)' }}>
                              <i className="fa-solid fa-xmark text-xs text-white" />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setAddingPerson(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-[12px]"
                            style={{ background: 'var(--f-bg-card)', border: '1px dashed var(--f-line-strong)' }}>
                            <i className="fa-solid fa-plus text-[12px]" style={{ color: 'var(--f-text-4)' }} />
                            <span className="text-[14px] font-bold" style={{ color: 'var(--f-text-4)' }}>Agregar persona</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status / Active toggle */}
              <div className="flex items-center justify-between px-4 py-3.5 rounded-[14px]" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-bg-input)' }}>
                <div>
                  <p className="text-[15px] font-bold text-white">Activo</p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--f-text-3)' }}>
                    {editing.status === 'ACTIVO' ? 'Se ejecutará automáticamente' : 'Pausado — no se ejecutará'}
                  </p>
                </div>
                <div
                  onClick={() => setEditing({ ...editing, status: editing.status === 'ACTIVO' ? 'PAUSADO' : 'ACTIVO' })}
                  className="w-10 h-6 rounded-full relative cursor-pointer transition-colors flex-shrink-0"
                  style={{ background: editing.status === 'ACTIVO' ? 'var(--f-blue)' : 'var(--f-line-strong)' }}
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
                  className="w-full py-4 rounded-[16px] text-white text-[17px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'var(--f-blue)', boxShadow: '0 4px 20px var(--f-accent-glow)' }}
                >
                  {isPending ? <i className="fa-solid fa-spinner fa-spin" /> : editing.id ? 'Guardar cambios' : 'Crear recurrente'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="w-full py-3 rounded-[14px] text-[15px] font-black transition-all"
                  style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                >
                  Cancelar
                </button>
                {editing.id && (
                  <button
                    type="button"
                    onClick={() => { handleDelete(editing.id!); setEditing(null) }}
                    className="w-full py-3 rounded-[14px] text-[15px] font-black transition-all"
                    style={{ color: 'var(--f-expense)', background: 'var(--f-expense-bg)' }}
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

// ── Support Tab ──────────────────────────────────────────────────────────────

function SupportTab() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getMyTickets().then(t => { setTickets(t); setLoaded(true) })
  }, [])

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    const r = await sendSupportMessage(message.trim())
    setSending(false)
    if (r.error) {
      toast.error(r.error)
    } else {
      toast.success('Mensaje enviado')
      setMessage('')
      getMyTickets().then(setTickets)
    }
  }

  function fmtDt(iso: string) {
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-5">
      {/* Send message */}
      <div className="rounded-[20px] p-5" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
        <p className="text-[13px] font-black uppercase tracking-[2px] mb-3" style={{ color: 'var(--f-text-3)' }}>
          Nuevo mensaje
        </p>
        <textarea
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe tu duda, problema o sugerencia…"
          className="w-full rounded-[14px] px-4 py-3 text-[15px] font-medium outline-none resize-none"
          style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)', color: 'var(--f-text)' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-full mt-3 py-3.5 rounded-[14px] text-[16px] font-black text-white transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--f-blue)' }}
        >
          {sending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Enviar mensaje'}
        </button>
      </div>

      {/* Message history */}
      {loaded && tickets.length > 0 && (
        <div>
          <p className="text-[13px] font-black uppercase tracking-[2px] mb-3" style={{ color: 'var(--f-text-3)' }}>
            Historial
          </p>
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="rounded-[20px] p-5 space-y-3" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
                {/* User message */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--f-text-4)' }}>
                    Tú · {fmtDt(t.created_at)}
                  </p>
                  <p className="text-[14px] font-medium" style={{ color: 'var(--f-text)' }}>{t.message}</p>
                </div>
                {/* Admin reply */}
                {t.admin_reply && (
                  <div className="rounded-[12px] p-3" style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--f-blue)' }}>
                      Soporte · {t.replied_at ? fmtDt(t.replied_at) : ''}
                    </p>
                    <p className="text-[14px] font-medium" style={{ color: 'var(--f-text)' }}>{t.admin_reply}</p>
                  </div>
                )}
                {!t.admin_reply && (
                  <p className="text-[12px] font-medium" style={{ color: 'var(--f-text-4)' }}>
                    <i className="fa-regular fa-clock mr-1.5" />Pendiente de respuesta
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Subscription Tab ─────────────────────────────────────────────────────────

const PRICE_MONTHLY = 'price_1TbXRPJ3c9aWVlXAvs1otlmf'
const PRICE_YEARLY = 'price_1TbXTnJ3c9aWVlXA8x3EQobG'

function SubscriptionTab({ profile }: { profile: Profile | null }) {
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [loadingYearly, setLoadingYearly] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const status = profile?.subscription_status
  const isActive = status === 'active' || status === 'trialing'
  const hasCustomer = !!profile?.stripe_customer_id

  async function handleCheckout(priceId: string, setLoading: (v: boolean) => void) {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error al iniciar pago')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Error al abrir portal')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoadingPortal(false)
    }
  }

  function formatDate(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (isActive) {
    const isTrialing = status === 'trialing'
    return (
      <div className="space-y-4">
        <div
          className="rounded-[20px] p-5"
          style={{
            background: isTrialing ? 'rgba(255,159,10,0.08)' : 'var(--f-income-bg)',
            border: `1px solid ${isTrialing ? 'rgba(255,159,10,0.3)' : 'var(--f-income-border)'}`,
            boxShadow: `0 0 32px ${isTrialing ? 'rgba(255,159,10,0.1)' : 'var(--f-income-bg)'}`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center"
              style={{ background: isTrialing ? 'rgba(255,159,10,0.15)' : 'var(--f-income-border)' }}
            >
              <i
                className={`fa-solid ${isTrialing ? 'fa-clock' : 'fa-crown'} text-lg`}
                style={{ color: isTrialing ? '#FF9F0A' : 'var(--f-income)' }}
              />
            </div>
            <div>
              <p className="text-[17px] font-black text-white">
                {isTrialing ? 'Período de prueba' : 'Flux Pro · Activo'}
              </p>
              <p className="text-[14px] font-semibold" style={{ color: isTrialing ? '#FF9F0A' : 'var(--f-income)' }}>
                {isTrialing
                  ? `Prueba hasta ${formatDate(profile?.trial_ends_at)}`
                  : `Activo hasta ${formatDate(profile?.subscription_ends_at)}`}
              </p>
            </div>
          </div>
          <p className="text-[14px] mb-4" style={{ color: 'var(--f-text-3)' }}>
            {isTrialing
              ? 'Suscríbete antes de que expire tu período de prueba para no perder acceso.'
              : 'Gracias por suscribirte. Tienes acceso completo a todas las funciones.'}
          </p>
          {/* Only show portal button if not trialing without a Stripe customer — those users use the price cards below */}
          {(!isTrialing || hasCustomer) && (
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="w-full py-3.5 rounded-[14px] text-[16px] font-black transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--f-income)', color: '#000' }}
            >
              {loadingPortal ? <i className="fa-solid fa-spinner fa-spin" /> : 'Administrar suscripción'}
            </button>
          )}
        </div>

        {isTrialing && (
          <div className="space-y-3">
            <p className="text-[13px] font-black uppercase tracking-[2px]" style={{ color: 'var(--f-text-4)' }}>Planes</p>
            <PriceCard
              label="Mensual"
              price="$89"
              period="/mes"
              badge={null}
              loading={loadingMonthly}
              onSelect={() => handleCheckout(PRICE_MONTHLY, setLoadingMonthly)}
            />
            <PriceCard
              label="Anual"
              price="$829"
              period="/año"
              badge="Ahorra 2 meses"
              loading={loadingYearly}
              onSelect={() => handleCheckout(PRICE_YEARLY, setLoadingYearly)}
            />
          </div>
        )}
      </div>
    )
  }

  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') {
    return (
      <div className="space-y-4">
        <div
          className="rounded-[20px] p-5"
          style={{ background: 'var(--f-expense-bg)', border: '1px solid var(--f-expense-border)', boxShadow: '0 0 32px var(--f-expense-bg)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-[14px] flex items-center justify-center" style={{ background: 'var(--f-expense-border)' }}>
              <i className="fa-solid fa-triangle-exclamation text-lg" style={{ color: 'var(--f-expense)' }} />
            </div>
            <div>
              <p className="text-[17px] font-black text-white">Pago pendiente</p>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--f-expense)' }}>Actualiza tu método de pago</p>
            </div>
          </div>
          <p className="text-[14px] mb-4" style={{ color: 'var(--f-text-3)' }}>
            No pudimos procesar tu pago. Actualiza tu tarjeta para continuar usando Flux Pro.
          </p>
          {hasCustomer && (
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="w-full py-3.5 rounded-[14px] text-[16px] font-black text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: 'var(--f-expense)' }}
            >
              {loadingPortal ? <i className="fa-solid fa-spinner fa-spin" /> : 'Actualizar método de pago'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // No subscription / canceled
  return (
    <div className="space-y-4">
      {status === 'canceled' && (
        <div className="rounded-[16px] px-4 py-3 flex items-center gap-2" style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-bg-input)' }}>
          <i className="fa-solid fa-circle-xmark text-sm" style={{ color: 'var(--f-text-4)' }} />
          <p className="text-[15px] font-bold" style={{ color: 'var(--f-text-3)' }}>Tu suscripción fue cancelada</p>
        </div>
      )}

      <div
        className="rounded-[20px] p-5"
        style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)', boxShadow: '0 0 40px var(--f-accent-bg)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[14px] flex items-center justify-center" style={{ background: 'var(--f-accent-bg)' }}>
            <i className="fa-solid fa-crown text-xl" style={{ color: 'var(--f-blue)' }} />
          </div>
          <div>
            <p className="text-[19px] font-black text-white">Flux Pro</p>
            <p className="text-[14px]" style={{ color: 'var(--f-text-3)' }}>Desbloquea todas las funciones</p>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {['Transacciones ilimitadas', 'Atajos de iPhone', 'Auditoría de cuentas', 'Recordatorios automáticos', 'Soporte prioritario'].map(f => (
            <div key={f} className="flex items-center gap-2">
              <i className="fa-solid fa-check text-[13px]" style={{ color: 'var(--f-income)' }} />
              <span className="text-[15px] font-semibold text-white">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[13px] font-black uppercase tracking-[2px]" style={{ color: 'var(--f-text-4)' }}>Elige tu plan</p>

      <PriceCard
        label="Anual"
        price="$829"
        period="/año"
        badge="Ahorra 2 meses"
        loading={loadingYearly}
        onSelect={() => handleCheckout(PRICE_YEARLY, setLoadingYearly)}
      />
      <PriceCard
        label="Mensual"
        price="$89"
        period="/mes"
        badge={null}
        loading={loadingMonthly}
        onSelect={() => handleCheckout(PRICE_MONTHLY, setLoadingMonthly)}
      />

      <p className="text-[13px] text-center" style={{ color: 'var(--f-text-4)' }}>
        Cancela cuando quieras · Pago seguro con Stripe
      </p>
    </div>
  )
}

function PriceCard({ label, price, period, badge, loading, onSelect }: {
  label: string
  price: string
  period: string
  badge: string | null
  loading: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      disabled={loading}
      className="w-full rounded-[18px] px-5 py-4 flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50"
      style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-accent-border)' }}
    >
      <div className="flex flex-col items-start gap-0.5">
        <p className="text-[16px] font-black text-white">{label}</p>
        {badge && (
          <span className="text-[12px] font-black px-2 py-0.5 rounded-full" style={{ background: 'var(--f-income-border)', color: 'var(--f-income)' }}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-[22px] font-black text-white tabular-nums">{price}</span>
          <span className="text-[14px] font-bold" style={{ color: 'var(--f-text-3)' }}>{period}</span>
        </div>
        {loading
          ? <i className="fa-solid fa-spinner fa-spin text-sm" style={{ color: 'var(--f-blue)' }} />
          : <i className="fa-solid fa-chevron-right text-xs" style={{ color: 'var(--f-accent-border)' }} />}
      </div>
    </button>
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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [linkingPerson, setLinkingPerson] = useState<{ id: string; name: string; currentLinkedUserId?: string | null } | null>(null)
  const [managingLink, setManagingLink] = useState<{ id: string; confirming: boolean } | null>(null)
  const [isUnlinkPending, startUnlink] = useTransition()

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
      setDeleteConfirm(null)
    })
  }

  function handleUnlinkPerson(id: string) {
    startUnlink(async () => {
      const res = await linkPersonToUser(id, null)
      if (res.error) { toast.error(res.error); return }
      setContacts(prev => prev.map(p => p.id === id ? { ...p, linked_user_id: null, linked_profile: null } : p))
      toast.success('Desvinculado')
    })
  }

  function handlePersonLinked(personId: string, profile: PublicProfile) {
    setContacts(prev => prev.map(p => p.id === personId ? { ...p, linked_user_id: profile.id, linked_profile: profile } : p))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Contactos</p>
        <button onClick={() => setEditing({ name: '' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[15px] font-bold transition-all active:scale-95" style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)' }}>
          <i className="fa-solid fa-plus" /> Nuevo
        </button>
      </div>

      {contacts.length === 0 && !editing && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--f-text-4)' }}>Sin contactos configurados</p>
      )}

      {contacts.map((person, i) => (
        <div key={person.id} className="rounded-2xl px-4 py-3.5 animate-fade-up" style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-accent-bg)', animationDelay: `${i * 0.04}s` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-[16px] flex-shrink-0" style={{ background: 'rgba(100,210,255,0.12)', color: 'var(--f-transfer)' }}>
              {person.name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{person.name}</p>
              {person.linked_profile?.username ? (
                <p className="text-[13px] font-semibold" style={{ color: 'var(--f-blue)' }}>@{person.linked_profile.username}</p>
              ) : (
                <p className="text-[13px] font-semibold" style={{ color: 'var(--f-text-4)' }}>Sin vincular a Flux</p>
              )}
            </div>
            <button
              onClick={() => {
                if (person.linked_user_id) {
                  setManagingLink(managingLink?.id === person.id ? null : { id: person.id, confirming: false })
                  setDeleteConfirm(null)
                } else {
                  setLinkingPerson({ id: person.id, name: person.name })
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90"
              style={{ background: person.linked_user_id ? 'var(--f-accent-bg)' : 'var(--f-bg-input)' }}
            >
              <i className={`fa-solid ${person.linked_user_id ? 'fa-link' : 'fa-link-slash'} text-xs`}
                style={{ color: person.linked_user_id ? 'var(--f-blue)' : 'var(--f-text-4)' }} />
            </button>
            <button onClick={() => setEditing({ id: person.id, name: person.name })} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>
              <i className="fa-solid fa-pen text-xs" />
            </button>
            {deleteConfirm === person.id ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold" style={{ color: 'var(--f-text-2)', background: 'var(--f-bg-input)' }}>No</button>
                <button onClick={() => handleDelete(person.id)} className="px-3 py-1.5 rounded-xl text-[15px] font-bold text-white" style={{ background: 'var(--f-expense)' }}>Sí</button>
              </div>
            ) : (
              <button onClick={() => { setDeleteConfirm(person.id); setManagingLink(null) }} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>
                <i className="fa-solid fa-trash text-xs" />
              </button>
            )}
          </div>

          {/* Link management panel */}
          {managingLink?.id === person.id && (
            <div className="mt-3 pt-3 animate-fade-up" style={{ borderTop: '1px solid var(--f-line)' }}>
              {managingLink.confirming ? (
                <div className="space-y-2">
                  <p className="text-[14px] font-bold text-center" style={{ color: 'var(--f-text-2)' }}>
                    ¿Desvincular de @{person.linked_profile?.username}?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setManagingLink({ id: person.id, confirming: false })}
                      className="flex-1 py-2 rounded-[10px] text-[14px] font-black"
                      style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}
                    >
                      No
                    </button>
                    <button
                      onClick={() => { handleUnlinkPerson(person.id); setManagingLink(null) }}
                      disabled={isUnlinkPending}
                      className="flex-1 py-2 rounded-[10px] text-[14px] font-black text-white disabled:opacity-50"
                      style={{ background: 'var(--f-expense)' }}
                    >
                      {isUnlinkPending ? <i className="fa-solid fa-spinner fa-spin" /> : 'Sí, quitar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setManagingLink(null); setLinkingPerson({ id: person.id, name: person.name, currentLinkedUserId: person.linked_user_id }) }}
                    className="flex-1 py-2 rounded-[10px] text-[14px] font-black transition-all active:scale-95"
                    style={{ background: 'var(--f-accent-bg)', color: 'var(--f-blue)', border: '1px solid var(--f-accent-border)' }}
                  >
                    <i className="fa-solid fa-arrow-right-arrow-left mr-1 text-[12px]" />
                    Cambiar
                  </button>
                  <button
                    onClick={() => setManagingLink({ id: person.id, confirming: true })}
                    className="flex-1 py-2 rounded-[10px] text-[14px] font-black transition-all active:scale-95"
                    style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)', border: '1px solid var(--f-line)' }}
                  >
                    <i className="fa-solid fa-link-slash mr-1 text-[12px]" />
                    Quitar
                  </button>
                </div>
              )}
            </div>
          )}
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
              style={{ background: 'var(--f-bg-input)', border: '1px solid var(--f-line)' }}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--f-bg-input)', color: 'var(--f-text-3)' }}>Cancelar</button>
              <button onClick={handleSave} disabled={isPending || !editing.name.trim()} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: 'var(--f-blue)' }}>Guardar</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {linkingPerson && (
        <LinkPersonModal
          personId={linkingPerson.id}
          personName={linkingPerson.name}
          currentLinkedUserId={linkingPerson.currentLinkedUserId}
          onClose={() => setLinkingPerson(null)}
          onLinked={(profile) => { handlePersonLinked(linkingPerson.id, profile); setLinkingPerson(null) }}
        />
      )}
    </div>
  )
}
