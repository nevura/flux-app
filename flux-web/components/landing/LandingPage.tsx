'use client'

import { useState, useEffect } from 'react'
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
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

/* ── iPhone Mockup ───────────────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 240, height: 520 }}>
      {/* Phone frame */}
      <div
        className="absolute inset-0 rounded-[50px]"
        style={{
          background: '#0F172A',
          boxShadow: '0 48px 96px rgba(0,0,0,0.30), 0 0 0 1.5px rgba(255,255,255,0.10) inset',
        }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[72px] h-[24px] rounded-full z-10" style={{ background: '#000' }} />

        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[48px] overflow-hidden" style={{ background: '#020617' }}>

          {/* Header — matches real DashboardClient layout */}
          <div className="px-4 pt-12 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)' }}>
                <i className="fa-solid fa-bars text-white text-[10px]" />
              </div>
              <div>
                <p className="text-[7px] font-black uppercase tracking-[2px] leading-none" style={{ color: 'rgba(255,255,255,0.35)' }}>JUNIO 2026</p>
                <p className="text-[14px] font-black text-white leading-tight">Hola, Bernardo</p>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <i className="fa-regular fa-bell text-white text-[11px]" />
            </div>
          </div>

          {/* Balance card */}
          <div className="mx-3 mb-2.5 rounded-[20px] p-4" style={{ background: '#007AFF', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}>
            <p className="text-[7px] font-black uppercase tracking-[2px] mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>SALDO ACTUAL</p>
            <p className="text-[26px] font-black text-white leading-none tabular-nums">$8,240.50</p>
          </div>

          {/* Budget section */}
          <div className="mx-3 mb-2.5 rounded-[14px] p-3"
            style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[7px] font-black uppercase tracking-[2px]" style={{ color: 'rgba(255,255,255,0.40)' }}>PRESUPUESTO</p>
              <i className="fa-solid fa-pen text-[7px]" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <p className="text-[15px] font-black text-white tabular-nums leading-none">$6,420.00</p>
            <p className="text-[7px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>de $10,000.00 · te quedan $3,580</p>
            <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full" style={{ width: '64%', background: '#30D158' }} />
            </div>
          </div>

          {/* Hoy/Semana — flush header, no padding gaps */}
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
                <p className="text-[20px] font-black text-white tabular-nums">$1,240.00</p>
                <i className="fa-solid fa-chevron-right text-[7px]" style={{ color: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </div>

          {/* Bottom nav */}
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
      {/* Subtle gradient blob */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.07) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,122,255,0.04) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold mb-6"
              style={{ background: 'rgba(0,122,255,0.08)', color: BLUE, border: '1px solid rgba(0,122,255,0.2)' }}
            >
              <i className="fa-brands fa-apple text-[12px]" />
              Integrado con Apple Pay
            </div>

            <h1
              className="text-[38px] sm:text-[58px] lg:text-[64px] font-black leading-[1.05] tracking-[-2px] mb-6"
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
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[14px] text-[17px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: LIGHT_GRAY, color: DARK }}
              >
                <i className="fa-brands fa-instagram text-[17px]" />
                Ver en Instagram
              </a>
            </div>

            <p className="text-[13px] font-semibold mt-5" style={{ color: 'rgba(0,0,0,0.35)' }}>
              Gratis durante 20 días · Sin tarjeta de crédito
            </p>
          </div>

          {/* Right — phone mockup */}
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
      {/* Subtle glow */}
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
                Flux registra: -$89 · OXXO · Automático ✓
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
    {
      icon: 'fa-chart-line',
      title: 'Dashboard inteligente',
      desc: 'Visualiza ingresos, gastos y saldo en tiempo real. Gráficas mensuales y resumen instantáneo de tu situación financiera.',
      color: '#007AFF',
    },
    {
      icon: 'fa-users',
      title: 'Gastos compartidos',
      desc: 'Divide cuentas, rastrea deudas y cobra a tus amigos desde la app. Todo en tiempo real, sin calculadoras.',
      color: '#30D158',
    },
    {
      icon: 'fa-bullseye',
      title: 'Presupuestos',
      desc: 'Define cuánto quieres gastar por categoría. Flux te avisa cuando te acercas al límite.',
      color: '#FF9500',
    },
    {
      icon: 'fa-wallet',
      title: 'Multi-cuenta',
      desc: 'Maneja efectivo, tarjeta de débito y crédito en un solo lugar. Saldos actualizados al instante.',
      color: '#5E5CE6',
    },
  ]

  return (
    <section style={{ background: WHITE }}>
      <div className="max-w-6xl mx-auto px-6 py-24">
        <RevealWrapper className="text-center mb-16">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>
            Funcionalidades
          </p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px]" style={{ color: DARK }}>
            Todo lo que necesitas,<br />nada que no.
          </h2>
        </RevealWrapper>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <RevealWrapper key={i} delay={i * 70}>
              <div
                className="rounded-[20px] p-6 h-full transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{
                  background: LIGHT_GRAY,
                  border: '1px solid rgba(0,0,0,0.05)',
                  transitionDuration: '0.3s',
                }}
              >
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4"
                  style={{ background: `${f.color}18` }}
                >
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
          {/* Left — visual */}
          <RevealWrapper direction="left">
            <div className="rounded-[24px] p-6 max-w-sm mx-auto lg:mx-0" style={{ background: '#1D1D1F' }}>
              <p className="text-[11px] font-black uppercase tracking-[3px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Compartidos</p>

              {/* Balance strip */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-[14px] px-4 py-3" style={{ background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.2)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[2px] mb-1" style={{ color: '#30D158' }}>Me deben</p>
                  <p className="text-[20px] font-black text-white tabular-nums">+$480</p>
                </div>
                <div className="rounded-[14px] px-4 py-3" style={{ background: 'rgba(255,69,58,0.12)', border: '1px solid rgba(255,69,58,0.2)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[2px] mb-1" style={{ color: '#FF453A' }}>Debo</p>
                  <p className="text-[20px] font-black text-white tabular-nums">-$120</p>
                </div>
              </div>

              {/* People list */}
              {[
                { name: 'Fernando', handle: '@fernando_garza', amt: '+$280', color: '#30D158', icon: 'F' },
                { name: 'Santiago', handle: '@santi_mtz', amt: '+$200', color: '#30D158', icon: 'S' },
                { name: 'Raúl', handle: '@raul.lopez', amt: '-$120', color: '#FF453A', icon: 'R' },
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

          {/* Right — text */}
          <RevealWrapper direction="right">
            <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Gastos compartidos</p>
            <h2 className="text-[38px] sm:text-[48px] font-black leading-[1.06] tracking-[-1.5px] mb-6" style={{ color: DARK }}>
              Divide sin<br />discusiones.
            </h2>
            <p className="text-[17px] font-medium leading-relaxed mb-6" style={{ color: GRAY }}>
              Agrega a tus amigos en Flux y divide cualquier gasto en segundos. Cada quien ve lo que debe, el sistema rastrea los pagos y te notifica cuando liquidan.
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
          {/* Connector line — aligned with icon circle centers (badge 40px + gap 16px + half icon 32px = 88px) */}
          <div className="hidden sm:block absolute left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-[2px]"
            style={{ top: 88, background: 'rgba(0,122,255,0.15)' }} />

          {steps.map((s, i) => (
            <RevealWrapper key={i} delay={i * 100}>
              <div className="relative text-center">
                {/* Step number — prominent square badge */}
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center mb-4 mx-auto font-black text-[15px] tabular-nums"
                  style={{ background: BLUE, color: WHITE, boxShadow: '0 4px 12px rgba(0,122,255,0.35)', letterSpacing: '0.5px' }}
                >
                  {s.n}
                </div>
                {/* Icon circle */}
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

/* ── CTA ─────────────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{ background: LIGHT_GRAY }}>
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <RevealWrapper>
          <div className="rounded-[28px] px-8 py-14 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #007AFF 0%, #0056CC 100%)',
              boxShadow: '0 24px 64px rgba(0,122,255,0.4)',
            }}
          >
            {/* Decorative circles */}
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
              href="https://www.instagram.com"
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
      <TrustBar />
      <ApplePaySection />
      <FeaturesSection />
      <SharedSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  )
}
