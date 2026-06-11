'use client'

import { useState } from 'react'

const BLUE = '#007AFF'
const GRAY = '#6E6E73'
const DARK = '#1D1D1F'
const LIGHT = '#F5F5F7'
const ORANGE = '#FF9500'

// ── 9:16 video placeholder (phone screen recording) ─────────────────────────
function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div
      className="rounded-[18px] overflow-hidden flex-shrink-0"
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', width: 200 }}
    >
      {/* 9:16 aspect ratio */}
      <div style={{ position: 'relative', paddingTop: '177.78%' }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: '0 16px',
        }}>
          <div style={{
            width: 52, height: 52, flexShrink: 0,
            background: 'rgba(0,122,255,0.9)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-play text-white text-[18px]" style={{ marginLeft: 4 }} />
          </div>
          <p className="text-[12px] font-bold text-center leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {title}
          </p>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-center"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }}>
            Próximamente
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Data ─────────────────────────────────────────────────────────────────────
type Step = { icon: string; title: string; desc: string; tip?: string }
type Section = {
  title: string
  videos: string[]
  steps: Step[]
}

const tabs = [
  { id: 'atajos',       label: 'Atajos',        icon: 'fa-bolt' },
  { id: 'cuentas',      label: 'Cuentas',        icon: 'fa-credit-card' },
  { id: 'compartidos',  label: 'Compartidos',    icon: 'fa-users' },
  { id: 'planificacion',label: 'Planificación',  icon: 'fa-rotate' },
  { id: 'estadisticas', label: 'Estadísticas',   icon: 'fa-chart-line' },
  { id: 'soporte',      label: 'Cuenta y soporte', icon: 'fa-headset' },
]

const sections: Record<string, Section> = {
  atajos: {
    title: 'Atajos de iPhone',
    videos: [
      'Cómo instalar el Atajo',
      'Cómo usar el Atajo de Apple Pay',
      'Cómo usar el Atajo de Registro Rápido',
    ],
    steps: [
      { icon: 'fa-mobile-screen', title: 'Requisitos', desc: 'Necesitas un iPhone con iOS 16 o superior. Los Atajos usan la app nativa de Apple (pre-instalada en todo iPhone).' },
      { icon: 'fa-download', title: 'Instala el Atajo Apple Pay', desc: 'Ve a Configuración → Atajos y toca "Instalar Atajo Apple Pay". Se abre la app de Atajos. Acepta la instalación, ingresa tu token de seguridad y el nombre de tu tarjeta.', tip: '⚠️ El nombre de la cuenta en Flux debe ser IDÉNTICO al nombre de la tarjeta en Ajustes → Wallet y Apple Pay. Hasta el acento importa.' },
      { icon: 'fa-bolt', title: 'Atajo Apple Pay', desc: 'Cada vez que pagas con Apple Pay, el Atajo detecta el monto y el comercio, y lo registra en Flux automáticamente como "Por confirmar".' },
      { icon: 'fa-keyboard', title: 'Atajo de Registro Rápido', desc: 'Ve a Configuración → Atajos y toca "Instalar Atajo Registro Rápido". Úsalo con Siri o desde la app de Atajos para registrar un gasto en segundos, sin abrir Flux.' },
      { icon: 'fa-circle-check', title: 'Confirma los gastos', desc: 'Los gastos de Atajos aparecen como "Por confirmar" en Movimientos. Toca ✓ para validarlos — o desliza la tarjeta en la lista.' },
    ],
  },

  cuentas: {
    title: 'Cuentas',
    videos: [
      'Cómo agregar una cuenta',
      'Cómo hacer una auditoría de saldo',
      'Cómo pagar la tarjeta de crédito desde inicio',
    ],
    steps: [
      { icon: 'fa-plus', title: 'Agregar una cuenta', desc: 'Ve a Configuración → Cuentas y toca "Nueva cuenta". Elige el tipo (Efectivo, Débito o Crédito), el nombre, color e ícono. Establece el saldo inicial.' },
      { icon: 'fa-credit-card', title: 'Tipos de cuenta', desc: 'Efectivo: dinero en mano. Débito (TDD): tu saldo bancario real. Crédito (TDC): dinero prestado — resta de tu saldo total para que siempre veas lo que realmente tienes.' },
      { icon: 'fa-scale-balanced', title: 'Auditoría de saldo', desc: 'Si el saldo en Flux no coincide con tu banco, toca el ícono de balanza en la cuenta. Ingresa el saldo real y Flux genera un ajuste automático para cuadrar la diferencia.', tip: 'Haz una auditoría mensual para mantener tus números precisos.' },
      { icon: 'fa-calendar-check', title: 'Pago de TDC desde inicio', desc: 'Si configuraste la fecha de corte de tu TDC, Flux muestra un recordatorio en el Dashboard. Toca "Registrar pago" para mover el monto de tu cuenta débito a la TDC y limpiar la deuda.' },
    ],
  },

  compartidos: {
    title: 'Gastos compartidos',
    videos: [
      'Cómo agregar un amigo',
      'Cómo vincular un contacto a un amigo de Flux',
      'Cómo registrar un gasto compartido y sus variantes',
      'Cómo registrar un ingreso compartido (por cobrar)',
    ],
    steps: [
      { icon: 'fa-user-plus', title: 'Agrega amigos', desc: 'Ve a Compartidos → ícono de personas y busca por @username. Envía la solicitud — cuando la acepten quedan vinculados y pueden recibir notificaciones automáticas.' },
      { icon: 'fa-link', title: 'Vincula contactos', desc: 'En Configuración → Personas, toca el ícono de vínculo junto a un contacto y conéctalo con un amigo aceptado en Flux. Así los gastos compartidos les llegan directo.' },
      { icon: 'fa-receipt', title: 'Registra un gasto compartido', desc: 'Al crear un gasto, activa "Compartir gasto". Elige personas y montos. Modos: "Tú pagaste (THEY)" = ellos te deben; "Lo pagó otra persona (IOWE)" = tú le debes.' },
      { icon: 'fa-hand-holding-dollar', title: 'Ingreso compartido (por cobrar)', desc: 'Al crear un ingreso, activa "Ingreso futuro / pendiente de cobro". El monto no entra a tu cuenta hasta que marques el cobro — perfecto para honorarios, rentas o préstamos que aún no recibes.' },
      { icon: 'fa-coins', title: 'Liquida deudas', desc: 'En Compartidos, abre a una persona y usa "Saldar todo" o "Abonar" para registrar pagos parciales. Flux crea los movimientos automáticamente en la cuenta que elijas.' },
    ],
  },

  planificacion: {
    title: 'Planificación',
    videos: [
      'Cómo agregar un gasto o ingreso recurrente',
      'Cómo asignar un presupuesto fijo y personalizar por mes',
    ],
    steps: [
      { icon: 'fa-rotate', title: '¿Qué son los recurrentes?', desc: 'Gastos o ingresos que se repiten: streaming, renta, nómina, servicios. Flux los genera automáticamente en la fecha que configures y los marca como "Por confirmar".' },
      { icon: 'fa-calendar-plus', title: 'Crear un recurrente', desc: 'Ve a Configuración → Planificados y toca "Nuevo". Define nombre, monto, categoría, cuenta y frecuencia (diaria, semanal, mensual o anual). Establece la próxima fecha.' },
      { icon: 'fa-bullseye', title: 'Presupuesto fijo mensual', desc: 'Ve a Configuración → Presupuesto y define cuánto quieres gastar al mes. Este límite aplica a todos los meses y aparece como barra de progreso en el Dashboard.' },
      { icon: 'fa-sliders', title: 'Personalizar por mes', desc: 'En el Dashboard, toca el ícono de lápiz junto al presupuesto para ajustar el monto solo para ese mes — sin cambiar el valor predeterminado.' },
      { icon: 'fa-triangle-exclamation', title: 'Alertas de presupuesto', desc: 'Flux te notifica cuando llegas al 80% de tu límite mensual para que puedas ajustar tus gastos antes de excederlo.' },
    ],
  },

  estadisticas: {
    title: 'Estadísticas y gráficas',
    videos: [
      'Cómo interpretar las gráficas y estadísticas',
    ],
    steps: [
      { icon: 'fa-chart-line', title: 'Gráfica de tendencia', desc: 'La línea azul muestra cómo evoluciona tu saldo día a día. La línea naranja es tu ritmo ideal de gasto según el presupuesto. Si la azul baja más rápido que la naranja, vas gastando de más.' },
      { icon: 'fa-chart-pie', title: 'Desglose por categoría', desc: 'Las barras en Estadísticas muestran cuánto gastaste en cada categoría este mes. Toca una categoría para ver los movimientos individuales.' },
      { icon: 'fa-calendar-days', title: 'Comparación mensual', desc: 'Navega entre meses con las flechas para comparar tus gastos históricos. Útil para ver si estás mejorando o empeoranfo tus hábitos financieros.' },
      { icon: 'fa-arrow-trend-up', title: 'Ingresos vs gastos', desc: 'El resumen mensual muestra tu balance: total de ingresos, total de gastos, y el neto. Un neto positivo significa que ahorraste ese mes.' },
    ],
  },

  soporte: {
    title: 'Cuenta y soporte',
    videos: [
      'Cómo contactar a soporte',
      'Cómo gestionar tu suscripción',
    ],
    steps: [
      { icon: 'fa-comment-dots', title: 'Contactar soporte', desc: 'Ve a Configuración → Soporte y escribe tu mensaje. El equipo de Flux recibe una notificación y te responde directamente en la app. También puedes escribir a hola@fluxappfinance.com.' },
      { icon: 'fa-star', title: 'Gestionar tu suscripción', desc: 'Ve a Configuración → Plan y suscripción. Desde ahí puedes ver tu fecha de vencimiento, suscribirte a Flux Pro o gestionar (cancelar, actualizar) tu suscripción actual.' },
      { icon: 'fa-clock', title: 'Período de prueba', desc: 'Flux incluye 20 días de prueba gratuita con acceso completo. Al vencerse, si no tienes suscripción activa, la app pasa a modo de solo lectura — tus datos se conservan.' },
      { icon: 'fa-rotate-left', title: 'Al cancelar', desc: 'Si cancelas, conservas acceso hasta el final del período pagado. Tus datos nunca se borran — puedes reactivar en cualquier momento.' },
    ],
  },
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GuiaPage() {
  const [active, setActive] = useState('atajos')
  const section = sections[active]

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Documentación</p>
      <h1 className="text-[40px] font-black tracking-[-1px] mb-2" style={{ color: DARK }}>Guía de FluxApp Finance</h1>
      <p className="text-[16px] font-medium mb-10" style={{ color: GRAY }}>Todo lo que necesitas saber para sacar el máximo provecho.</p>

      {/* Tabs */}
      <div className="-mx-6 px-6 mb-10">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[14px] font-bold transition-all flex-shrink-0"
              style={active === t.id
                ? { background: BLUE, color: '#fff' }
                : { background: LIGHT, color: GRAY, border: '1px solid rgba(0,0,0,0.08)' }
              }
            >
              <i className={`fa-solid ${t.icon} text-[13px]`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div key={active}>
        <h2 className="text-[28px] font-black mb-6" style={{ color: DARK }}>{section.title}</h2>

        {/* Video placeholders — 9:16 phone recordings, horizontal scroll row */}
        {section.videos.length > 0 && (
          <div className="mb-10">
            <p className="text-[11px] font-black uppercase tracking-[3px] mb-4" style={{ color: GRAY }}>
              <i className="fa-solid fa-video mr-2" />
              {section.videos.length === 1 ? 'Video tutorial' : `${section.videos.length} videos tutoriales`}
            </p>
            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {section.videos.map((title, i) => (
                <VideoPlaceholder key={i} title={title} />
              ))}
            </div>
          </div>
        )}

        {/* Step-by-step guide */}
        <p className="text-[11px] font-black uppercase tracking-[3px] mb-4" style={{ color: GRAY }}>
          <i className="fa-solid fa-list-check mr-2" />
          Guía paso a paso
        </p>
        <div className="space-y-4">
          {section.steps.map((step, i) => (
            <div
              key={i}
              className="rounded-[20px] p-6"
              style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center"
                  style={{ background: 'rgba(0,122,255,0.12)' }}>
                  <i className={`fa-solid ${step.icon} text-[16px]`} style={{ color: BLUE }} />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-black uppercase tracking-[2px] block mb-1" style={{ color: 'rgba(0,0,0,0.3)' }}>
                    Paso {i + 1}
                  </span>
                  <h3 className="text-[17px] font-bold mb-1.5" style={{ color: DARK }}>{step.title}</h3>
                  <p className="text-[15px] font-medium leading-relaxed" style={{ color: GRAY }}>{step.desc}</p>
                  {step.tip && (
                    <div className="mt-3 rounded-[10px] px-4 py-3"
                      style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
                      <span className="text-[13px] font-semibold" style={{ color: ORANGE }}>{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help CTA */}
      <div className="mt-16 rounded-[20px] p-6 text-center" style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-[17px] font-bold mb-2" style={{ color: DARK }}>¿Necesitas más ayuda?</p>
        <p className="text-[15px] font-medium mb-4" style={{ color: GRAY }}>Escríbenos y te respondemos a la brevedad.</p>
        <a
          href="mailto:hola@fluxappfinance.com"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-[12px] text-[15px] font-bold text-white"
          style={{ background: BLUE }}
        >
          <i className="fa-solid fa-envelope text-[13px]" />
          Contactar soporte
        </a>
      </div>
    </main>
  )
}
