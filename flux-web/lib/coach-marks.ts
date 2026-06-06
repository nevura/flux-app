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
      description: 'Inicio · Movimientos · Estadísticas · Compartidos. El botón central + agrega movimientos rápidamente.',
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
      description: 'Filtra por tipo (gastos, ingresos, transferencias, por pagar, por cobrar). Combínalos para búsquedas precisas.',
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
    {
      target: 'global-fab',
      title: 'Registrar deuda (IOWE)',
      description: 'Al agregar un gasto, toca "Lo pagó otra persona" para registrar una deuda sin que salga dinero de tu cuenta. Cuando pagues, marca "Ya pagué" y el saldo se ajusta.',
    },
  ],
  settings: [
    {
      target: 'settings-profile-header',
      title: 'Tu perfil',
      description: 'Toca aquí para editar tu nombre, @usuario y foto. Tu @usuario permite que amigos te encuentren para dividir gastos.',
    },
    {
      target: 'settings-section-shortcuts',
      title: '⚡ Instala los Atajos de iPhone',
      description: 'El Atajo de Apple Pay registra tus gastos automáticamente cada vez que pagas. Toma menos de 2 minutos instalar. ¡Es la función más útil de Flux!',
    },
    {
      target: 'settings-section-cuentas',
      title: 'Configura tus cuentas',
      description: 'Agrega cada tarjeta o fuente de dinero. El nombre debe coincidir EXACTAMENTE con el nombre en Wallet para que el Atajo funcione.',
    },
    {
      target: 'settings-section-planificados',
      title: 'Transacciones recurrentes',
      description: 'Configura servicios de streaming, renta, nómina — todo lo que se repite. Flux los registra automáticamente. Toca "Nuevo" y define la fecha de cobro y la frecuencia.',
    },
    {
      target: 'settings-section-suscripcion',
      title: 'Tu plan',
      description: 'Gestiona tu suscripción y período de prueba. Puedes cancelar en cualquier momento — conservas acceso hasta el final del período pagado.',
    },
    {
      target: 'settings-section-soporte',
      title: 'Soporte',
      description: '¿Tienes alguna duda o problema? Escríbenos aquí y te respondemos directo en la app y por correo.',
    },
  ],
}
