'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { RevealWrapper } from './RevealWrapper'

const BLUE = '#007AFF'
const DARK = '#1D1D1F'
const GRAY = '#6E6E73'
const LIGHT_GRAY = '#F5F5F7'
const WHITE = '#FFFFFF'

/* ── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar({ scrolled, isAuthenticated }: { scrolled: boolean; isAuthenticated: boolean }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[60px]">
        <span className="text-[22px] font-black tracking-tight" style={{ color: BLUE }}>fluxapp finance</span>
        <div className="flex items-center gap-3">
          <Link
            href="/guia"
            className="hidden sm:block text-[15px] font-semibold px-3 py-1.5 rounded-[10px] transition-all"
            style={{ color: GRAY }}
          >
            Guía
          </Link>
          {isAuthenticated ? (
            <Link
              href="/home"
              className="text-[15px] font-bold px-4 py-2 rounded-[10px] transition-all active:scale-95"
              style={{ background: BLUE, color: WHITE }}
            >
              Ir a la app →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[15px] font-bold px-4 py-2 rounded-[10px] transition-all active:scale-95"
              style={{ background: BLUE, color: WHITE }}
            >
              Comenzar gratis
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

/* ── Hero iPhone Mockup ──────────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 240, height: 520 }}>
      <div
        className="absolute inset-0 rounded-[50px]"
        style={{
          background: '#0F172A',
          boxShadow: '0 48px 96px rgba(0,0,0,0.30), 0 0 0 1.5px rgba(255,255,255,0.10) inset',
        }}
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[72px] h-[24px] rounded-full z-10" style={{ background: '#000' }} />
        <div className="absolute inset-[3px] rounded-[48px] overflow-hidden" style={{ background: '#020617' }}>
          <div className="px-4 pt-12 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <i className="fa-solid fa-bars text-white text-[10px]" />
              </div>
              <div>
                <p className="text-[7px] font-black uppercase tracking-[2px] leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>JUNIO 2026</p>
                <p className="text-[14px] font-black text-white leading-tight">Hola, Carlos</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="fa-regular fa-bell text-white text-[11px]" />
            </div>
          </div>
          <div className="mx-3 mb-2.5 rounded-[20px] p-4" style={{ background: '#007AFF', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}>
            <p className="text-[7px] font-black uppercase tracking-[2px] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>SALDO ACTUAL</p>
            <p className="text-[26px] font-black text-white leading-none tabular-nums">$12,480.50</p>
          </div>
          <div className="mx-3 mb-2.5 rounded-[14px] p-3"
            style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[7px] font-black uppercase tracking-[2px]" style={{ color: 'rgba(255,255,255,0.40)' }}>PRESUPUESTO DEL MES</p>
              <i className="fa-solid fa-pen text-[7px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <p className="text-[15px] font-black text-white tabular-nums leading-none">$3,240.00</p>
            <p className="text-[7px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>de $10,000.00 · te quedan $6,760</p>
            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: '32%', background: '#30D158' }} />
            </div>
          </div>
          <div className="mx-3 mb-2 rounded-[14px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex-1 py-2 text-center text-[9px] font-black uppercase tracking-[1px]"
                style={{ background: '#007AFF', color: '#fff' }}>HOY</div>
              <div className="flex-1 py-2 text-center text-[9px] font-black uppercase tracking-[1px]"
                style={{ color: 'rgba(255,255,255,0.35)' }}>SEMANA</div>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-center text-[8px] font-bold mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Hoy</p>
              <div className="flex items-center justify-between">
                <i className="fa-solid fa-chevron-left text-[7px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <p className="text-[20px] font-black text-white tabular-nums">$450.00</p>
                <i className="fa-solid fa-chevron-right text-[7px]" style={{ color: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-around items-center px-3 pb-4 pt-3"
            style={{ background: 'rgba(2,6,23,0.96)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <i className="fa-solid fa-wallet" style={{ fontSize: 16, color: '#ffffff' }} />
            <i className="fa-solid fa-list" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#007AFF' }}>
              <i className="fa-solid fa-plus text-white text-[14px]" />
            </div>
            <i className="fa-solid fa-chart-pie" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            <i className="fa-solid fa-users" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden" style={{ background: WHITE }}>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.07) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold mb-6"
              style={{ background: 'rgba(0,122,255,0.08)', color: BLUE, border: '1px solid rgba(0,122,255,0.2)' }}
            >
              <i className="fa-brands fa-apple text-[12px]" />
              Integrado con Apple Pay
            </div>
            <h1
              className="text-[40px] sm:text-[58px] lg:text-[64px] font-black leading-[1.05] tracking-[-2px] mb-6"
              style={{ color: DARK }}
            >
              Tu dinero.{' '}
              <br className="hidden sm:block" />
              <span style={{ color: BLUE }}>Bajo control.</span>{' '}
              <br />
              Automáticamente.
            </h1>
            <p className="text-[18px] sm:text-[20px] font-medium leading-relaxed mb-8 max-w-lg" style={{ color: GRAY }}>
              Registra gastos automáticamente con Apple Pay, divide cuentas con amigos y mantén el control real de tu dinero — sin esfuerzo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[14px] text-[17px] font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: BLUE, boxShadow: `0 8px 24px rgba(0,122,255,0.35)` }}
              >
                Comenzar gratis
                <i className="fa-solid fa-arrow-right text-[15px]" />
              </Link>
            </div>
            <div className="flex flex-col gap-1.5 mt-5">
              {[
                'Empieza en segundos',
                'No requiere instalación',
                '20 días gratis · Sin tarjeta',
              ].map((item) => (
                <p key={item} className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'rgba(0,0,0,0.45)' }}>
                  <i className="fa-solid fa-check" style={{ color: BLUE, fontSize: 11, flexShrink: 0 }} />
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div style={{ animation: 'heroFloat 6s ease-in-out infinite', display: 'inline-block' }}>
              <PhoneMockup />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </section>
  )
}

/* ── Pain Section ────────────────────────────────────────────────────────── */
function PainSection() {
  const before = [
    'Gastas sin saber cuánto tienes realmente disponible',
    'Revisas el extracto del banco cuando ya es demasiado tarde',
    'Los gastos pequeños se acumulan sin que te des cuenta',
    'Cada fin de mes: la misma historia, sin ninguna explicación',
  ]
  const after = [
    'Cada pago con Apple Pay se registra solo, al instante',
    'Sabes cuánto puedes gastar hoy antes de gastar',
    'Controlas lo que te deben y lo que debes, sin drama',
    'El mes termina igual que empezó: con claridad total',
  ]
  return (
    <section style={{ background: WHITE }}>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-14">
          <h2 className="text-[36px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px]" style={{ color: DARK }}>
            "Siempre olvido<br />registrar mis gastos."
          </h2>
          <p className="text-[18px] font-medium mt-4 max-w-lg mx-auto" style={{ color: GRAY }}>
            No es falta de disciplina. Es que registrar a mano es molesto.{' '}
            <span style={{ color: DARK, fontWeight: 700 }}>FluxApp lo hace solo.</span>
          </p>
        </RevealWrapper>

        <div className="grid sm:grid-cols-2 gap-5">
          <RevealWrapper direction="left" delay={80}>
            <div className="rounded-[24px] p-7 h-full" style={{ background: LIGHT_GRAY, border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,69,58,0.12)' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#FF453A', fontSize: 20 }} />
                </div>
                <p className="text-[17px] font-black" style={{ color: DARK }}>Sin FluxApp</p>
              </div>
              <ul className="space-y-4">
                {before.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: '#FF453A' }} />
                    <span className="text-[15px] font-semibold leading-snug" style={{ color: GRAY }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealWrapper>

          <RevealWrapper direction="right" delay={160}>
            <div className="rounded-[24px] p-7 h-full" style={{ background: '#F0FFF4', border: '1px solid rgba(48,209,88,0.2)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(48,209,88,0.2)' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: '#30D158', fontSize: 20 }} />
                </div>
                <p className="text-[17px] font-black" style={{ color: DARK }}>Con FluxApp Finance</p>
              </div>
              <ul className="space-y-4">
                {after.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: '#30D158' }} />
                    <span className="text-[15px] font-semibold leading-snug" style={{ color: '#1A4731' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}

/* ── Showcase phone frame (elegant titanium) ──────────────────────────────── */
function PhoneFrame({ children, glow = false }: { children: ReactNode; glow?: boolean }) {
  const btnStyle = (side: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    [side]: -3,
    width: 3,
    borderRadius: 2,
    background: side === 'left'
      ? 'linear-gradient(90deg, #A8A8AE 0%, #C8C8CE 100%)'
      : 'linear-gradient(270deg, #A8A8AE 0%, #C8C8CE 100%)',
  })
  return (
    <div className="relative mx-auto flex-shrink-0" style={{ width: 216, height: 468 }}>
      {/* Volume up */}
      <div style={{ ...btnStyle('left'), top: 88, height: 26 }} />
      {/* Volume down */}
      <div style={{ ...btnStyle('left'), top: 122, height: 42 }} />
      {/* Mute */}
      <div style={{ ...btnStyle('left'), top: 172, height: 42 }} />
      {/* Power */}
      <div style={{ ...btnStyle('right'), top: 136, height: 52 }} />

      <div className="absolute inset-0 rounded-[46px]" style={{
        background: 'linear-gradient(160deg, #DADADF 0%, #B6B6BC 45%, #BDBDC3 100%)',
        boxShadow: glow
          ? '0 32px 64px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 48px rgba(0,122,255,0.18)'
          : '0 18px 44px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
      }}>
        {/* Dynamic Island */}
        <div className="absolute left-1/2 -translate-x-1/2 rounded-full z-10"
          style={{ top: 10, width: 62, height: 21, background: '#000' }} />
        {/* Inner edge highlight */}
        <div className="absolute rounded-[44px]" style={{
          inset: 1.5,
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          zIndex: 5,
          borderRadius: 44,
        }} />
        {/* Screen */}
        <div className="absolute rounded-[43px] overflow-hidden" style={{ inset: 2.5, background: '#020617' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function ShowcaseBottomNav({ active }: { active: number }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-3 pt-2.5"
      style={{ background: 'rgba(2,6,23,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {(['fa-wallet', 'fa-list', null, 'fa-chart-pie', 'fa-users'] as (string | null)[]).map((icon, i) =>
        icon === null ? (
          <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#007AFF' }}>
            <i className="fa-solid fa-plus text-white" style={{ fontSize: 11 }} />
          </div>
        ) : (
          <i key={i} className={`fa-solid ${icon}`}
            style={{ fontSize: 14, color: i === active ? '#007AFF' : 'rgba(255,255,255,0.25)' }} />
        )
      )}
    </div>
  )
}

/* ── Showcase screen: Transactions ──────────────────────────────────────── */
function PhoneTransactions() {
  return (
    <PhoneFrame>
      <div className="px-3 pt-9 pb-2 flex items-center justify-between">
        <i className="fa-solid fa-chevron-left" style={{ fontSize: 10, color: '#007AFF' }} />
        <div className="flex items-center gap-1">
          <p className="font-black text-white" style={{ fontSize: 13 }}>Junio 2026</p>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }} />
        </div>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }} />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mx-3 mb-2">
        {[
          { label: 'INGRESOS', val: '+$15,000', color: '#30D158', bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.2)' },
          { label: 'GASTOS', val: '-$4,280', color: '#FF453A', bg: 'rgba(255,69,58,0.1)', border: 'rgba(255,69,58,0.2)' },
        ].map((c, i) => (
          <div key={i} className="rounded-[12px] px-3 py-2" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <p className="font-black uppercase" style={{ fontSize: 6, letterSpacing: 2, color: c.color }}>{c.label}</p>
            <p className="font-black tabular-nums" style={{ fontSize: 13, color: c.color }}>{c.val}</p>
          </div>
        ))}
      </div>
      <p className="mx-3 font-black uppercase mb-1.5" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.35)' }}>HOY</p>
      {[
        { name: 'Starbucks', cat: 'Café', amt: '-$115', color: '#FF453A', bg: '#00704A', icon: 'fa-mug-hot' },
        { name: 'Uber', cat: 'Transporte', amt: '-$87', color: '#FF453A', bg: '#1a1a1a', icon: 'fa-car' },
      ].map((tx, i) => (
        <div key={i} className="flex items-center gap-2 mx-3 mb-1.5 rounded-[11px] px-2.5 py-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: tx.bg }}>
            <i className={`fa-solid ${tx.icon}`} style={{ fontSize: 9, color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white leading-none truncate" style={{ fontSize: 10 }}>{tx.name}</p>
            <p className="font-medium leading-none mt-0.5" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>{tx.cat}</p>
          </div>
          <p className="font-black tabular-nums flex-shrink-0" style={{ fontSize: 10, color: tx.color }}>{tx.amt}</p>
        </div>
      ))}
      <p className="mx-3 font-black uppercase mb-1.5 mt-1" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.35)' }}>AYER</p>
      {[
        { name: 'OXXO', cat: 'Mercado', amt: '-$68', color: '#FF453A', bg: '#E83526', icon: 'fa-store' },
        { name: 'Netflix', cat: 'Entretenimiento', amt: '-$209', color: '#FF453A', bg: '#E50914', icon: 'fa-tv' },
        { name: 'Sueldo', cat: 'Ingreso', amt: '+$9,000', color: '#30D158', bg: '#1B4332', icon: 'fa-briefcase' },
      ].map((tx, i) => (
        <div key={i} className="flex items-center gap-2 mx-3 mb-1.5 rounded-[11px] px-2.5 py-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: tx.bg }}>
            <i className={`fa-solid ${tx.icon}`} style={{ fontSize: 9, color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white leading-none truncate" style={{ fontSize: 10 }}>{tx.name}</p>
            <p className="font-medium leading-none mt-0.5" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>{tx.cat}</p>
          </div>
          <p className="font-black tabular-nums flex-shrink-0" style={{ fontSize: 10, color: tx.color }}>{tx.amt}</p>
        </div>
      ))}
      <ShowcaseBottomNav active={1} />
    </PhoneFrame>
  )
}

/* ── Showcase screen: Dashboard ─────────────────────────────────────────── */
function PhoneDashboard() {
  return (
    <PhoneFrame glow>
      <div className="px-3.5 pt-9 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-[8px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <i className="fa-solid fa-bars text-white" style={{ fontSize: 9 }} />
          </div>
          <div>
            <p className="font-black uppercase leading-none" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.35)' }}>JUNIO 2026</p>
            <p className="font-black text-white leading-tight" style={{ fontSize: 13 }}>Hola, Carlos</p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <i className="fa-regular fa-bell text-white" style={{ fontSize: 10 }} />
        </div>
      </div>
      <div className="mx-3 mb-2 rounded-[18px] p-3.5" style={{ background: '#007AFF', boxShadow: '0 6px 20px rgba(0,122,255,0.4)' }}>
        <p className="font-black uppercase leading-none mb-1" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.65)' }}>SALDO ACTUAL</p>
        <p className="font-black text-white leading-none tabular-nums" style={{ fontSize: 24 }}>$12,480.50</p>
      </div>
      <div className="mx-3 mb-2 rounded-[12px] p-2.5" style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)' }}>
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-black uppercase" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.40)' }}>PRESUPUESTO DEL MES</p>
          <i className="fa-solid fa-pen" style={{ fontSize: 6, color: 'rgba(255,255,255,0.3)' }} />
        </div>
        <p className="font-black text-white tabular-nums leading-none" style={{ fontSize: 14 }}>$3,240.00</p>
        <p className="font-semibold mb-1" style={{ fontSize: 6, color: 'rgba(255,255,255,0.35)' }}>
          de $10,000.00 · <span style={{ color: '#30D158' }}>te quedan $6,760.00</span>
        </p>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full" style={{ width: '32%', background: '#30D158' }} />
        </div>
      </div>
      <div className="mx-3 mb-2 rounded-[12px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex-1 py-1.5 text-center font-black uppercase"
            style={{ fontSize: 8, letterSpacing: 1, background: '#007AFF', color: '#fff' }}>HOY</div>
          <div className="flex-1 py-1.5 text-center font-black uppercase"
            style={{ fontSize: 8, letterSpacing: 1, color: 'rgba(255,255,255,0.35)' }}>SEMANA</div>
        </div>
        <div className="px-3 py-2">
          <p className="text-center font-bold mb-0.5" style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>Hoy</p>
          <div className="flex items-center justify-between">
            <i className="fa-solid fa-chevron-left" style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)' }} />
            <p className="font-black text-white tabular-nums" style={{ fontSize: 18 }}>$450.00</p>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      </div>
      <div className="mx-3 rounded-[12px] p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="font-black uppercase mb-2" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.35)' }}>PRÓXIMOS RECURRENTES</p>
        {[
          { name: 'Netflix', date: 'Mié, 10', amt: '-$209', bg: '#E50914', green: false },
          { name: 'Spotify', date: 'Vie, 12', amt: '-$89', bg: '#1ED760', green: false },
          { name: 'Sueldo', date: 'Lun, 15', amt: '+$15,000', bg: '#1B4332', green: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-[6px] flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              <i className="fa-solid fa-rotate" style={{ fontSize: 7, color: '#fff' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white leading-none" style={{ fontSize: 9 }}>{item.name}</p>
              <p className="font-medium" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>{item.date}</p>
            </div>
            <p className="font-black tabular-nums" style={{ fontSize: 9, color: item.green ? '#30D158' : '#FF453A' }}>{item.amt}</p>
          </div>
        ))}
      </div>
      <ShowcaseBottomNav active={0} />
    </PhoneFrame>
  )
}

