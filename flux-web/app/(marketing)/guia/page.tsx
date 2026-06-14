'use client'

import { useState } from 'react'

const BLUE = '#007AFF'
const GRAY = '#6E6E73'
const DARK = '#1D1D1F'
const LIGHT = '#F5F5F7'
const ORANGE = '#FF9500'

// ── Video placeholder ─────────────────────────────────────────────────────────
function VideoPlaceholder({ title }: { title: string }) {
  return (
    <div
      className="rounded-[18px] overflow-hidden flex-shrink-0"
      style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', width: 200 }}
    >
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

// ── Photo placeholder (when no image yet) ─────────────────────────────────────
function PhotoPlaceholder({ hint }: { hint: string }) {
  return (
    <div
      className="w-full rounded-[10px] overflow-hidden"
      style={{
        background: '#EFF4FF',
        border: '1.5px dashed rgba(0,122,255,0.28)',
        position: 'relative',
        paddingTop: '177.78%',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '0 10px',
      }}>
        <i className="fa-regular fa-image text-[16px]" style={{ color: 'rgba(0,122,255,0.38)' }} />
        <p className="text-[9px] font-semibold text-center leading-tight" style={{ color: 'rgba(0,0,0,0.35)' }}>
          {hint}
        </p>
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = { icon: string; title: string; desc: string; tip?: string }
type PhotoStep = { label: string; desc: string; photoLabel: string; imageSrc?: string }
type PhotoTutorial = { title: string; steps: PhotoStep[] }
type Section = {
  title: string
  intro?: { text: string; tip?: string }
  videos: string[]
  steps: Step[]
  photoTutorials?: PhotoTutorial[]
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'inicio',        label: 'Agregar a inicio',  icon: 'fa-house' },
  { id: 'atajos',        label: 'Atajos',             icon: 'fa-bolt' },
  { id: 'cuentas',       label: 'Cuentas',            icon: 'fa-credit-card' },
  { id: 'divisas',       label: 'Divisas',            icon: 'fa-earth-americas' },
  { id: 'compartidos',   label: 'Compartidos',        icon: 'fa-users' },
  { id: 'planificacion', label: 'Planificación',      icon: 'fa-rotate' },
  { id: 'estadisticas',  label: 'Estadísticas',       icon: 'fa-chart-line' },
  { id: 'soporte',       label: 'Cuenta y soporte',   icon: 'fa-headset' },
]

// ── Section data ──────────────────────────────────────────────────────────────
const sections: Record<string, Section> = {

  // ── Agregar a inicio ────────────────────────────────────────────────────────
  inicio: {
    title: 'Agregar FluxApp a tu pantalla de inicio',
    intro: {
      text: 'FluxApp Finance no está en el App Store — es una aplicación web progresiva (PWA). Puedes agregarla a tu pantalla de inicio para abrirla con un toque, en pantalla completa, igual que una app nativa. Solo necesitas hacerlo una vez.',
      tip: '⚠️ FluxApp requiere conexión a internet para funcionar. Sin internet, la app no carga.',
    },
    videos: [],
    steps: [
      {
        icon: 'fa-mobile-screen-button',
        title: '¿Por qué agregar a inicio?',
        desc: 'Al agregarla a tu pantalla de inicio desaparece la barra del navegador y obtienes una experiencia de app completa. El ícono queda como el de cualquier app.',
      },
      {
        icon: 'fa-wifi',
        title: 'Requiere internet',
        desc: 'FluxApp es una aplicación web — necesita internet para cargar. Sin conexión, la app no abre. Asegúrate de tener WiFi o datos móviles activos.',
      },
      {
        icon: 'fa-rotate',
        title: 'Se actualiza sola',
        desc: 'No necesitas descargar actualizaciones. Cada vez que abrimos la app con una nueva versión, la recibes automáticamente sin hacer nada.',
      },
    ],
    photoTutorials: [
      {
        title: 'Paso a paso — Agregar a inicio',
        steps: [
          { label: '1', desc: 'Abre fluxappfinance.com en Safari (iPhone) o Chrome (Android)', photoLabel: 'Navegador escribiendo el link', imageSrc: '/guia/agrear-inicio1.PNG' },
          { label: '2', desc: 'Toca el botón de Compartir', photoLabel: 'Botón compartir resaltado', imageSrc: '/guia/agregar-inicio2.PNG' },
          { label: '3', desc: 'Toca "Ver más" en el menú de Safari', photoLabel: '"Ver más" resaltado', imageSrc: '/guia/agregar-inicio3.PNG' },
          { label: '4', desc: 'Toca "Agregar a inicio"', photoLabel: '"Agregar a inicio" resaltado', imageSrc: '/guia/agregar-inicio4.PNG' },
          { label: '5', desc: 'Confirma tocando "Agregar"', photoLabel: 'Botón "Agregar" resaltado', imageSrc: '/guia/agregar-inicio5.PNG' },
          { label: '6', desc: '¡Listo! El ícono de FluxApp aparece en tu pantalla', photoLabel: 'Ícono de FluxApp en inicio', imageSrc: '/guia/agregar-inicio6.png' },
        ],
      },
    ],
  },

  // ── Atajos ──────────────────────────────────────────────────────────────────
  atajos: {
    title: 'Atajos de iPhone',
    intro: {
      text: 'Los Atajos de iPhone permiten que FluxApp registre tus gastos automáticamente al pagar con Apple Pay, sin que tengas que abrir la app. La configuración toma menos de 5 minutos.',
      tip: '⚠️ El nombre de tu cuenta en FluxApp debe ser IDÉNTICO al nombre de tu tarjeta en Ajustes → Wallet y Apple Pay (hasta el acento importa). Los Atajos solo funcionan con internet — si hay error, registra el gasto manualmente.',
    },
    videos: [
      'Cómo instalar el Atajo Apple Pay',
      'Cómo usar el Atajo de Registro Rápido',
      'Qué hacer si el Atajo falla',
    ],
    steps: [
      {
        icon: 'fa-mobile-screen',
        title: 'Requisitos',
        desc: 'iPhone con iOS 16 o superior. La app de Atajos viene pre-instalada en todos los iPhone.',
      },
      {
        icon: 'fa-triangle-exclamation',
        title: 'El nombre de la tarjeta debe coincidir exactamente',
        desc: 'El nombre de la cuenta en Flux debe ser IDÉNTICO al nombre que aparece en Ajustes → Wallet y Apple Pay al tocar tu tarjeta. Hasta el acento importa.',
        tip: 'Si no coinciden, el Atajo no encontrará la cuenta y el gasto no se registrará.',
      },
      {
        icon: 'fa-plus-circle',
        title: 'Agrega tarjetas nuevas a la Automatización',
        desc: 'Si después agregas una nueva tarjeta a tu Wallet, debes entrar a la Automatización en la app de Atajos y seleccionarla manualmente — no se agrega automáticamente.',
      },
      {
        icon: 'fa-bolt',
        title: 'Cómo funciona',
        desc: 'Cada vez que pagas con Apple Pay, la Automatización activa el Atajo de FluxApp, que detecta el monto y el comercio y registra el gasto como "Por confirmar".',
      },
      {
        icon: 'fa-keyboard',
        title: 'Atajo de Registro Rápido',
        desc: 'Sirve para registrar cualquier gasto en segundos sin abrir Flux. Instálalo desde Configuración → Atajos. También funciona con Siri.',
      },
      {
        icon: 'fa-circle-check',
        title: 'Confirma los gastos',
        desc: 'Los gastos de Atajos llegan como "Por confirmar" en Movimientos. Toca ✓ para validarlos o desliza la tarjeta en la lista.',
      },
    ],
    photoTutorials: [
      {
        title: 'Instalar el Atajo Apple Pay',
        steps: [
          { label: '1', desc: 'En Inicio, toca el menú (≡) en la esquina superior izquierda', photoLabel: 'Menú ≡ resaltado', imageSrc: '/guia/agregar-atajo1.PNG' },
          { label: '2', desc: 'Ve a Configuración → Atajos', photoLabel: 'Opción Atajos resaltada', imageSrc: '/guia/agregar-atajo2.PNG' },
          { label: '3', desc: 'Copia tu token y toca "Instalar Atajo"', photoLabel: 'Token y botón Instalar Atajo', imageSrc: '/guia/agregar-atajo3.PNG' },
          { label: '4', desc: 'En la app de Atajos, toca "Agregar atajo"', photoLabel: 'Botón Agregar atajo resaltado', imageSrc: '/guia/agregar-atajo4.PNG' },
          { label: '5', desc: 'Toca ··· en el Atajo de FluxApp Apple Pay', photoLabel: 'Botón ··· resaltado', imageSrc: '/guia/agregar-atajo5.png' },
          { label: '6', desc: 'Toca el campo "Texto" (el que está vacío)', photoLabel: 'Campo Texto resaltado', imageSrc: '/guia/agregar-atajo6.PNG' },
          { label: '7', desc: 'Pega tu token y toca ‹ para guardar y salir', photoLabel: 'Token pegado, botón Atrás', imageSrc: '/guia/agregar-atajo7.PNG' },
        ],
      },
      {
        title: 'Configurar la Automatización',
        steps: [
          { label: '1', desc: 'Ve a la pestaña "Automatización" y toca "Nueva automatización"', photoLabel: 'Pestaña y botón Nueva automatización', imageSrc: '/guia/instalar-autom1.PNG' },
          { label: '2', desc: 'Selecciona "Wallet" de la lista de disparadores', photoLabel: 'Opción Wallet resaltada', imageSrc: '/guia/instalar-autom2.PNG' },
          { label: '3', desc: 'Marca todas tus tarjetas y toca "Listo"', photoLabel: 'Tarjetas seleccionadas y Listo', imageSrc: '/guia/instalar-autom3.PNG' },
          { label: '4', desc: 'Selecciona "FluxApp Apple Pay" como acción', photoLabel: 'FluxApp Apple Pay seleccionado', imageSrc: '/guia/instalar-autom4.PNG' },
          { label: '5', desc: 'La automatización fue creada. Tócala para abrirla', photoLabel: 'Automatización creada resaltada', imageSrc: '/guia/instalar-autom5.PNG' },
          { label: '6', desc: 'Toca el botón "Automatización" en la parte superior', photoLabel: 'Botón Automatización resaltado', imageSrc: '/guia/instalar-autom6.PNG' },
          { label: '7', desc: 'Elige "Ejecutar de inmediato" y toca "Listo"', photoLabel: '"Ejecutar de inmediato" y Listo', imageSrc: '/guia/instalar-autom7.PNG' },
        ],
      },
      {
        title: 'Permisos requeridos (primera vez)',
        steps: [
          { label: '1', desc: 'Toca "Permitir" para que el Atajo se conecte a Flux', photoLabel: 'Permiso de conexión a Flux', imageSrc: '/guia/permitir-1.PNG' },
          { label: '2', desc: 'Toca "Permitir" para habilitar las notificaciones del Atajo', photoLabel: 'Permiso de notificaciones', imageSrc: '/guia/permitir-2.PNG' },
        ],
      },
      {
        title: 'Widget de Registro Rápido (pantalla de bloqueo u otras)',
        steps: [
          { label: '1', desc: 'Mantén presionada la pantalla de bloqueo y toca "Personalizar"', photoLabel: 'Botón Personalizar resaltado', imageSrc: '/guia/widget-regsitro-rapido1.PNG' },
          { label: '2', desc: 'Toca el área de widgets para agregar uno', photoLabel: '"Agrega widgets" resaltado', imageSrc: '/guia/widget-regsitro-rapido2.PNG' },
          { label: '3', desc: 'Selecciona "Atajos" de la lista de apps', photoLabel: 'Atajos resaltado en la lista', imageSrc: '/guia/widget-regsitro-rapido3.PNG' },
          { label: '4', desc: 'Toca el widget "Atajo" para agregarlo', photoLabel: 'Widget Atajo resaltado', imageSrc: '/guia/widget-regsitro-rapido4.PNG' },
          { label: '5', desc: 'El widget fue agregado — tócalo para configurar qué atajo ejecuta', photoLabel: 'Widget agregado resaltado', imageSrc: '/guia/widget-regsitro-rapido5.PNG' },
          { label: '6', desc: 'Selecciona "FluxApp Registro Rápido"', photoLabel: 'FluxApp Registro Rápido seleccionado', imageSrc: '/guia/widget-regsitro-rapido6.PNG' },
          { label: '7', desc: 'Cierra el panel tocando X', photoLabel: 'Botón X resaltado', imageSrc: '/guia/widget-regsitro-rapido7.PNG' },
          { label: '8', desc: 'Toca "Listo" para guardar los cambios', photoLabel: 'Botón Listo resaltado', imageSrc: '/guia/widget-regsitro-rapido8.PNG' },
          { label: '9', desc: '¡Listo! Al tocar el widget, el Atajo se ejecuta de inmediato', photoLabel: 'Atajo ejecutándose', imageSrc: '/guia/widget-regsitro-rapido9.PNG' },
        ],
      },
    ],
  },

  // ── Cuentas ─────────────────────────────────────────────────────────────────
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
    photoTutorials: [
      {
        title: 'Agregar una cuenta',
        steps: [
          { label: '1', desc: 'Ve a Configuración y toca "Cuentas"', photoLabel: '"Cuentas" resaltado en Configuración' },
          { label: '2', desc: 'Toca el botón + para agregar una nueva cuenta', photoLabel: 'Botón + Nueva cuenta resaltado' },
          { label: '3', desc: 'Elige el tipo: Efectivo, Débito o Crédito', photoLabel: 'Selector de tipo de cuenta' },
          { label: '4', desc: 'Ingresa el nombre, elige color e ícono', photoLabel: 'Formulario con nombre, color e ícono' },
          { label: '5', desc: 'Establece el saldo inicial y guarda', photoLabel: 'Campo de saldo inicial rellenado' },
        ],
      },
      {
        title: 'Auditoría de saldo',
        steps: [
          { label: '1', desc: 'En Cuentas, toca el ícono de balanza (⚖) de la cuenta que no cuadra', photoLabel: 'Ícono de balanza resaltado en la cuenta' },
          { label: '2', desc: 'Ingresa el saldo real que te muestra tu banco', photoLabel: 'Pantalla de auditoría con campo de saldo real' },
          { label: '3', desc: 'Flux genera el ajuste y cuadra la diferencia', photoLabel: 'Ajuste automático generado visible' },
        ],
      },
    ],
  },

  // ── Divisas ─────────────────────────────────────────────────────────────────
  divisas: {
    title: 'Divisas y tipo de cambio',
    intro: {
      text: 'Cada cuenta en Flux puede estar en una divisa diferente. El tipo de cambio se obtiene automáticamente del Banco Central Europeo (BCE) para las divisas más comunes — no tienes que buscarlo tú.',
      tip: '💡 Los totales globales (saldo, presupuesto, estadísticas) siempre se muestran en tu divisa base, que configuras en Perfil.',
    },
    videos: [],
    steps: [
      {
        icon: 'fa-credit-card',
        title: 'Divisa de una cuenta',
        desc: 'Al crear o editar una cuenta en Configuración → Cuentas, elige su divisa. Todas las cuentas son MXN por defecto. Puedes tener varias cuentas en distintas divisas al mismo tiempo.',
      },
      {
        icon: 'fa-earth-americas',
        title: 'Divisa base (tu moneda de referencia)',
        desc: 'En Configuración → Perfil selecciona tu divisa base. Es la moneda en la que se muestran los totales globales — saldo en Inicio, gráficas en Estadísticas, presupuesto. Por defecto es MXN.',
      },
      {
        icon: 'fa-rotate',
        title: 'Tipo de cambio automático (BCE)',
        desc: 'Para EUR, USD, GBP, CAD, JPY y BRL: Flux obtiene el tipo de cambio diario del Banco Central Europeo automáticamente. Al registrar un gasto, el campo de tipo de cambio se llena con la tasa oficial del día que elijas.',
        tip: 'El tipo de cambio se actualiza cada día al mediodía. Los fines de semana usa el último día hábil.',
      },
      {
        icon: 'fa-plus',
        title: 'Registrar un gasto en divisa extranjera',
        desc: 'Selecciona la cuenta en moneda extranjera → el tipo de cambio aparece pre-llenado con la tasa del BCE para la fecha del movimiento. Solo necesitas ingresar el monto en la divisa de la cuenta.',
      },
      {
        icon: 'fa-pencil',
        title: 'Tipo de cambio manual',
        desc: 'Si necesitas mayor precisión, puedes editar el campo de tipo de cambio directamente. Una vez que lo editas, Flux lo marca como "Tasa manual" y no lo sobreescribe automáticamente.',
      },
      {
        icon: 'fa-triangle-exclamation',
        title: 'ARS, COP, CLP — sin tasa automática',
        desc: 'Peso argentino, peso colombiano y peso chileno no forman parte del sistema BCE. Para estas divisas deberás ingresar el tipo de cambio manualmente al registrar cada movimiento.',
      },
      {
        icon: 'fa-chart-line',
        title: 'Cómo se muestran los totales',
        desc: 'Los montos por transacción se muestran en su divisa original (ej: $50 USD). Los totales agregados (saldo, estadísticas, presupuesto) se convierten a tu divisa base usando el tipo de cambio guardado en cada movimiento.',
      },
    ],
  },

  // ── Compartidos ─────────────────────────────────────────────────────────────
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
      { icon: 'fa-hand-holding-dollar', title: 'Ingreso compartido (por cobrar)', desc: 'Al crear un ingreso, activa "Ingreso futuro / pendiente de cobro". El monto no entra a tu cuenta hasta que marques el cobro.' },
      { icon: 'fa-coins', title: 'Liquida deudas', desc: 'En Compartidos, abre a una persona y usa "Saldar todo" o "Abonar" para registrar pagos parciales. Flux crea los movimientos automáticamente.' },
    ],
    photoTutorials: [
      {
        title: 'Agregar y vincular amigos',
        steps: [
          { label: '1', desc: 'Ve a la pestaña Compartidos y toca el ícono de personas (esquina superior)', photoLabel: 'Pestaña Compartidos con ícono de amigos resaltado' },
          { label: '2', desc: 'Busca a tu amigo escribiendo su @usuario', photoLabel: 'Buscador con @usuario escrito y resultado' },
          { label: '3', desc: 'Toca "Enviar solicitud" — cuando la acepten quedan vinculados', photoLabel: 'Botón "Enviar solicitud" resaltado' },
          { label: '4', desc: 'En Configuración → Personas, toca el ícono de vínculo para conectar un contacto con su cuenta de Flux', photoLabel: 'Ícono de vínculo resaltado en la lista de Personas' },
        ],
      },
      {
        title: 'Gasto compartido — tú pagaste (THEY)',
        steps: [
          { label: '1', desc: 'Al crear un gasto, activa el toggle "Compartir gasto"', photoLabel: 'Toggle "Compartir gasto" activado resaltado' },
          { label: '2', desc: 'Selecciona la persona y el modo: partes iguales o personalizado', photoLabel: 'Selector de persona y modo de división' },
          { label: '3', desc: 'Ajusta los montos por persona y confirma', photoLabel: 'Montos asignados por persona' },
          { label: '4', desc: 'El gasto aparece en Compartidos mostrando quién te debe y cuánto', photoLabel: 'Gasto compartido en Compartidos con deuda visible' },
        ],
      },
      {
        title: 'Lo pagó otra persona (IOWE) y cómo liquidar',
        steps: [
          { label: '1', desc: 'Al crear un gasto, activa "Lo pagó otra persona" — el monto NO sale de tu cuenta', photoLabel: 'Toggle IOWE activado resaltado' },
          { label: '2', desc: 'El gasto queda como "Por pagar" en Movimientos', photoLabel: 'Gasto marcado como "Por pagar" en Movimientos' },
          { label: '3', desc: 'Cuando pagues, en Compartidos toca a la persona y elige "Saldar todo" o "Abonar"', photoLabel: 'Botones Saldar/Abonar resaltados' },
          { label: '4', desc: 'Elige la cuenta desde la que pagas y confirma', photoLabel: 'Selector de cuenta y confirmación del pago' },
        ],
      },
    ],
  },

  // ── Planificación ───────────────────────────────────────────────────────────
  planificacion: {
    title: 'Planificación',
    videos: [
      'Cómo agregar un gasto o ingreso recurrente',
      'Cómo asignar un presupuesto fijo y personalizar por mes',
    ],
    steps: [
      { icon: 'fa-rotate', title: '¿Qué son los recurrentes?', desc: 'Gastos o ingresos que se repiten: streaming, renta, nómina, servicios. Flux los genera automáticamente en la fecha que configures y los marca como "Por confirmar".' },
      { icon: 'fa-calendar-plus', title: 'Crear un recurrente', desc: 'Ve a Configuración → Planificados y toca "Nuevo". Define nombre, monto, categoría, cuenta y frecuencia (diaria, semanal, mensual o anual).' },
      { icon: 'fa-bullseye', title: 'Presupuesto mensual', desc: 'Ve a Configuración → Presupuesto y define cuánto quieres gastar al mes. La barra en el Dashboard muestra cuánto llevas vs tu límite.' },
      { icon: 'fa-sliders', title: 'Personalizar por mes', desc: 'En el Dashboard, toca el ícono de lápiz junto al presupuesto para ajustar el monto solo para ese mes, sin cambiar el valor predeterminado.' },
    ],
    photoTutorials: [
      {
        title: 'Crear un recurrente',
        steps: [
          { label: '1', desc: 'Ve a Configuración y toca "Planificados"', photoLabel: '"Planificados" resaltado en Configuración' },
          { label: '2', desc: 'Toca el botón + para crear un nuevo planificado', photoLabel: 'Botón + Nuevo planificado resaltado' },
          { label: '3', desc: 'Define el nombre, monto, categoría y cuenta', photoLabel: 'Formulario de planificado con campos rellenados' },
          { label: '4', desc: 'Elige la frecuencia (mensual, semanal...) y la próxima fecha de cobro', photoLabel: 'Selector de frecuencia y fecha' },
          { label: '5', desc: 'El recurrente aparece en la lista y se generará automáticamente en esa fecha', photoLabel: 'Planificado guardado en la lista' },
        ],
      },
      {
        title: 'Configurar y personalizar el presupuesto',
        steps: [
          { label: '1', desc: 'Ve a Configuración y toca "Presupuesto"', photoLabel: '"Presupuesto" resaltado en Configuración' },
          { label: '2', desc: 'Ingresa el límite de gasto mensual que quieres mantener', photoLabel: 'Campo de límite mensual rellenado' },
          { label: '3', desc: 'La barra de progreso aparece en el Dashboard mostrando cuánto llevas gastado', photoLabel: 'Barra de presupuesto visible en el Dashboard' },
          { label: '4', desc: 'Toca el lápiz ✏ junto al presupuesto para ajustar el límite solo del mes actual', photoLabel: 'Ícono lápiz resaltado junto al presupuesto del mes' },
        ],
      },
    ],
  },

  // ── Estadísticas ────────────────────────────────────────────────────────────
  estadisticas: {
    title: 'Estadísticas y gráficas',
    videos: [
      'Cómo interpretar las gráficas y estadísticas',
    ],
    steps: [
      { icon: 'fa-chart-line', title: 'Gráfica de tendencia', desc: 'La línea azul muestra cómo evoluciona tu saldo día a día. La línea naranja es tu ritmo ideal según el presupuesto. Si la azul baja más rápido que la naranja, vas gastando de más.' },
      { icon: 'fa-chart-pie', title: 'Desglose por categoría', desc: 'Las barras en Estadísticas muestran cuánto gastaste en cada categoría este mes. Toca una categoría para ver los movimientos individuales.' },
      { icon: 'fa-calendar-days', title: 'Comparación mensual', desc: 'Navega entre meses con las flechas para comparar tus gastos históricos y ver si estás mejorando tus hábitos.' },
      { icon: 'fa-arrow-trend-up', title: 'Ingresos vs gastos', desc: 'El resumen mensual muestra total de ingresos, total de gastos y el neto. Un neto positivo significa que ahorraste ese mes.' },
    ],
    photoTutorials: [
      {
        title: 'Interpretar tus estadísticas',
        steps: [
          { label: '1', desc: 'Toca el ícono de gráfica en la barra inferior para ir a Estadísticas', photoLabel: 'Ícono de Estadísticas en la nav resaltado' },
          { label: '2', desc: 'La línea azul es tu saldo real día a día. La naranja es tu ritmo ideal según el presupuesto', photoLabel: 'Gráfica de tendencia con líneas azul y naranja visibles' },
          { label: '3', desc: 'Las barras muestran gasto por categoría — toca una para ver sus movimientos', photoLabel: 'Barras de categorías con una seleccionada/expandida' },
          { label: '4', desc: 'Usa las flechas ‹ › para navegar entre meses y comparar tu historial', photoLabel: 'Flechas de navegación de meses resaltadas' },
        ],
      },
    ],
  },

  // ── Soporte ─────────────────────────────────────────────────────────────────
  soporte: {
    title: 'Cuenta y soporte',
    videos: [
      'Cómo contactar a soporte',
      'Cómo gestionar tu suscripción',
    ],
    steps: [
      { icon: 'fa-comment-dots', title: 'Contactar soporte', desc: 'Ve a Configuración → Soporte y escribe tu mensaje. El equipo de Flux te responde directamente en la app. También puedes escribir a hola@fluxappfinance.com.' },
      { icon: 'fa-star', title: 'Gestionar tu suscripción', desc: 'Ve a Configuración → Plan y suscripción. Desde ahí puedes ver tu fecha de vencimiento, suscribirte a Flux Pro o gestionar (cancelar, actualizar) tu suscripción.' },
      { icon: 'fa-clock', title: 'Período de prueba', desc: 'Flux incluye 20 días de prueba gratuita con acceso completo. Al vencerse, si no tienes suscripción activa, la app pasa a modo de solo lectura — tus datos se conservan.' },
      { icon: 'fa-rotate-left', title: 'Al cancelar', desc: 'Si cancelas, conservas acceso hasta el final del período pagado. Tus datos nunca se borran — puedes reactivar en cualquier momento.' },
    ],
  },
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuiaPage() {
  const [active, setActive] = useState('inicio')
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

        {/* 1 — Intro */}
        {section.intro && (
          <div className="mb-8 rounded-[20px] p-6 space-y-3" style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-[15px] font-medium leading-relaxed" style={{ color: GRAY }}>{section.intro.text}</p>
            {section.intro.tip && (
              <div className="rounded-[10px] px-4 py-3" style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
                <span className="text-[13px] font-semibold" style={{ color: ORANGE }}>{section.intro.tip}</span>
              </div>
            )}
          </div>
        )}

        {/* 2 — Photo tutorials */}
        {section.photoTutorials && section.photoTutorials.length > 0 && (
          <div className="mb-10 space-y-8">
            {section.photoTutorials.map((tutorial, ti) => (
              <div key={ti}>
                <p className="text-[11px] font-black uppercase tracking-[3px] mb-4" style={{ color: GRAY }}>
                  <i className="fa-solid fa-images mr-2" />
                  {tutorial.title}
                </p>
                <div className="relative">
                  <div
                    className="flex gap-3 overflow-x-auto pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingRight: '6rem' }}
                  >
                    {tutorial.steps.map((step, si) => (
                      <div
                        key={si}
                        className="flex flex-col items-center gap-3 flex-shrink-0 rounded-[16px] p-4"
                        style={{ background: LIGHT, border: '1px solid rgba(0,0,0,0.05)', width: 158 }}
                      >
                        {/* Step number badge */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: BLUE }}
                        >
                          <span className="text-[12px] font-black text-white">{step.label}</span>
                        </div>
                        {/* Description — flex-1 keeps photos bottom-aligned across all cards */}
                        <p className="text-[11px] font-semibold text-center leading-snug" style={{ color: DARK, flex: 1 }}>
                          {step.desc}
                        </p>
                        {/* Photo */}
                        {step.imageSrc ? (
                          <div className="w-full rounded-[10px] overflow-hidden" style={{ position: 'relative', paddingTop: '177.78%', background: '#f8f8f8' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={step.imageSrc}
                              alt={step.photoLabel}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <PhotoPlaceholder hint={step.photoLabel} />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Fade hint — only when there are enough cards to overflow */}
                  {tutorial.steps.length > 4 && (
                    <div
                      className="absolute right-0 top-0 w-24 pointer-events-none"
                      style={{ bottom: 16, background: 'linear-gradient(to left, #ffffff 30%, transparent)' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3 — Step-by-step guide */}
        {section.steps.length > 0 && (
          <div className="mb-10">
            <p className="text-[11px] font-black uppercase tracking-[3px] mb-4" style={{ color: GRAY }}>
              <i className="fa-solid fa-list-check mr-2" />
              Guía y tips
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
        )}

        {/* 4 — Videos */}
        {section.videos.length > 0 && (
          <div>
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
