'use client'

import { useState, useEffect, Fragment } from 'react'
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
            <div style={{ animation: 'heroFloat 6s ease-in-out infinite', display: 'inline-block', width: '100%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/inicio-section.png"
                alt="FluxApp Finance dashboard"
                style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.12))' }}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: scale(1.5) translateY(0px); }
          50% { transform: scale(1.5) translateY(-8px); }
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

/* ── App Showcase Section ────────────────────────────────────────────────── */
function AppShowcaseSection() {
  return (
    <section style={{ background: '#000', overflow: 'hidden' }}>
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-0">
        <RevealWrapper className="text-center mb-6">
          <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>La app</p>
          <h2 className="text-[40px] sm:text-[52px] font-black leading-[1.06] tracking-[-1.5px] text-white">
            Diseñada para vivir<br />en tu bolsillo.
          </h2>
          <p className="text-[17px] font-medium mt-4 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Dashboard, cuentas, analítica y gastos compartidos — todo en una app que cabe en tu pantalla de inicio.
          </p>
        </RevealWrapper>
      </div>
      <RevealWrapper>
        <div style={{ overflow: 'hidden' }}>
          {/* width:150% + marginLeft centra el 150% en el viewport — igual que scale(1.5) pero el layout crece con la imagen */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/carrusel-section.png"
            alt="FluxApp Finance — pantallas de la app"
            style={{ width: '150%', marginLeft: 'calc(-25% + 30px)', display: 'block' }}
          />
        </div>
      </RevealWrapper>
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
        style={{ background: 'radial-gradient(ellipse 60% 60% at 80% 50%, rgba(0,122,255,0.10) 0%, transparent 70%)' }} />

      <div className="max-w-6xl mx-auto px-6 py-24 relative">
        <div className="grid lg:grid-cols-2 gap-x-16 gap-y-6 items-center">
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
            <RevealWrapper delay={320} className="flex sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/applepay-not.png"
                alt="Notificación Flux Apple Pay"
                className="rounded-[18px] mx-auto sm:mx-0"
                style={{ maxWidth: 320, width: '100%', display: 'block', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
            </RevealWrapper>
          </div>

          <RevealWrapper direction="right" delay={160} className="flex justify-center lg:justify-end">
            <div style={{ animation: 'appleFloat 5s ease-in-out infinite', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/applepay-section.png"
                alt="Apple Pay en FluxApp Finance"
                style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.5))' }}
              />
            </div>
          </RevealWrapper>
        </div>

        {/* ── "Así de fácil" step flow ───────────────────────── */}
        <RevealWrapper delay={200} className="mt-20">
          <p className="text-center font-black text-white mb-10" style={{ fontSize: 22, letterSpacing: -0.5 }}>
            Así de fácil funciona FluxApp Finance
          </p>
          <div className="flex flex-row items-start">
            {[
              { icon: 'fa-mobile-screen', label: 'Pagas con Apple Pay' },
              { icon: 'fa-bolt', label: 'Flux detecta el movimiento' },
              { icon: 'fa-receipt', label: 'El gasto se registra' },
              { icon: 'fa-chart-bar', label: 'Tu presupuesto se actualiza' },
            ].map((step, i, arr) => (
              <Fragment key={i}>
                <div className="flex flex-col items-center" style={{ flex: 1, minWidth: 0 }}>
                  <div className="rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ width: 54, height: 54, border: '1.5px solid rgba(0,122,255,0.5)', background: 'rgba(0,122,255,0.12)' }}>
                    <i className={`fa-solid ${step.icon}`} style={{ fontSize: 20, color: '#007AFF' }} />
                  </div>
                  <p className="mt-3 text-center font-semibold leading-snug px-1"
                    style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                    {step.label}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex items-start flex-shrink-0" style={{ paddingTop: 16 }}>
                    <i className="fa-solid fa-arrow-right" style={{ fontSize: 16, color: '#007AFF', opacity: 0.7 }} />
                  </div>
                )}
              </Fragment>
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
    { icon: 'fa-bullseye', title: 'Presupuestos', desc: 'Define cuánto quieres gastar al mes. Flux te avisa cuando te acercas al límite.', color: '#FF9500' },
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
          <RevealWrapper direction="left" className="flex justify-center lg:justify-start">
            <div style={{ width: '100%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/compartidos-section.png"
                alt="Gastos compartidos en FluxApp Finance"
                style={{ width: '100%', display: 'block', transform: 'scale(1.5)', transformOrigin: '40% center' }}
              />
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
      q: '¿Necesito conexión a internet para usar FluxApp?',
      a: 'Sí. FluxApp requiere conexión a internet tanto para usar la app como para que los Atajos de iPhone funcionen.\n\nLa app sincroniza tus datos en tiempo real desde la nube, por lo que sin conexión no podrás registrar ni consultar movimientos. Los Atajos de Apple Pay también necesitan internet para enviar el registro a tu cuenta en el momento del pago.',
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