/* ── Showcase screen: Estado de Cuentas ─────────────────────────────────── */
/* ── Showcase screen: Cuentas + Pagos TDC (combined) ────────────────────── */
/* ── Showcase screen: Cuentas + Pagos TDC ───────────────────────────────── */
function PhoneAccountsAndTDC() {
  // Credit cards (salmon) are paired 1:1 with TDC payment entries
  const accounts = [
    { name: 'CARTERA', type: 'cash', amt: '$5,240.00' },
    { name: 'DÉBITO DIGITAL', type: 'debit', amt: '$1,820.50' },
    { name: 'TDC LIKEU', type: 'credit', amt: '-$4,280.00', tdcLabel: 'TDC LikeU', daysLeft: 8 },
    { name: 'DÉBITO NUBE', type: 'debit', amt: '$13,440.00' },
    { name: 'TDC GOLD', type: 'credit', amt: '-$6,150.00', tdcLabel: 'TDC Gold', daysLeft: 13 },
    { name: 'DÉBITO AHORRO', type: 'debit', amt: '$320.80' },
  ]
  const creditCards = accounts.filter(a => a.type === 'credit') as (typeof accounts[0] & { tdcLabel: string; daysLeft: number })[]

  const cardBg = (type: string) =>
    type === 'cash'
      ? 'linear-gradient(160deg, #22C55E 0%, #15803D 100%)'
      : type === 'debit'
      ? 'linear-gradient(160deg, #3B82F6 0%, #1D4ED8 100%)'
      : 'linear-gradient(160deg, #F87171 0%, #DC2626 100%)'

  return (
    <PhoneFrame>
      {/* Header — matches real app */}
      <div className="flex items-center gap-2 px-3 pt-9 pb-2">
        <div className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <i className="fa-solid fa-bars text-white" style={{ fontSize: 10 }} />
        </div>
        <div className="flex-1">
          <p className="font-black uppercase leading-none" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>JUNIO 2026</p>
          <p className="font-black text-white leading-tight" style={{ fontSize: 14 }}>Hola, Carlos</p>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <i className="fa-regular fa-bell text-white" style={{ fontSize: 10 }} />
        </div>
      </div>

      {/* ESTADO DE CUENTAS label + actions */}
      <div className="flex items-center gap-1.5 mx-3 mb-1.5">
        <p className="flex-1 font-black uppercase" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.38)' }}>ESTADO DE CUENTAS</p>
        <div className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.35)' }}>
          <i className="fa-solid fa-plus" style={{ fontSize: 7, color: '#007AFF' }} />
        </div>
        <div className="flex items-center gap-1 rounded-[7px] px-1.5 py-1"
          style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.3)' }}>
          <i className="fa-solid fa-sliders" style={{ fontSize: 6, color: '#007AFF' }} />
          <p className="font-black" style={{ fontSize: 6, color: '#007AFF' }}>AUDITAR</p>
        </div>
      </div>

      {/* Accounts 2-col grid — 3 rows */}
      <div className="grid grid-cols-2 gap-1.5 mx-3 mb-2">
        {accounts.map((a, i) => (
          <div key={i} className="rounded-[12px] p-2.5 relative overflow-hidden" style={{ background: cardBg(a.type) }}>
            <div className="flex items-start justify-between mb-1.5">
              <p className="font-black uppercase leading-tight" style={{ fontSize: 6, letterSpacing: 1, color: 'rgba(255,255,255,0.85)', maxWidth: 54 }}>{a.name}</p>
              <i className={`fa-solid ${a.type === 'cash' ? 'fa-money-bill-wave' : 'fa-credit-card'}`}
                style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
            </div>
            <p className="font-black text-white leading-none tabular-nums" style={{ fontSize: i === 0 ? 12 : 10 }}>{a.amt}</p>
          </div>
        ))}
      </div>

      {/* PAGOS TDC — exactly 1 entry per credit card */}
      <p className="mx-3 font-black uppercase mb-1" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.38)' }}>PAGOS TDC</p>
      <div className="mx-3 rounded-[12px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {creditCards.map((c, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2"
            style={{ borderBottom: i < creditCards.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div className="w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(248,113,113,0.15)' }}>
              <i className="fa-solid fa-credit-card" style={{ fontSize: 8, color: '#F87171' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white leading-none" style={{ fontSize: 9 }}>{c.tdcLabel}</p>
              <p style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.4)' }}>Vence en {c.daysLeft} días</p>
            </div>
            <div className="rounded-full px-2 py-0.5 font-black flex-shrink-0"
              style={{ background: '#007AFF', fontSize: 7, color: '#fff' }}>
              Pagar
            </div>
          </div>
        ))}
      </div>

      {/* Sticky bottom: first upcoming TDC */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2"
        style={{ background: 'rgba(8,10,18,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-6 h-6 rounded-[8px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(248,113,113,0.15)' }}>
          <i className="fa-solid fa-credit-card" style={{ fontSize: 8, color: '#F87171' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white leading-none" style={{ fontSize: 8.5 }}>TDC LikeU</p>
          <p style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.38)' }}>Vence en 8 días</p>
        </div>
        <div className="rounded-full px-2.5 py-1 font-black"
          style={{ background: '#007AFF', fontSize: 8, color: '#fff' }}>
          Pagar
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ── Showcase screen: Gastos Compartidos ─────────────────────────────────── */
function PhoneShared() {
  return (
    <PhoneFrame>
      <div className="px-3 pt-9 pb-2 flex items-center justify-between">
        <div>
          <p className="font-black uppercase" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>GASTOS</p>
          <p className="font-black text-white" style={{ fontSize: 15 }}>Compartidos</p>
        </div>
        <div className="flex items-center gap-1 rounded-[10px] px-2 py-1.5"
          style={{ background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.25)' }}>
          <i className="fa-solid fa-user-plus" style={{ fontSize: 7, color: '#007AFF' }} />
          <p className="font-bold" style={{ fontSize: 7, color: '#007AFF' }}>Amigos</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mx-3 mb-2">
        {[
          { label: 'ME DEBEN', val: '+$1,200', color: '#30D158', bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.2)' },
          { label: 'DEBO', val: '-$350', color: '#FF453A', bg: 'rgba(255,69,58,0.1)', border: 'rgba(255,69,58,0.2)' },
        ].map((c, i) => (
          <div key={i} className="rounded-[12px] px-3 py-2" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <p className="font-black uppercase" style={{ fontSize: 6, letterSpacing: 2, color: c.color }}>{c.label}</p>
            <p className="font-black tabular-nums" style={{ fontSize: 14, color: c.color }}>{c.val}</p>
          </div>
        ))}
      </div>
      {[
        { name: 'Fernando', sub: '4 gastos pendientes', amt: '+$650', color: '#30D158', initials: 'F', positive: true },
        { name: 'Santi', sub: '2 gastos · @santi_m', amt: '+$550', color: '#30D158', initials: 'S', positive: true },
        { name: 'Ale', sub: '1 gasto pendiente', amt: '-$350', color: '#FF453A', initials: 'A', positive: false },
      ].map((p, i) => (
        <div key={i} className="mx-3 mb-2 rounded-[13px] p-2.5"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-black"
              style={{ background: p.positive ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)', color: p.positive ? '#30D158' : '#FF453A', fontSize: 10 }}>
              {p.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white leading-none" style={{ fontSize: 10 }}>{p.name}</p>
              <p className="font-medium" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }}>{p.sub}</p>
            </div>
            <p className="font-black tabular-nums flex-shrink-0" style={{ fontSize: 10, color: p.color }}>{p.amt}</p>
          </div>
          <div className="flex gap-1.5">
            {['Abonar', 'Saldar todo'].map(label => (
              <div key={label} className="flex-1 rounded-[8px] py-1 text-center font-bold"
                style={{ background: 'rgba(255,255,255,0.07)', fontSize: 7, color: 'rgba(255,255,255,0.65)' }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      ))}
      <ShowcaseBottomNav active={4} />
    </PhoneFrame>
  )
}

/* ── Showcase screen: Gastos por Categoría ──────────────────────────────── */
function PhoneCategoryChart() {
  const categories = [
    { name: 'Entretenimiento', amt: '$1,624', pct: '38%', color: '#FF9500', w: '38%' },
    { name: 'Comida', amt: '$1,245', pct: '29%', color: '#FF453A', w: '29%' },
    { name: 'Transporte', amt: '$900', pct: '21%', color: '#007AFF', w: '21%' },
    { name: 'Otros', amt: '$511', pct: '12%', color: '#5E5CE6', w: '12%' },
  ]
  return (
    <PhoneFrame>
      <div className="px-3 pt-9 pb-2 flex items-center justify-between">
        <i className="fa-solid fa-chevron-left" style={{ fontSize: 10, color: '#007AFF' }} />
        <div className="flex items-center gap-1">
          <p className="font-black text-white" style={{ fontSize: 13 }}>Junio 2026</p>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }} />
        </div>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }} />
      </div>
      <div className="flex mx-3 mb-3 rounded-[10px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex-1 py-1.5 text-center font-black uppercase"
          style={{ fontSize: 7, letterSpacing: 1, background: '#007AFF', color: '#fff' }}>CATEGORÍAS</div>
        <div className="flex-1 py-1.5 text-center font-black uppercase"
          style={{ fontSize: 7, letterSpacing: 1, color: 'rgba(255,255,255,0.35)' }}>TENDENCIA</div>
      </div>
      <div className="flex flex-col items-center mb-3">
        <p className="font-black uppercase mb-2" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>GASTOS POR CATEGORÍA</p>
        <div className="relative" style={{ width: 96, height: 96 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'conic-gradient(#FF9500 0% 38%, #FF453A 38% 67%, #007AFF 67% 88%, #5E5CE6 88% 100%)',
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center rounded-full"
              style={{ width: 56, height: 56, background: '#020617' }}>
              <p className="font-black leading-none" style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.5)' }}>TOTAL</p>
              <p className="font-black text-white leading-tight" style={{ fontSize: 13 }}>$4,280</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-3">
        <p className="font-black uppercase mb-2" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>DESGLOSE</p>
        {categories.map((cat, i) => (
          <div key={i} className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <p className="font-bold text-white" style={{ fontSize: 9 }}>{cat.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-black text-white" style={{ fontSize: 9 }}>{cat.amt}</p>
                <p className="font-bold" style={{ fontSize: 8, color: cat.color }}>{cat.pct}</p>
              </div>
            </div>
            <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: cat.w, background: cat.color }} />
            </div>
          </div>
        ))}
      </div>
      <ShowcaseBottomNav active={3} />
    </PhoneFrame>
  )
}

/* ── Showcase screen: Tendencia ──────────────────────────────────────────── */
function PhoneTrends() {
  const bars = [
    { m: 'ENE', i: 52, g: 40 },
    { m: 'FEB', i: 60, g: 48 },
    { m: 'MAR', i: 56, g: 36 },
    { m: 'ABR', i: 72, g: 55 },
    { m: 'MAY', i: 90, g: 68 },
    { m: 'JUN', i: 22, g: 18 },
  ]
  return (
    <PhoneFrame>
      <div className="px-3 pt-9 pb-2 flex items-center justify-between">
        <i className="fa-solid fa-chevron-left" style={{ fontSize: 10, color: '#007AFF' }} />
        <div className="flex items-center gap-1">
          <p className="font-black text-white" style={{ fontSize: 13 }}>Junio 2026</p>
          <i className="fa-solid fa-chevron-down" style={{ fontSize: 7, color: 'rgba(255,255,255,0.4)' }} />
        </div>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }} />
      </div>
      <div className="flex mx-3 mb-2 rounded-[10px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex-1 py-1.5 text-center font-black uppercase"
          style={{ fontSize: 7, letterSpacing: 1, color: 'rgba(255,255,255,0.35)' }}>CATEGORÍAS</div>
        <div className="flex-1 py-1.5 text-center font-black uppercase"
          style={{ fontSize: 7, letterSpacing: 1, background: '#007AFF', color: '#fff' }}>TENDENCIA</div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mx-3 mb-2">
        {[
          { label: 'INGRESOS', val: '+$15,000', color: '#30D158', bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.2)' },
          { label: 'GASTOS', val: '-$4,280', color: '#FF453A', bg: 'rgba(255,69,58,0.1)', border: 'rgba(255,69,58,0.2)' },
        ].map((c, i) => (
          <div key={i} className="rounded-[11px] px-3 py-2" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <p className="font-black uppercase" style={{ fontSize: 6, letterSpacing: 2, color: c.color }}>{c.label}</p>
            <p className="font-black tabular-nums" style={{ fontSize: 12, color: c.color }}>{c.val}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 mx-3 mb-2">
        {[
          { label: 'TASA DE GASTO', val: '$1,120', sub: 'por día', color: '#FF453A' },
          { label: 'FLUJO NETO', val: '+$10,720', sub: 'este mes', color: '#30D158' },
          { label: 'PROM. MENSUAL', val: '$8,540', sub: 'de gasto', color: 'rgba(255,255,255,0.7)' },
          { label: 'TASA DE AHORRO', val: '30%', sub: 'de ingresos', color: '#5E5CE6' },
        ].map((m, i) => (
          <div key={i} className="rounded-[11px] px-2.5 py-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-black uppercase" style={{ fontSize: 5.5, letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)' }}>{m.label}</p>
            <p className="font-black leading-tight" style={{ fontSize: 11, color: m.color }}>{m.val}</p>
            <p className="font-semibold" style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="mx-3 rounded-[12px] p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="font-black uppercase mb-2" style={{ fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.35)' }}>TENDENCIA</p>
        <div className="flex items-end gap-1" style={{ height: 44 }}>
          {bars.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 38 }}>
                <div style={{ width: 5, height: `${bar.i}%`, background: '#30D158', borderRadius: 2 }} />
                <div style={{ width: 5, height: `${bar.g}%`, background: '#FF453A', borderRadius: 2 }} />
              </div>
              <p className="font-black" style={{ fontSize: 5, color: 'rgba(255,255,255,0.35)' }}>{bar.m}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#30D158' }} />
            <p className="font-semibold" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>Ingresos</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF453A' }} />
            <p className="font-semibold" style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>Gastos</p>
          </div>
        </div>
      </div>
      <ShowcaseBottomNav active={3} />
    </PhoneFrame>
  )
}

/* ── App Showcase Section ────────────────────────────────────────────────── */
function AppShowcaseSection() {
  const [activeSlide, setActiveSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  function handleCarouselScroll() {
    const el = carouselRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / (216 + 20))
    setActiveSlide(Math.max(0, Math.min(idx, screens.length - 1)))
  }

  const screens = [
    { key: 'dashboard', node: <PhoneDashboard /> },
    { key: 'accounts-tdc', node: <PhoneAccountsAndTDC /> },
    { key: 'transactions', node: <PhoneTransactions /> },
    { key: 'categories', node: <PhoneCategoryChart /> },
    { key: 'trends', node: <PhoneTrends /> },
    { key: 'shared', node: <PhoneShared /> },
  ]

  return (
    <section style={{ background: DARK, overflow: 'hidden' }}>
      <style>{`
        .flux-carousel { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .flux-carousel::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-16">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>La app</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px] text-white">
            Diseñada para vivir<br />en tu bolsillo.
          </h2>
          <p className="text-[17px] font-medium mt-4 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Dashboard, cuentas, analítica y gastos compartidos — todo en una app que cabe en tu pantalla de inicio.
          </p>
        </RevealWrapper>

        {/* Mobile: swipeable carousel */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flux-carousel flex md:hidden"
          style={{
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            gap: 20,
            paddingLeft: 'calc(50% - 108px)',
            paddingRight: 'calc(50% - 108px)',
            paddingBottom: 20,
          }}
        >
          {screens.map(s => (
            <div key={s.key} style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
              {s.node}
            </div>
          ))}
        </div>

        <div className="flex md:hidden flex-col items-center gap-2 mb-2">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <i className="fa-solid fa-arrow-left text-[9px]" />
            Desliza para explorar
            <i className="fa-solid fa-arrow-right text-[9px]" />
          </p>
          <div className="flex gap-1.5 items-center">
            {screens.map((s, i) => (
              <div
                key={s.key}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeSlide ? 16 : 6,
                  height: 6,
                  background: i === activeSlide ? BLUE : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Desktop: AccountsAndTDC + Dashboard (center, featured) + Transactions */}
        <RevealWrapper className="hidden md:block">
          <div className="flex items-end justify-center gap-5 lg:gap-8">
            <div className="flex-shrink-0" style={{ opacity: 0.65, transform: 'translateY(44px)' }}>
              <div style={{ transform: 'scale(0.88)', transformOrigin: 'bottom center' }}>
                <PhoneAccountsAndTDC />
              </div>
            </div>
            <PhoneDashboard />
            <div className="flex-shrink-0" style={{ opacity: 0.65, transform: 'translateY(44px)' }}>
              <div style={{ transform: 'scale(0.88)', transformOrigin: 'bottom center' }}>
                <PhoneTransactions />
              </div>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}

/* ── Trust bar ───────────────────────────────────────────────────────────── */
function TrustBar() {
  const stats = [
    { icon: 'fa-bolt', label: 'Registro instantáneo', sub: 'Apple Pay lo hace solo' },
    { icon: 'fa-users', label: 'Gastos compartidos', sub: 'Cobra y divide sin drama' },
    { icon: 'fa-lock', label: '100% privado', sub: 'Tus datos, solo tuyos' },
  ]
  return (
    <section style={{ background: LIGHT_GRAY, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8">
        {stats.map((s, i) => (
          <RevealWrapper key={i} delay={i * 80} className="text-center">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(0,122,255,0.1)' }}>
              <i className={`fa-solid ${s.icon} text-[18px]`} style={{ color: BLUE }} />
            </div>
            <p className="text-[17px] font-bold" style={{ color: DARK }}>{s.label}</p>
            <p className="text-[14px] font-medium mt-0.5" style={{ color: GRAY }}>{s.sub}</p>
          </RevealWrapper>
        ))}
      </div>
    </section>
  )
}

/* ── Apple Pay Phone mockup ──────────────────────────────────────────────── */
function PhoneApplePay() {
  return (
    <PhoneFrame glow>
      <div className="h-full flex flex-col" style={{ background: '#000' }}>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 flex-shrink-0"
          style={{ paddingTop: 36, paddingBottom: 8 }}>
          <p className="font-semibold text-white" style={{ fontSize: 9 }}>12:00</p>
          <div className="flex items-center gap-1">
            <i className="fa-solid fa-signal text-white" style={{ fontSize: 7 }} />
            <i className="fa-solid fa-wifi text-white" style={{ fontSize: 7 }} />
            <i className="fa-solid fa-battery-three-quarters text-white" style={{ fontSize: 8 }} />
          </div>
        </div>

        {/* BBVA-style card */}
        <div className="mx-3 rounded-[18px] overflow-hidden relative flex-shrink-0" style={{ height: 138 }}>
          {/* Navy gradient base */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(150deg, #1C4299 0%, #0D2560 55%, #091A46 100%)',
          }} />
          {/* Top-left sheen */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(120deg, rgba(255,255,255,0.08) 0%, transparent 45%)',
          }} />
          {/* Geometric "A" watermark — CSS angular strokes, no font */}
          <div className="absolute" style={{ right: -2, top: 4, width: 96, height: 104, opacity: 0.07, pointerEvents: 'none' }}>
            {/* Left diagonal leg */}
            <div style={{
              position: 'absolute', width: 7, height: 90, background: '#fff',
              borderRadius: 4, left: '30%', top: 8,
              transform: 'rotate(-17deg)', transformOrigin: 'bottom center',
            }} />
            {/* Right diagonal leg */}
            <div style={{
              position: 'absolute', width: 7, height: 90, background: '#fff',
              borderRadius: 4, right: '16%', top: 8,
              transform: 'rotate(17deg)', transformOrigin: 'bottom center',
            }} />
            {/* Crossbar */}
            <div style={{
              position: 'absolute', height: 7, background: '#fff',
              borderRadius: 4, left: '27%', right: '22%', top: '48%',
            }} />
          </div>

          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            {/* Bank name + network */}
            <div className="flex items-start justify-between">
              <p className="font-black text-white" style={{ fontSize: 16, letterSpacing: -0.3 }}>BBVA</p>
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(235,0,27,0.85)' }} />
                <div className="w-5 h-5 rounded-full -ml-2.5" style={{ background: 'rgba(255,163,0,0.85)' }} />
              </div>
            </div>
            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <p className="font-mono text-white" style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' }}>
                ···· 1826
              </p>
              <p className="font-black text-white" style={{ fontSize: 17, fontStyle: 'italic', letterSpacing: 0.5 }}>VISA</p>
            </div>
          </div>
        </div>

        {/* FluxApp notification — directly below card */}
        <div className="mx-3 mt-2.5 rounded-[13px] flex items-center gap-2 px-2.5 py-2 flex-shrink-0"
          style={{
            background: 'rgba(36,36,40,0.98)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}>
          <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#007AFF' }}>
            <i className="fa-solid fa-wallet text-white" style={{ fontSize: 10 }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white" style={{ fontSize: 8.5 }}>Flux Apple Pay</p>
              <p style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>mié 13:50</p>
            </div>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.58)', lineHeight: 1.3 }}>
              Pagaste <span className="font-black text-white">$450.00</span> con TDC Azul
            </p>
          </div>
        </div>

        {/* Success indicator */}
        <div className="flex flex-col items-center flex-1 justify-center gap-1.5">
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 46, height: 46, background: '#007AFF', boxShadow: '0 4px 20px rgba(0,122,255,0.55)' }}>
            <i className="fa-solid fa-check text-white" style={{ fontSize: 20 }} />
          </div>
          <p className="font-semibold text-white" style={{ fontSize: 12 }}>Listo</p>
        </div>

        {/* Stacked cards at bottom (3 visible) */}
        <div className="flex-shrink-0 relative" style={{ height: 52 }}>
          {/* Back card */}
          <div className="absolute bottom-0 left-4 right-4 h-8 rounded-t-[10px]"
            style={{ background: '#E0E0E0' }} />
          {/* Middle card */}
          <div className="absolute bottom-0 left-2.5 right-2.5 h-9 rounded-t-[11px]"
            style={{ background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)' }} />
          {/* Front card (dark, AWS-style) */}
          <div className="absolute bottom-0 left-0 right-0 h-11 rounded-t-[13px] flex items-center px-3 justify-between overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #111 0%, #1e1e1e 100%)' }}>
            <p className="font-black text-white" style={{ fontSize: 9 }}>aws</p>
            <p style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>FECHA DE INICIO</p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ── Apple Pay section ───────────────────────────────────────────────────── */
function ApplePaySection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#000' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 80% 50%, rgba(0,122,255,0.10) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto px-6 py-24 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <RevealWrapper>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-[18px] mb-6"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <i className="fa-brands fa-apple text-white text-[28px]" />
              </div>
            </RevealWrapper>
            <RevealWrapper delay={80}>
              <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Apple Pay · iPhone Shortcuts
              </p>
            </RevealWrapper>
            <RevealWrapper delay={160}>
              <h2 className="text-[38px] sm:text-[52px] font-black leading-[1.05] tracking-[-1.5px] text-white mb-6">
                Cada compra,<br />registrada sola.
              </h2>
            </RevealWrapper>
            <RevealWrapper delay={240}>
              <p className="text-[17px] font-medium leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
                FluxApp Finance se conecta con Atajos de iPhone y captura cada pago con Apple Pay en el momento exacto en que lo haces — sin abrir ninguna app.
              </p>
            </RevealWrapper>
            <RevealWrapper delay={320}>
              <div className="inline-flex items-center gap-3 rounded-[16px] px-5 py-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: '#007AFF' }}>
                  <i className="fa-solid fa-bolt text-white text-[14px]" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-white">Pagas con Apple Pay en OXXO</p>
                  <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    FluxApp registra: −$89 · OXXO · Automático ✓
                  </p>
                </div>
              </div>
            </RevealWrapper>
          </div>

          <RevealWrapper direction="right" delay={160} className="flex justify-center lg:justify-end">
            <div style={{ animation: 'appleFloat 5s ease-in-out infinite', display: 'inline-block' }}>
              <PhoneApplePay />
            </div>
          </RevealWrapper>
        </div>

        {/* ── "Así de fácil" step flow ───────────────────────── */}
        <RevealWrapper delay={200} className="mt-20">
          <p className="text-center font-black text-white mb-10" style={{ fontSize: 22, letterSpacing: -0.5 }}>
            Así de fácil funciona Flux
          </p>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-0">
            {[
              { icon: 'fa-mobile-screen', label: 'Pagas con\nApple Pay', n: 1 },
              { icon: 'fa-bolt', label: 'Flux detecta\nel movimiento', n: 2 },
              { icon: 'fa-receipt', label: 'El gasto se registra\ny categoriza', n: 3 },
              { icon: 'fa-chart-bar', label: 'Tu presupuesto\nse actualiza', n: 4 },
            ].map((step, i, arr) => (
              <div key={i} className="flex sm:flex-col items-center sm:items-center flex-1 relative">
                {/* Dotted connector — desktop: right side; hidden for last */}
                {i < arr.length - 1 && (
                  <div className="hidden sm:block absolute left-1/2 top-[28px]"
                    style={{
                      width: '100%', height: 1,
                      borderTop: '2px dashed rgba(255,255,255,0.15)',
                      zIndex: 0,
                    }}
                  />
                )}
                {/* Circle + icon */}
                <div className="relative flex-shrink-0 z-10" style={{ width: 56, height: 56 }}>
                  <div className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)' }}>
                    <i className={`fa-solid ${step.icon}`} style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)' }} />
                  </div>
                  {/* Number badge */}
                  <div className="absolute flex items-center justify-center rounded-full font-black"
                    style={{
                      width: 18, height: 18, bottom: -2, left: -2,
                      background: '#007AFF', fontSize: 9, color: '#fff',
                      boxShadow: '0 0 0 2px #000',
                    }}>
                    {step.n}
                  </div>
                </div>
                {/* Label */}
                <p className="sm:mt-3 ml-4 sm:ml-0 sm:text-center font-semibold whitespace-pre-line leading-snug"
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', maxWidth: 110 }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </RevealWrapper>
      </div>

      <style>{`
        @keyframes appleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  )
}

/* ── Features ────────────────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { icon: 'fa-chart-line', title: 'Dashboard inteligente', desc: 'Visualiza ingresos, gastos y saldo en tiempo real. Gráficas mensuales y resumen instantáneo de tu situación financiera.', color: '#007AFF' },
    { icon: 'fa-users', title: 'Gastos compartidos', desc: 'Divide cuentas, rastrea deudas y cobra a tus amigos desde la app. Todo en tiempo real, sin calculadoras.', color: '#30D158' },
    { icon: 'fa-bullseye', title: 'Presupuestos', desc: 'Define cuánto quieres gastar por categoría. Flux te avisa cuando te acercas al límite.', color: '#FF9500' },
    { icon: 'fa-wallet', title: 'Multi-cuenta', desc: 'Maneja efectivo, tarjeta de débito y crédito en un solo lugar. Saldos actualizados al instante.', color: '#5E5CE6' },
  ]
  return (
    <section style={{ background: WHITE }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-16">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Funcionalidades</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px]" style={{ color: DARK }}>
            Todo lo que necesitas,<br />nada que no.
          </h2>
        </RevealWrapper>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <RevealWrapper key={i} delay={i * 70}>
              <div className="rounded-[20px] p-6 h-full transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ background: LIGHT_GRAY, border: '1px solid rgba(0,0,0,0.05)', transitionDuration: '0.3s' }}>
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4"
                  style={{ background: `${f.color}18` }}>
                  <i className={`fa-solid ${f.icon} text-[20px]`} style={{ color: f.color }} />
                </div>
                <h3 className="text-[17px] font-bold mb-2" style={{ color: DARK }}>{f.title}</h3>
                <p className="text-[14px] font-medium leading-relaxed" style={{ color: GRAY }}>{f.desc}</p>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Shared section ──────────────────────────────────────────────────────── */
function SharedSection() {
  return (
    <section style={{ background: LIGHT_GRAY }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <RevealWrapper direction="left">
            <div className="rounded-[24px] p-6 max-w-sm mx-auto lg:mx-0" style={{ background: '#1D1D1F' }}>
              <p className="text-[11px] font-black uppercase tracking-[3px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Compartidos</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-[14px] px-4 py-3" style={{ background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.2)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[2px] mb-1" style={{ color: '#30D158' }}>Me deben</p>
                  <p className="text-[20px] font-black text-white tabular-nums">+$1,200</p>
                </div>
                <div className="rounded-[14px] px-4 py-3" style={{ background: 'rgba(255,69,58,0.12)', border: '1px solid rgba(255,69,58,0.2)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[2px] mb-1" style={{ color: '#FF453A' }}>Debo</p>
                  <p className="text-[20px] font-black text-white tabular-nums">-$350</p>
                </div>
              </div>
              {[
                { name: 'Fernando', handle: '@fernando_g', amt: '+$650', color: '#30D158', icon: 'F' },
                { name: 'Santiago', handle: '@santi_mtz', amt: '+$550', color: '#30D158', icon: 'S' },
                { name: 'Raúl', handle: '@raul.lopez', amt: '-$350', color: '#FF453A', icon: 'R' },
              ].map((p, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[14px] px-4 py-3 mb-2"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[13px] font-black"
                    style={{ background: 'rgba(0,122,255,0.15)', color: '#007AFF' }}>{p.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white truncate">{p.name}</p>
                    <p className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.handle}</p>
                  </div>
                  <p className="text-[15px] font-black tabular-nums flex-shrink-0" style={{ color: p.color }}>{p.amt}</p>
                </div>
              ))}
            </div>
          </RevealWrapper>

          <RevealWrapper direction="right">
            <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Gastos compartidos</p>
            <h2 className="text-[38px] sm:text-[48px] font-black leading-[1.06] tracking-[-1.5px] mb-6" style={{ color: DARK }}>
              Divide sin<br />discusiones.
            </h2>
            <p className="text-[17px] font-medium leading-relaxed mb-6" style={{ color: GRAY }}>
              Agrega a tus amigos en FluxApp y divide cualquier gasto en segundos. Cada quien ve lo que debe, el sistema rastrea los pagos y te notifica cuando liquidan.
            </p>
            <ul className="space-y-3">
              {[
                'Divide igual o por montos específicos',
                'Notificaciones en tiempo real para tus amigos',
                'Historial de pagos y liquidaciones',
                'Compatible con múltiples personas por gasto',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(0,122,255,0.1)' }}>
                    <i className="fa-solid fa-check text-[9px]" style={{ color: BLUE }} />
                  </div>
                  <span className="text-[15px] font-medium" style={{ color: DARK }}>{item}</span>
                </li>
              ))}
            </ul>
          </RevealWrapper>
        </div>
      </div>
    </section>
  )
}

/* ── How it works ────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Crea tu cuenta', desc: 'Regístrate con tu email en menos de 30 segundos. Sin formularios largos.', icon: 'fa-user-plus' },
    { n: '02', title: 'Instala el Atajo', desc: 'Descarga el Atajo de iPhone con un tap. Lo configuras una sola vez.', icon: 'fa-mobile-screen' },
    { n: '03', title: 'Paga y olvídate', desc: 'Cada compra con Apple Pay queda registrada automáticamente en FluxApp Finance.', icon: 'fa-bolt' },
  ]
  return (
    <section style={{ background: WHITE }}>
      <div className="max-w-5xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-16">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>¿Cómo funciona?</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px]" style={{ color: DARK }}>
            Tres pasos.<br />Listo.
          </h2>
        </RevealWrapper>
        <div className="grid sm:grid-cols-3 gap-6 relative">
          <div className="hidden sm:block absolute left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-[2px]"
            style={{ top: 92, background: 'rgba(0,122,255,0.15)' }} />
          {steps.map((s, i) => (
            <RevealWrapper key={i} delay={i * 100}>
              <div className="relative text-center">
                <p className="font-black tabular-nums leading-none mb-3"
                  style={{ fontSize: 48, color: BLUE, letterSpacing: '-1px' }}>{s.n}</p>
                <div className="inline-flex w-16 h-16 rounded-full items-center justify-center mb-5"
                  style={{ background: BLUE, boxShadow: '0 8px 24px rgba(0,122,255,0.3)' }}>
                  <i className={`fa-solid ${s.icon} text-white text-[22px]`} />
                </div>
                <h3 className="text-[20px] font-bold mb-2" style={{ color: DARK }}>{s.title}</h3>
                <p className="text-[15px] font-medium leading-relaxed" style={{ color: GRAY }}>{s.desc}</p>
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing Section ─────────────────────────────────────────────────────── */
function PricingSection() {
  const features = [
    'Todas las funciones incluidas',
    'Atajos de iPhone (Apple Pay)',
    'Gastos compartidos',
    'Presupuestos y reportes',
    'Soporte por chat',
  ]
  return (
    <section style={{ background: LIGHT_GRAY }}>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-14">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Precios</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px]" style={{ color: DARK }}>
            Simple.<br />Sin sorpresas.
          </h2>
          <p className="text-[17px] font-medium mt-4" style={{ color: GRAY }}>
            20 días gratis · Sin tarjeta · Cancela cuando quieras.
          </p>
        </RevealWrapper>
        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          <RevealWrapper delay={80}>
            <div className="rounded-[24px] p-8 h-full flex flex-col"
              style={{ background: WHITE, border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="text-[13px] font-black uppercase tracking-[2px] mb-4" style={{ color: GRAY }}>Mensual</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="font-black leading-none tracking-[-2px]" style={{ fontSize: 52, color: DARK }}>$89</span>
                <div className="flex flex-col mb-2" style={{ gap: 1 }}>
                  <span className="font-black" style={{ fontSize: 10, color: GRAY, letterSpacing: 1 }}>MXN</span>
                  <span className="font-bold" style={{ fontSize: 14, color: GRAY }}>/mes</span>
                </div>
              </div>
              <p className="text-[14px] font-medium mb-6" style={{ color: GRAY }}>Pago mensual, cancela cuando quieras.</p>
              <ul className="space-y-3 mb-8 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,122,255,0.1)' }}>
                      <i className="fa-solid fa-check" style={{ fontSize: 9, color: BLUE }} />
                    </div>
                    <span className="text-[14px] font-medium" style={{ color: DARK }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className="block w-full text-center py-3.5 rounded-[14px] text-[15px] font-bold transition-all hover:opacity-90"
                style={{ background: DARK, color: WHITE }}>
                Comenzar gratis
              </Link>
            </div>
          </RevealWrapper>
          <RevealWrapper delay={160}>
            <div className="rounded-[24px] p-8 h-full flex flex-col relative overflow-hidden"
              style={{ background: 'linear-gradient(140deg, #007AFF 0%, #0056CC 100%)', boxShadow: '0 20px 60px rgba(0,122,255,0.35)' }}>
              <div className="absolute top-5 right-5">
                <div className="px-3 py-1 rounded-full text-[11px] font-black"
                  style={{ background: 'rgba(255,255,255,0.2)', color: WHITE }}>Mejor valor ✦</div>
              </div>
              <p className="text-[13px] font-black uppercase tracking-[2px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Anual</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="font-black leading-none tracking-[-2px] text-white" style={{ fontSize: 52 }}>$829</span>
                <div className="flex flex-col mb-2" style={{ gap: 1 }}>
                  <span className="font-black" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 1 }}>MXN</span>
                  <span className="font-bold" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>/año</span>
                </div>
              </div>
              <p className="font-bold mb-3" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>equivale a $69 MXN/mes</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(255,255,255,0.15)', width: 'fit-content' }}>
                <i className="fa-solid fa-tag text-white" style={{ fontSize: 10 }} />
                <span className="font-black text-white" style={{ fontSize: 12 }}>Ahorra $239 al año</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[...features.slice(0, 4), 'Soporte prioritario por chat'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.2)' }}>
                      <i className="fa-solid fa-check" style={{ fontSize: 9, color: WHITE }} />
                    </div>
                    <span className="text-[14px] font-medium text-white">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login"
                className="block w-full text-center py-3.5 rounded-[14px] text-[15px] font-bold transition-all hover:opacity-90"
                style={{ background: WHITE, color: BLUE }}>
                Comenzar gratis
              </Link>
            </div>
          </RevealWrapper>
        </div>
        <RevealWrapper delay={240}>
          <div className="rounded-[20px] px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.15)' }}>
            <div className="text-[28px] flex-shrink-0">🎁</div>
            <div>
              <p className="text-[15px] font-black mb-1" style={{ color: DARK }}>Oferta para los primeros usuarios</p>
              <p className="text-[14px] font-medium leading-relaxed" style={{ color: GRAY }}>
                Además de los <strong style={{ color: DARK }}>20 días gratis</strong>, los primeros usuarios reciben{' '}
                <strong style={{ color: DARK }}>1 mes adicional sin costo</strong> al ingresar su método de pago. Sin cobros sorpresa.
              </p>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}

/* ── FAQ Section ─────────────────────────────────────────────────────────── */
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  const faqs: { q: string; a: string }[] = [
    {
      q: '¿Funciona en Android?',
      a: 'Sí. FluxApp funciona en cualquier dispositivo con navegador — iPhone, Android o computadora.\n\nLa única función exclusiva de iPhone es el registro automático con Apple Pay a través de Atajos de iPhone. Todo lo demás — movimientos, presupuestos, gastos compartidos y reportes — funciona igual en Android.',
    },
    {
      q: '¿Está en la App Store?',
      a: 'Todavía no. FluxApp Finance es una Progressive Web App (PWA): se instala desde el navegador sin pasar por la App Store ni Google Play.\n\nSin actualizaciones manuales y sin ocupar espacio de almacenamiento — siempre tienes la versión más reciente.',
    },
    {
      q: '¿Tengo que abrir el navegador cada vez que la uso?',
      a: 'No. Instálala en tu pantalla de inicio y se abre directamente como una app nativa — sin barra del navegador, a pantalla completa.\n\niPhone · Safari: toca el botón Compartir → "Agregar a inicio"\nAndroid · Chrome: toca el menú (⋮) → "Añadir a pantalla de inicio"',
    },
    {
      q: '¿Cómo instalo el Atajo de iPhone?',
      a: 'Más fácil de lo que suena:\n\n1. Abre FluxApp → Ajustes → "Atajos de iPhone"\n2. Copia tu token personal\n3. Descarga el Atajo desde el enlace de iCloud que aparece ahí\n\nSe configura una sola vez y se activa automáticamente cada vez que pagas con Apple Pay.',
    },
    {
      q: '¿Cómo cancelo mi suscripción?',
      a: 'Puedes cancelar en cualquier momento directamente desde la misma app: ve a Ajustes → Suscripción. Se abre el portal de Stripe donde puedes gestionar o cancelar tu plan.\n\nTambién puedes escribirnos a hola@fluxappfinance.com. Sin contratos ni permanencia mínima — tu acceso continúa hasta el final del periodo pagado.',
    },
    {
      q: '¿Mis datos financieros están seguros?',
      a: 'Sí. Tus datos se almacenan con cifrado en reposo y en tránsito. FluxApp nunca tiene acceso a tus cuentas bancarias ni comparte tu información con terceros — solo registras lo que tú decides registrar.',
    },
  ]

  return (
    <section style={{ background: WHITE }}>
      <div className="max-w-3xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-14">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>FAQ</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px]" style={{ color: DARK }}>
            Preguntas<br />frecuentes.
          </h2>
        </RevealWrapper>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <RevealWrapper key={i} delay={i * 40}>
              <div
                className="rounded-[18px] overflow-hidden transition-all"
                style={{
                  background: LIGHT_GRAY,
                  border: `1px solid ${open === i ? 'rgba(0,122,255,0.25)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: open === i ? '0 4px 20px rgba(0,122,255,0.08)' : 'none',
                }}
              >
                <button
                  className="w-full text-left flex items-center justify-between gap-4 px-6 py-5"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="text-[16px] font-bold" style={{ color: DARK }}>{faq.q}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: open === i ? 'rgba(0,122,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                    <i className={`fa-solid fa-chevron-${open === i ? 'up' : 'down'} text-[11px]`}
                      style={{ color: open === i ? BLUE : GRAY }} />
                  </div>
                </button>
                {open === i && (
                  <div className="px-6 pb-5">
                    <p className="text-[15px] font-medium leading-relaxed" style={{ color: GRAY, whiteSpace: 'pre-line' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{ background: LIGHT_GRAY }}>
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <RevealWrapper>
          <div className="rounded-[28px] px-8 py-14 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)', boxShadow: '0 24px 64px rgba(0,122,255,0.4)' }}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="relative">
              <p className="text-[12px] font-black uppercase tracking-[4px] mb-4 text-white/60">Comienza hoy</p>
              <h2 className="text-[36px] sm:text-[48px] font-black leading-[1.06] tracking-[-1.5px] text-white mb-4">
                20 días gratis.<br />Sin tarjeta.
              </h2>
              <p className="text-[17px] font-medium text-white/70 mb-8 max-w-md mx-auto">
                Únete y descubre por qué controlar tu dinero puede ser simple.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-[14px] text-[17px] font-bold transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ background: WHITE, color: BLUE, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
              >
                Crear cuenta gratis
                <i className="fa-solid fa-arrow-right text-[15px]" />
              </Link>
            </div>
          </div>
        </RevealWrapper>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: DARK }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[22px] font-black tracking-tight" style={{ color: BLUE }}>fluxapp finance</span>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Finanzas personales</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/guia" className="text-[14px] font-semibold transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Guía
            </Link>
            <Link href="/terminos" className="text-[14px] font-semibold transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Términos
            </Link>
            <Link href="/privacidad" className="text-[14px] font-semibold transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Privacidad
            </Link>
            <a
              href="https://www.instagram.com/fluxapp.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-semibold transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <i className="fa-brands fa-instagram mr-1" />
              Instagram
            </a>
          </div>
        </div>
        <div className="mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2026 Flux App Finance · Todos los derechos reservados
          </p>
          <p className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Hecho en México 🇲🇽
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{ background: WHITE, color: DARK, fontFamily: 'var(--font-geist-sans)', overflowX: 'hidden' }}>
      <Navbar scrolled={scrolled} isAuthenticated={isAuthenticated} />
      <Hero />
      <PainSection />
      <AppShowcaseSection />
      <TrustBar />
      <ApplePaySection />
      <FeaturesSection />
      <SharedSection />
      <HowItWorks />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
