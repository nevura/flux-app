export interface CoachMarkStep {
  target: string
  title: string
  description: string
}

export const COACH_MARKS: Record<string, CoachMarkStep[]> = {
  home: [
    {
      target: 'home-balance',
      title: 'Tu saldo total',
      description: 'Suma en tiempo real de todas tus cuentas: efectivo, débito y crédito disponible.',
    },
    {
      target: 'home-bell',
      title: 'Notificaciones',
      description: 'Solicitudes de amistad, gastos compartidos y confirmaciones de pago llegan aquí.',
    },
    {
      target: 'home-budget',
      title: 'Presupuesto mensual',
      description: 'Controla cuánto llevas gastado vs tu límite. Toca el lápiz para definirlo o cámbialo en Configuración.',
    },
    {
      target: 'home-daily',
      title: 'Gastos de hoy / semana',
      description: 'Ve cuánto gastaste hoy o en la semana. Usa las flechas para navegar días anteriores.',
    },
    {
      target: 'home-recurring',
      title: 'Recurrentes del mes',
      description: 'Tus suscripciones y cobros fijos pendientes. Toca cualquiera para registrarlo o saltarlo.',
    },
    {
      target: 'home-accounts',
      title: 'Estado de cuentas',
      description: 'Saldo de cada cuenta. Toca "Auditar" para ajustar si el saldo no cuadra con tu banco.',
    },
    {
      target: 'global-fab',
      title: 'Agregar movimiento',
      description: 'Registra gastos, ingresos y transferencias entre cuentas. Siempre visible en cualquier página.',
    },
    {
      target: 'app-nav',
      title: 'Navegación',
      description: 'Inicio · Movimientos · Estadísticas · Compartidos · Configuración.',
    },
  ],
  transactions: [
    {
      target: 'tx-month-nav',
      title: 'Navegar entre meses',
      description: 'Usa las flechas para ir al mes anterior/siguiente, o toca el nombre del mes para saltar a cualquier mes.',
    },
    {
      target: 'tx-filter-bar',
      title: 'Filtros rápidos',
      description: 'Filtra por tipo (gastos, ingresos, transferencias) o por categoría. Combínalos para búsquedas precisas.',
    },
    {
      target: 'tx-search',
      title: 'Buscar movimientos',
      description: 'Busca por nombre o concepto en todos tus movimientos, incluso de meses anteriores.',
    },
  ],
  shared: [
    {
      target: 'shared-summary',
      title: 'Balance compartido',
      description: 'Lo que te deben (verde) y lo que debes (rojo). Toca a cualquier persona para ver el desglose y liquidar.',
    },
    {
      target: 'shared-add-friends',
      title: 'Agregar amigos',
      description: 'Busca a alguien por su @usuario para compartir gastos directamente en Flux.',
    },
  ],
  settings: [
    {
      target: 'settings-profile-header',
      title: 'Tu perfil',
      description: 'Toca aquí para editar tu nombre, @usuario y teléfono.',
    },
    {
      target: 'settings-list',
      title: 'Secciones de configuración',
      description: 'Cuentas, categorías, recurrentes, personas, presupuesto, apariencia, plan y guía — todo aquí.',
    },
  ],
}
