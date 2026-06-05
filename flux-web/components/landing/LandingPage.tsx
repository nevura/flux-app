'use client'

import { useState, useEffect, type ReactNode } from 'react'
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

            <p className="text-[13px] font-semibold mt-5" style={{ color: 'rgba(0,0,0,0.35)' }}>
              Gratis durante 20 días · Sin tarjeta de crédito
            </p>
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
    '¿En qué se fue el dinero este mes?',
    'Revisas el banco dos días después de gastar',
    'La hoja de cálculo lleva semanas sin actualizar',
    'Fin de mes: ni idea de qué pasó con tu sueldo',
  ]
  const after = [
    'Cada gasto registrado al instante, sin abrir ninguna app',
    'Presupuesto siempre actualizado en tiempo real',
    'Sabes exactamente lo que debes y te deben',
    'Fin de mes: ya sabías lo que iba a pasar',
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
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,69,58,0.1)' }}>
                  <i className="fa-solid fa-xmark" style={{ color: '#FF453A', fontSize: 13 }} />
                </div>
                <p className="text-[15px] font-black" style={{ color: DARK }}>Sin FluxApp</p>
              </div>
              <ul className="space-y-3.5">
                {before.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[17px] mt-0.5 flex-shrink-0">😩</span>
                    <span className="text-[15px] font-medium leading-snug" style={{ color: GRAY }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </RevealWrapper>

          <RevealWrapper direction="right" delay={160}>
            <div className="rounded-[24px] p-7 h-full" style={{ background: '#F0FFF4', border: '1px solid rgba(48,209,88,0.2)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(48,209,88,0.15)' }}>
                  <i className="fa-solid fa-check" style={{ color: '#30D158', fontSize: 13 }} />
                </div>
                <p className="text-[15px] font-black" style={{ color: DARK }}>Con FluxApp Finance</p>
              </div>
              <ul className="space-y-3.5">
                {after.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[17px] mt-0.5 flex-shrink-0">✅</span>
                    <span className="text-[15px] font-medium leading-snug" style={{ color: '#1A4731' }}>{item}</span>
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

/* ── Showcase phone frame ────────────────────────────────────────────────── */
function PhoneFrame({ children, glow = false }: { children: ReactNode; glow?: boolean }) {
  return (
    <div className="relative mx-auto flex-shrink-0" style={{ width: 216, height: 468 }}>
      <div
        className="absolute inset-0 rounded-[46px]"
        style={{
          background: '#0A0A0A',
          boxShadow: glow
            ? '0 40px 80px rgba(0,0,0,0.50), 0 0 0 1.5px rgba(255,255,255,0.12) inset, 0 0 80px rgba(0,122,255,0.18)'
            : '0 24px 50px rgba(0,0,0,0.35), 0 0 0 1.5px rgba(255,255,255,0.07) inset',
        }}
      >
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[60px] h-[20px] rounded-full z-10" style={{ background: '#000' }} />
        <div className="absolute inset-[3px] rounded-[43px] overflow-hidden" style={{ background: '#020617' }}>
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

      <div className="flex items-center gap-1.5 mx-3 mb-2">
        {['Tipo', 'Categoría'].map(f => (
          <div key={f} className="flex items-center gap-1 rounded-[8px] px-2 py-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-semibold text-white" style={{ fontSize: 7 }}>{f}</p>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: 5, color: 'rgba(255,255,255,0.4)' }} />
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
          { name: 'Netflix', date: 'Mié, 10', amt: '-$209', bg: '#E50914' },
          { name: 'Spotify', date: 'Vie, 12', amt: '-$89', bg: '#1ED760' },
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
              style={{
                background: p.positive ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)',
                color: p.positive ? '#30D158' : '#FF453A',
                fontSize: 10,
              }}>
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

/* ── App Showcase Section ────────────────────────────────────────────────── */
function AppShowcaseSection() {
  return (
    <section style={{ background: DARK, overflow: 'hidden' }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-16">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>La app</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px] text-white">
            Diseñada para vivir<br />en tu bolsillo.
          </h2>
          <p className="text-[17px] font-medium mt-4 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Dashboard, movimientos, reportes y gastos compartidos — todo en una app que cabe en tu pantalla de inicio.
          </p>
        </RevealWrapper>

        <RevealWrapper>
          <div className="flex items-end justify-center gap-5 lg:gap-8">
            <div className="hidden sm:block flex-shrink-0" style={{ opacity: 0.6, transform: 'translateY(44px)' }}>
              <div style={{ transform: 'scale(0.88)', transformOrigin: 'bottom center' }}>
                <PhoneTransactions />
              </div>
            </div>
            <PhoneDashboard />
            <div className="hidden sm:block flex-shrink-0" style={{ opacity: 0.6, transform: 'translateY(44px)' }}>
              <div style={{ transform: 'scale(0.88)', transformOrigin: 'bottom center' }}>
                <PhoneShared />
              </div>
            </div>
          </div>
        </RevealWrapper>

        <RevealWrapper delay={200} className="flex flex-wrap justify-center gap-3 mt-14">
          {[
            'Dashboard · Saldo en tiempo real',
            'Movimientos por categoría',
            'Gastos compartidos',
            'Presupuestos mensuales',
            'Recurrentes automáticos',
            'Reportes de tendencia',
          ].map((label, i) => (
            <span key={i}
              className="text-[13px] font-semibold px-4 py-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              {label}
            </span>
          ))}
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

/* ── Apple Pay section ───────────────────────────────────────────────────── */
function ApplePaySection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#000' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,122,255,0.12) 0%, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto px-6 py-24 text-center relative">
        <RevealWrapper>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] mb-6"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <i className="fa-brands fa-apple text-white text-[32px]" />
          </div>
        </RevealWrapper>

        <RevealWrapper delay={80}>
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Apple Pay · iPhone Shortcuts
          </p>
        </RevealWrapper>

        <RevealWrapper delay={160}>
          <h2 className="text-[42px] sm:text-[58px] font-black leading-[1.05] tracking-[-1.5px] text-white mb-6">
            Cada compra,<br />registrada sola.
          </h2>
        </RevealWrapper>

        <RevealWrapper delay={240}>
          <p className="text-[18px] font-medium leading-relaxed max-w-xl mx-auto mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Nunca más olvides registrar un gasto. FluxApp Finance se conecta con Atajos de iPhone y captura cada pago con Apple Pay en el momento exacto en que lo haces — sin abrir ninguna app.
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
                FluxApp registra: -$89 · OXXO · Automático ✓
              </p>
            </div>
          </div>
        </RevealWrapper>
      </div>
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
          {/* Monthly */}
          <RevealWrapper delay={80}>
            <div className="rounded-[24px] p-8 h-full flex flex-col"
              style={{ background: WHITE, border: '1px solid rgba(0,0,0,0.07)' }}>
              <p className="text-[13px] font-black uppercase tracking-[2px] mb-4" style={{ color: GRAY }}>Mensual</p>
              <div className="flex items-end gap-1.5 mb-2">
                <span className="font-black leading-none tracking-[-2px]" style={{ fontSize: 52, color: DARK }}>$89</span>
                <span className="font-bold mb-2" style={{ fontSize: 16, color: GRAY }}>/mes</span>
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

          {/* Annual */}
          <RevealWrapper delay={160}>
            <div className="rounded-[24px] p-8 h-full flex flex-col relative overflow-hidden"
              style={{ background: 'linear-gradient(140deg, #007AFF 0%, #0056CC 100%)', boxShadow: '0 20px 60px rgba(0,122,255,0.35)' }}>
              <div className="absolute top-5 right-5">
                <div className="px-3 py-1 rounded-full text-[11px] font-black"
                  style={{ background: 'rgba(255,255,255,0.2)', color: WHITE }}>
                  Mejor valor ✦
                </div>
              </div>
              <p className="text-[13px] font-black uppercase tracking-[2px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Anual</p>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="font-black leading-none tracking-[-2px] text-white" style={{ fontSize: 52 }}>$829</span>
                <span className="font-bold mb-2" style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>/año</span>
              </div>
              <p className="font-bold mb-3" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>equivale a $69/mes</p>
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

        {/* Early adopter banner */}
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

  const faqs = [
    {
      q: '¿Funciona en Android?',
      a: 'Sí. FluxApp Finance funciona en Android. La única función exclusiva de iPhone es el registro automático con Apple Pay a través de Atajos. El resto de la app — movimientos, presupuestos, gastos compartidos y reportes — funciona igual en cualquier dispositivo.',
    },
    {
      q: '¿Está en la App Store?',
      a: 'Todavía no. FluxApp Finance es una Progressive Web App (PWA): se instala directamente desde el navegador sin pasar por la App Store. Sin actualizaciones manuales, sin ocupar espacio de almacenamiento.',
    },
    {
      q: '¿Tengo que abrir Safari cada vez que la uso?',
      a: 'No. Al agregarla a tu pantalla de inicio se abre como una app nativa — sin barra de Safari, a pantalla completa. En iPhone: Safari → botón Compartir → "Agregar a inicio". En Android: Chrome → menú (3 puntos) → "Añadir a pantalla de inicio".',
    },
    {
      q: '¿Cómo instalo el Atajo de iPhone?',
      a: 'Entra a Ajustes en FluxApp → toca "Atajos de iPhone" → copia tu token personal y descarga el Atajo desde el enlace de iCloud que aparece ahí. Se configura una sola vez y funciona automáticamente cada vez que pagas con Apple Pay.',
    },
    {
      q: '¿Cómo cancelo mi suscripción?',
      a: 'Cancela cuando quieras escribiéndonos a hola@fluxappfinance.com. Sin contratos, sin periodos de permanencia. Tu acceso continúa hasta el final del periodo pagado.',
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
                    <p className="text-[15px] font-medium leading-relaxed" style={{ color: GRAY }}>{faq.a}</p>
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
