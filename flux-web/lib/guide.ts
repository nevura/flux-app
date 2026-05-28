export interface GuideItem {
  id: string
  icon: string
  iconColor: string
  title: string
  summary: string
  bullets: string[]
  tip?: string
}

export interface GuideSection {
  id: string
  label: string
  items: GuideItem[]
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'fundamentos',
    label: 'Fundamentos',
    items: [
      {
        id: 'saldo',
        icon: 'fa-solid fa-wallet',
        iconColor: 'var(--f-blue)',
        title: 'Saldo total',
        summary: 'El número grande en Inicio',
        bullets: [
          'Es la suma en tiempo real de todas tus cuentas activas',
          'Incluye efectivo, débito y el saldo disponible de crédito',
          'Verde si es positivo, rojo si está en negativo',
        ],
        tip: 'El saldo de tarjetas de crédito resta de tu total — así siempre ves lo que realmente tienes disponible',
      },
      {
        id: 'presupuesto',
        icon: 'fa-solid fa-chart-pie',
        iconColor: 'var(--f-expense)',
        title: 'Presupuesto mensual',
        summary: 'Límite de gasto que tú defines',
        bullets: [
          'Configúralo en Configuración → Presupuesto',
          'La barra en Inicio muestra cuánto llevas gastado vs tu límite',
          'Los gastos marcados como "Excluir del presupuesto" no cuentan',
          'Puedes cambiar el límite en cualquier momento sin afectar el historial',
        ],
        tip: 'Si no tienes presupuesto definido, la barra no aparece — configúralo para activarla',
      },
      {
        id: 'cuentas',
        icon: 'fa-solid fa-credit-card',
        iconColor: 'var(--f-transfer)',
        title: 'Cuentas',
        summary: 'Dónde vive tu dinero',
        bullets: [
          'Efectivo: billetera física, dinero en mano',
          'Débito (TDD): cuenta bancaria, dinero que ya tienes',
          'Crédito (TDC): deuda — gastos que pagarás después',
          'Crea tantas cuentas como tarjetas o fuentes de dinero tengas',
        ],
        tip: 'Agrega todas tus cuentas para tener una vista real de tu situación financiera',
      },
    ],
  },
  {
    id: 'movimientos',
    label: 'Movimientos',
    items: [
      {
        id: 'agregar',
        icon: 'fa-solid fa-plus',
        iconColor: 'var(--f-blue)',
        title: 'Agregar movimiento',
        summary: 'El botón azul + en la esquina inferior',
        bullets: [
          'Elige el tipo: Gasto, Ingreso o Transferencia',
          'Selecciona categoría, cuenta y monto',
          'Puedes agregar notas opcionales y excluirlo del presupuesto',
          'Las transferencias mueven dinero entre dos cuentas tuyas',
        ],
      },
      {
        id: 'confirmar',
        icon: 'fa-solid fa-circle-check',
        iconColor: 'var(--f-pending)',
        title: 'Por confirmar',
        summary: 'Movimientos que necesitan tu visto bueno',
        bullets: [
          'Los recurrentes que se generan automáticamente aparecen como "Por confirmar"',
          'Ve a Movimientos → filtro "Por confirmar" para verlos todos',
          'Confirmar valida el movimiento y lo incluye en tus cálculos definitivos',
          'Puedes editar el monto o la cuenta antes de confirmar',
        ],
        tip: 'Es una red de seguridad — los recurrentes no afectan tu saldo hasta que los confirmas',
      },
      {
        id: 'filtros',
        icon: 'fa-solid fa-filter',
        iconColor: 'var(--f-text-3)',
        title: 'Filtros y búsqueda',
        summary: 'Encuentra cualquier movimiento rápido',
        bullets: [
          'Filtra por tipo: gastos, ingresos, transferencias o por confirmar',
          'Filtra por categoría para ver cuánto gastas en cada área',
          'La búsqueda por texto encuentra movimientos por concepto',
          'Los filtros y búsqueda se pueden combinar',
        ],
      },
      {
        id: 'excluir',
        icon: 'fa-solid fa-eye-slash',
        iconColor: 'var(--f-text-4)',
        title: 'Excluir del presupuesto',
        summary: 'Para gastos que no quieres contar',
        bullets: [
          'Activa el toggle al crear o editar un movimiento',
          'Útil para gastos extraordinarios (viajes, médicos, inversiones)',
          'El movimiento sí aparece en el historial y afecta el saldo de cuenta',
          'Solo se excluye del límite mensual de presupuesto',
        ],
      },
    ],
  },
  {
    id: 'recurrentes',
    label: 'Recurrentes',
    items: [
      {
        id: 'que-son',
        icon: 'fa-solid fa-rotate',
        iconColor: 'var(--f-blue)',
        title: '¿Qué son los recurrentes?',
        summary: 'Gastos o ingresos que se repiten',
        bullets: [
          'Suscripciones (Netflix, Spotify), renta, nómina, servicios',
          'Flux los genera automáticamente en la fecha que configures',
          'Aparecen como "Por confirmar" — tú los validas o ajustas',
          'Puedes definir frecuencia: diaria, semanal, mensual o anual',
        ],
        tip: 'Configurarlos te ahorra registrar manualmente los mismos gastos cada mes',
      },
      {
        id: 'crear-recurrente',
        icon: 'fa-solid fa-calendar-plus',
        iconColor: 'var(--f-blue)',
        title: 'Crear un recurrente',
        summary: 'Configura → Planificados',
        bullets: [
          'Ve a Configuración → Planificados y toca "Nuevo"',
          'Define el nombre, monto, categoría, cuenta y frecuencia',
          'Establece la próxima fecha de cobro',
          'Desde Inicio puedes marcar cada recurrente como cobrado o saltarlo',
        ],
      },
      {
        id: 'recordatorios',
        icon: 'fa-solid fa-bell',
        iconColor: 'var(--f-transfer)',
        title: 'Recordatorios automáticos',
        summary: 'Flux te avisa antes de que cobren',
        bullets: [
          'Recibe un correo cuando un recurrente está a punto de cobrar',
          'Las tarjetas de crédito con fecha de corte también avisan 1 día antes',
          'El último domingo del mes llega un resumen de ajustes sugeridos',
        ],
      },
    ],
  },
  {
    id: 'analisis',
    label: 'Análisis y gráficas',
    items: [
      {
        id: 'tendencia',
        icon: 'fa-solid fa-chart-line',
        iconColor: 'var(--f-blue)',
        title: 'Gráfica de tendencia',
        summary: 'Tu dinero a lo largo del mes',
        bullets: [
          'La línea azul muestra cómo evoluciona tu saldo día a día',
          'Los picos hacia abajo son días de muchos gastos',
          'La línea naranja de presupuesto muestra el ritmo ideal de gasto',
          'Si la línea azul baja más rápido que la naranja, vas gastando de más',
        ],
        tip: 'Una línea casi plana significa que gastas parejo — ideal para planear',
      },
      {
        id: 'auditoria',
        icon: 'fa-solid fa-scale-balanced',
        iconColor: 'var(--f-pending)',
        title: 'Auditoría de saldo',
        summary: 'Cuando la app no cuadra con tu banco',
        bullets: [
          'Ve a Configuración → Cuentas y toca el ícono de balanza de la cuenta',
          'Ingresa el saldo real que te muestra tu banco',
          'Flux genera un ajuste automático para cuadrar la diferencia',
          'Útil cuando hay movimientos del banco que no registraste en Flux',
        ],
        tip: 'Haz una auditoría mensual para mantener tus números siempre precisos',
      },
    ],
  },
  {
    id: 'amigos',
    label: 'Amigos y gastos compartidos',
    items: [
      {
        id: 'agregar-amigos',
        icon: 'fa-solid fa-user-plus',
        iconColor: 'var(--f-blue)',
        title: 'Agregar amigos en Flux',
        summary: 'Busca a alguien por su @usuario',
        bullets: [
          'Ve a Compartidos y toca "Amigos" en la esquina superior',
          'Busca por @usuario — la persona debe tener Flux',
          'Si no está en Flux, puedes invitarla por email',
          'La solicitud aparece en las notificaciones del otro',
        ],
      },
      {
        id: 'compartir-gasto',
        icon: 'fa-solid fa-receipt',
        iconColor: 'var(--f-transfer)',
        title: 'Compartir un gasto',
        summary: 'Divide con personas de tu lista',
        bullets: [
          'Al crear un gasto, activa el toggle "Compartir gasto"',
          'Elige a quién asignarle parte del gasto y el monto',
          'Si la persona está vinculada a un amigo de Flux, le llega una notificación automática',
          'Desde Compartidos puedes ver quién te debe y a quién le debes',
        ],
        tip: 'Modos disponibles: dividir partes iguales, asignar montos personalizados',
      },
      {
        id: 'vincular-personas',
        icon: 'fa-solid fa-link',
        iconColor: 'var(--f-blue)',
        title: 'Vincular contactos a Flux',
        summary: 'Conecta tu lista de personas con amigos reales',
        bullets: [
          'Ve a Configuración → Personas y toca el ícono de vínculo',
          'Solo puedes vincular a amigos aceptados en Flux',
          'Una vez vinculado, los gastos compartidos envían notificaciones automáticas',
          'Puedes cambiar o quitar el vínculo en cualquier momento',
        ],
      },
      {
        id: 'notif-compartidos',
        icon: 'fa-solid fa-paper-plane',
        iconColor: 'var(--f-transfer)',
        title: 'Notificaciones de gastos',
        summary: 'Qué llega al bell de cada quien',
        bullets: [
          'Tu amigo recibe: "X te invita a dividir [concepto]" con opción de registrar en su cuenta',
          'Cuando marcas un gasto como cobrado, tu amigo puede confirmarlo',
          'Cuando tu amigo confirma, tú recibes una notificación de cierre',
          'Todo es opcional — la otra persona siempre mantiene control de su app',
        ],
      },
    ],
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    items: [
      {
        id: 'categorias',
        icon: 'fa-solid fa-tags',
        iconColor: 'var(--f-blue)',
        title: 'Categorías',
        summary: 'Organiza tus gastos como quieras',
        bullets: [
          'Flux incluye categorías predeterminadas (comida, transporte, etc.)',
          'Puedes crear las tuyas con ícono y color personalizados',
          'Las categorías personalizadas aparecen primero al agregar movimientos',
          'Borrar una categoría no elimina los movimientos que la usaron',
        ],
      },
      {
        id: 'apariencia',
        icon: 'fa-solid fa-moon',
        iconColor: 'var(--f-text-3)',
        title: 'Apariencia',
        summary: 'Tema claro u oscuro',
        bullets: [
          'Elige entre modo oscuro y modo claro en Configuración → Apariencia',
          'Tu preferencia se guarda en la nube — sincronizada en todos tus dispositivos',
        ],
      },
      {
        id: 'plan',
        icon: 'fa-solid fa-star',
        iconColor: 'var(--f-transfer)',
        title: 'Plan y suscripción',
        summary: 'Gestiona tu cuenta Flux Pro',
        bullets: [
          'El plan gratuito incluye funciones básicas de registro',
          'Flux Pro desbloquea recurrentes, compartidos, gráficas y más',
          'Puedes cancelar en cualquier momento desde Configuración → Plan',
          'Al cancelar conservas acceso hasta el final del período pagado',
        ],
      },
    ],
  },
  {
    id: 'atajos',
    label: 'Atajos de iPhone',
    items: [
      {
        id: 'que-son-atajos',
        icon: 'fa-solid fa-bolt',
        iconColor: 'var(--f-transfer)',
        title: '¿Qué son los Atajos?',
        summary: 'Registra gastos con Siri o desde el menú compartir',
        bullets: [
          'Los Atajos de iPhone permiten registrar movimientos sin abrir la app',
          'Puedes activarlos con Siri: "Oye Siri, registrar gasto"',
          'También funcionan desde el menú compartir de tu banco o Wallet',
          'Descárgalos desde Configuración → Atajos en Flux',
        ],
        tip: 'Ideal para registrar al momento del pago, sin olvidar nada',
      },
      {
        id: 'instalar-atajos',
        icon: 'fa-solid fa-download',
        iconColor: 'var(--f-blue)',
        title: 'Instalar Atajos',
        summary: 'Configuración → Atajos',
        bullets: [
          'Ve a Configuración → Atajos en Flux',
          'Toca el enlace del atajo que quieres instalar',
          'Se abre la app de Atajos de iPhone — acepta la instalación',
          'Tu token de seguridad se agrega automáticamente al atajo',
        ],
      },
    ],
  },
]
