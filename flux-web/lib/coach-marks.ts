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
      target: 'home-budget',
      title: 'Presupuesto mensual',
      description: 'Controla cuánto llevas gastado vs tu límite. Toca el lápiz para definirlo.',
    },
    {
      target: 'global-fab',
      title: 'Agregar movimiento',
      description: 'Registra gastos, ingresos y transferencias entre cuentas desde aquí.',
    },
    {
      target: 'app-nav',
      title: 'Navegación',
      description: 'Inicio · Movimientos · Compartidos · Insights · Configuración.',
    },
  ],
  transactions: [
    {
      target: 'tx-filter-bar',
      title: 'Filtros rápidos',
      description: 'Filtra por tipo (gastos, ingresos, transferencias) o por categoría. Combínalos para buscar exacto.',
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
      description: 'Resumen de lo que te deben y lo que debes. Toca cualquier persona para ver el detalle y liquidar.',
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
      description: 'Cuentas, categorías, recurrentes, personas, apariencia, plan y guía — todo aquí.',
    },
  ],
}
