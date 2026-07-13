'use client'

import { useState } from 'react'
import { RevealWrapper } from './RevealWrapper'

const BLUE = '#007AFF'
const DARK = '#1D1D1F'
const GRAY = '#6E6E73'
const LIGHT_GRAY = '#F5F5F7'

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

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section style={{ background: '#FFFFFF' }}>
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
