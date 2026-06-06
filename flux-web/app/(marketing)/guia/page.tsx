'use client'

import { useState } from 'react'

const BLUE = '#007AFF'
const GRAY = '#6E6E73'
const DARK = '#1D1D1F'
const LIGHT = '#F5F5F7'

const tabs = [
  { id: 'inicio', label: 'Primeros pasos', icon: 'fa-rocket' },
  { id: 'applepay', label: 'Apple Pay', icon: 'fa-brands fa-apple' },
  { id: 'compartidos', label: 'Compartidos', icon: 'fa-users' },
  { id: 'presupuestos', label: 'Presupuestos', icon: 'fa-bullseye' },
]

const content: Record<string, { title: string; steps: { icon: string; title: string; desc: string; tip?: string }[] }> = {
  inicio: {
    title: 'Primeros pasos con FluxApp Finance',
    steps: [
      { icon: 'fa-user-plus', title: 'Crea tu cuenta', desc: 'Regístrate con tu correo electrónico. El acceso está sujeto a aprobación — te avisamos por email cuando esté lista tu cuenta.' },
      { icon: 'fa-wallet', title: 'Configura tus cuentas', desc: 'Ve a Ajustes → Cuentas y agrega tu cuenta de Efectivo, Tarjeta de Débito y/o Tarjeta de Crédito. Ajusta el saldo inicial para que coincida con tu saldo real.' },
      { icon: 'fa-tag', title: 'Personaliza categorías', desc: 'Flux incluye categorías predeterminadas (Comida, Transporte, Entretenimiento, etc.). En Ajustes → Categorías puedes crear las tuyas con ícono y color personalizado.' },
      { icon: 'fa-plus', title: 'Registra tu primer gasto', desc: 'Toca el botón azul + en cualquier pantalla. Escribe el concepto, monto, categoría y cuenta. ¡Listo! Ya tienes tu primer movimiento registrado.' },
      { icon: 'fa-chart-pie', title: 'Explora tu dashboard', desc: 'El tab de Inicio muestra tu saldo total, gastos del mes e ingresos. El tab de Estadísticas desglosa por categoría con gráficas mensuales.' },
    ],
  },
  applepay: {
    title: 'Integración con Apple Pay',
    steps: [
      { icon: 'fa-mobile-screen', title: 'Requisitos', desc: 'Necesitas un iPhone con iOS 16 o superior. La integración usa Atajos de iPhone (app nativa de Apple, pre-instalada).' },
      { icon: 'fa-download', title: 'Descarga el Atajo', desc: 'En FluxApp Finance, ve a Ajustes → Atajos de iPhone y toca "Instalar Atajo Apple Pay". Se abrirá la app de Atajos con el atajo listo para configurar.' },
      { icon: 'fa-gear', title: 'Configura el Atajo', desc: 'Durante la instalación, el Atajo te pedirá tu token de FluxApp Finance (lo encuentras en Ajustes → Atajos) y el nombre exacto de tu tarjeta tal como aparece en Wallet.', tip: '⚠️ El nombre de la cuenta en Flux debe coincidir EXACTAMENTE con el nombre de la tarjeta en Configuración → Wallet y Apple Pay → [tu tarjeta]' },
      { icon: 'fa-bolt', title: 'Primera prueba', desc: 'Realiza una compra con Apple Pay. Segundos después, recibirás una notificación de FluxApp Finance con el gasto registrado automáticamente.' },
      { icon: 'fa-circle-check', title: 'Confirma el gasto', desc: 'Los gastos registrados automáticamente aparecen como "Por confirmar". Abre FluxApp Finance, revisa el gasto y toca el botón ✓ para confirmarlo. También puedes confirmarlo directamente desde la lista deslizando la tarjeta.' },
    ],
  },
  compartidos: {
    title: 'Gastos compartidos',
    steps: [
      { icon: 'fa-user-plus', title: 'Agrega amigos', desc: 'Ve a Compartidos → ícono de amigos y busca a tus amigos por @username. Envíales una solicitud — cuando acepten, quedan vinculados.' },
      { icon: 'fa-person-dots-from-line', title: 'Crea contactos locales', desc: 'En Ajustes → Personas puedes crear contactos sin importar si usan Flux. Cuando empiecen a usar la app, puedes vincularlos a su cuenta.' },
      { icon: 'fa-receipt', title: 'Registra un gasto compartido', desc: 'Al crear un gasto, activa "Compartir gasto", selecciona a las personas y elige si dividir en partes iguales o asignar montos específicos. Flux enviará una notificación a tus amigos vinculados.' },
      { icon: 'fa-hand-holding-dollar', title: 'Liquida deudas', desc: 'En Compartidos, toca a una persona para ver sus gastos pendientes. Puedes "Saldar todo" o hacer abonos parciales. Si tienes registrada la cuenta, Flux crea automáticamente el ingreso correspondiente.' },
      { icon: 'fa-bell', title: 'Notificaciones', desc: 'Tus amigos recibirán notificaciones cuando los invites a un gasto. Ellos pueden aceptar la deuda (y la verán en sus Compartidos) o ignorarla.' },
    ],
  },
  presupuestos: {
    title: 'Presupuestos',
    steps: [
      { icon: 'fa-bullseye', title: '¿Qué es un presupuesto?', desc: 'Un presupuesto en Flux es un límite mensual que defines por categoría. Por ejemplo: máximo $3,000 en Comida, $800 en Entretenimiento.' },
      { icon: 'fa-plus', title: 'Crear un presupuesto', desc: 'Ve a Ajustes → Presupuestos, toca "Nuevo presupuesto", elige la categoría y el monto límite mensual. El presupuesto se reinicia automáticamente el primer día de cada mes.' },
      { icon: 'fa-chart-bar', title: 'Visualizar avance', desc: 'En el Dashboard verás el avance de cada presupuesto con una barra de progreso. Verde = bien, amarillo = cerca del límite, rojo = excedido.' },
      { icon: 'fa-triangle-exclamation', title: 'Alertas', desc: 'Flux te notifica cuando llegas al 80% de tu presupuesto para que puedas ajustar tus gastos antes de excederlo.' },
      { icon: 'fa-rotate', title: 'Gastos recurrentes', desc: 'En Ajustes → Recurrentes puedes programar gastos fijos (streaming, renta, servicios). Flux los registra automáticamente en la fecha que configures.' },
    ],
  },
}

export default function GuiaPage() {
  const [active, setActive] = useState('inicio')
  const section = content[active]

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Documentación</p>
      <h1 className="text-[40px] font-black tracking-[-1px] mb-2" style={{ color: DARK }}>Guía de FluxApp Finance</h1>
      <p className="text-[16px] font-medium mb-10" style={{ color: GRAY }}>Todo lo que necesitas saber para sacar el máximo provecho.</p>

      {/* Tabs — single scrollable row */}
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
        <h2 className="text-[28px] font-black mb-8" style={{ color: DARK }}>{section.title}</h2>

        <div className="space-y-5">
          {section.steps.map((step, i) => (
            <div
              key={i}
              className="rounded-[20px] p-6"
              style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.05)' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center"
                  style={{ background: `rgba(0,122,255,0.12)` }}>
                  <i className={`fa-solid ${step.icon} text-[16px]`} style={{ color: BLUE }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-[2px]" style={{ color: 'rgba(0,0,0,0.3)' }}>Paso {i + 1}</span>
                  </div>
                  <h3 className="text-[18px] font-bold mb-1.5" style={{ color: DARK }}>{step.title}</h3>
                  <p className="text-[15px] font-medium leading-relaxed" style={{ color: GRAY }}>{step.desc}</p>
                  {step.tip && (
                    <div className="mt-3 rounded-[10px] px-4 py-3 flex items-start gap-2.5"
                      style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
                      <span className="text-[13px] font-semibold" style={{ color: '#FF9500' }}>{step.tip}</span>
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
