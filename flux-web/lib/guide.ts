export interface OnboardingSlide {
  id: string
  icon: string
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  bullets: string[]
  tip?: string
  guideLink?: { label: string; href: string }
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: 'fa-solid fa-bolt',
    iconBg: 'var(--f-blue)',
    iconColor: '#fff',
    title: '¡Bienvenido a FluxApp Finance!',
    subtitle: 'Tu app de finanzas personales',
    bullets: [
      'Registra gastos e ingresos en segundos',
      'Lleva el control de todas tus cuentas en un solo lugar',
      'Comparte gastos con amigos directo desde la app',
    ],
  },
  {
    id: 'atajos',
    icon: 'fa-brands fa-apple',
    iconBg: 'rgba(191,90,242,0.15)',
    iconColor: '#bf5af2',
    title: 'Registra con Apple Pay',
    subtitle: 'La función estrella de Flux',
    bullets: [
      'Cada vez que pagues con Apple Pay, Flux registra el gasto automáticamente',
      'Ve a Configuración → Atajos e instala el Atajo de Apple Pay',
      'Después de instalar, configura la Automatización en la app de Atajos → pestaña "Automatizaciones" (paso esencial)',
      'Solo funciona con conexión a internet — si hay error, registra manualmente',
    ],
    tip: '💡 El nombre de tu cuenta en Flux debe coincidir exactamente con el nombre de tu tarjeta en Wallet → Apple Pay',
    guideLink: { label: 'Ver tutorial con fotos paso a paso', href: '/guia' },
  },
  {
    id: 'saldo',
    icon: 'fa-solid fa-wallet',
    iconBg: 'rgba(0,122,255,0.12)',
    iconColor: 'var(--f-blue)',
    title: 'Tu saldo en tiempo real',
    subtitle: 'El número grande en Inicio',
    bullets: [
      'Suma automática de todas tus cuentas activas',
      'Incluye efectivo, débito y crédito disponible',
      'Se actualiza cada vez que registras un movimiento',
    ],
    tip: 'El saldo de tarjetas de crédito resta de tu total para ver lo que realmente tienes',
  },
  {
    id: 'agregar',
    icon: 'fa-solid fa-plus',
    iconBg: 'rgba(0,122,255,0.12)',
    iconColor: 'var(--f-blue)',
    title: 'Agregar movimientos',
    subtitle: 'El botón azul + en la esquina inferior',
    bullets: [
      'Toca + para registrar un gasto, ingreso o transferencia',
      'Elige categoría, cuenta y monto',
      'Las transferencias mueven dinero entre tus propias cuentas',
    ],
  },
  {
    id: 'cuentas',
    icon: 'fa-solid fa-credit-card',
    iconBg: 'rgba(100,210,255,0.12)',
    iconColor: 'var(--f-transfer)',
    title: 'Organiza tus cuentas',
    subtitle: 'Efectivo, débito y crédito',
    bullets: [
      'Crea una cuenta por cada tarjeta o fuente de dinero',
      'Débito = dinero que ya tienes, Crédito = deuda que pagarás',
      'Agrégalas en Configuración → Cuentas',
    ],
    tip: 'Entre más cuentas tengas registradas, más preciso será tu saldo total',
  },
  {
    id: 'presupuesto',
    icon: 'fa-solid fa-chart-pie',
    iconBg: 'rgba(255,69,58,0.12)',
    iconColor: 'var(--f-expense)',
    title: 'Presupuesto mensual',
    subtitle: 'Pon un límite a tus gastos',
    bullets: [
      'Define cuánto quieres gastar al mes en Configuración',
      'La barra en Inicio muestra cuánto llevas vs tu límite',
      'Puedes excluir gastos extraordinarios del conteo',
    ],
  },
  {
    id: 'compartidos',
    icon: 'fa-solid fa-users',
    iconBg: 'rgba(100,210,255,0.12)',
    iconColor: 'var(--f-transfer)',
    title: 'Gastos compartidos',
    subtitle: 'Divide con amigos sin rollos',
    bullets: [
      'Activa "Compartir gasto" al crear un gasto para dividirlo con alguien',
      'Si otra persona pagó por ti, usa "Lo pagó otra persona" — la deuda se registra sin mover tu saldo hasta que pagues',
      'Desde Compartidos ves exactamente a quién le debes y quién te debe',
    ],
    tip: 'Vincula a tus contactos con sus cuentas de Flux para que reciban notificaciones automáticas',
  },
  {
    id: 'recurrentes',
    icon: 'fa-solid fa-rotate',
    iconBg: 'rgba(0,122,255,0.12)',
    iconColor: 'var(--f-blue)',
    title: 'Recurrentes',
    subtitle: 'Suscripciones y cobros fijos',
    bullets: [
      'Configura servicios de streaming, renta, nómina — lo que se repite',
      'Flux los genera automáticamente en la fecha que defines',
      'Aparecen como "Por confirmar" para que los valides',
    ],
    tip: 'Configúralos en Configuración → Planificados',
  },
  {
    id: 'listo',
    icon: 'fa-solid fa-check',
    iconBg: 'rgba(52,199,89,0.12)',
    iconColor: 'var(--f-income)',
    title: '¡Todo listo!',
    subtitle: 'Ya puedes usar FluxApp Finance',
    bullets: [
      'Empieza por configurar tus cuentas en Configuración',
      'Instala el Atajo de Apple Pay para no perderte ningún gasto',
      'Puedes volver a ver esta guía en Configuración → Guía',
    ],
    guideLink: { label: 'Ver guía completa con fotos', href: '/guia' },
  },
]

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
    id: 'atajos',
    label: '⚡ Atajos de iPhone (Apple Pay)',
    items: [
      {
        id: 'que-son-atajos',
        icon: 'fa-brands fa-apple',
        iconColor: '#bf5af2',
        title: '¿Qué son los Atajos de Apple Pay?',
        summary: 'Registra gastos automáticamente al pagar',
        bullets: [
          'Cada vez que pagas con Apple Pay, el Atajo detecta el comercio y el monto',
          'Flux registra el gasto automáticamente — sin abrir la app',
          'Los gastos aparecen como "Por confirmar" para que los valides',
          'También puedes activarlos con Siri: "Oye Siri, registrar gasto"',
        ],
        tip: 'Esta es la función más poderosa de Flux — úsala desde el primer día',
      },
      {
        id: 'instalar-atajos',
        icon: 'fa-solid fa-download',
        iconColor: 'var(--f-blue)',
        title: 'Cómo instalar el Atajo',
        summary: 'Paso a paso en menos de 5 minutos',
        bullets: [
          '1. Ve a Configuración → Atajos en FluxApp Finance',
          '2. Toca "Instalar Atajo Apple Pay" — se abre la app de Atajos de iPhone',
          '3. Acepta la instalación del Atajo',
          '4. El Atajo pedirá tu token de seguridad (cópialo desde Configuración → Atajos)',
          '5. Escribe el nombre de tu tarjeta tal como aparece en Wallet',
          '6. Realiza una compra de prueba con Apple Pay — el gasto debe aparecer en Flux',
        ],
        tip: '⚠️ El nombre de la cuenta en Flux debe ser IDÉNTICO al nombre de la tarjeta en Ajustes → Wallet y Apple Pay → [tu tarjeta]. Hasta el acento importa.',
      },
      {
        id: 'automatizacion-atajo',
        icon: 'fa-solid fa-gears',
        iconColor: '#bf5af2',
        title: 'Configura la Automatización',
        summary: 'Paso esencial para que se active al pagar',
        bullets: [
          'Instalar el Atajo no es suficiente — también debes crear la automatización',
          '1. Abre la app de Atajos → pestaña "Automatizaciones" (ícono del nav)',
          '2. Toca + para agregar nueva automatización',
          '3. Selecciona "Wallet" de las opciones',
          '4. Marca todas tus tarjetas y toca "Siguiente"',
          '5. Selecciona el Atajo de FluxApp Apple Pay',
          '6. Abre la automatización creada → toca el botón de automatización → "Ejecutar de inmediato"',
          '7. Al ejecutar por primera vez, toca "Permitir siempre" en ambos atajos (requisito de iOS)',
          'Si después agregas una tarjeta nueva al Wallet, debes seleccionarla manualmente en esta automatización',
        ],
        tip: '⚠️ Sin este paso, el Atajo NO se activa automáticamente al pagar con Apple Pay',
      },
      {
        id: 'internet-requerido',
        icon: 'fa-solid fa-wifi',
        iconColor: '#FF9F0A',
        title: 'Requiere conexión a internet',
        summary: 'El Atajo y FluxApp necesitan internet',
        bullets: [
          'El Atajo de Apple Pay y FluxApp solo funcionan con conexión a internet',
          'Si el Atajo marca error, lo más probable es una señal inestable o sin internet',
          'Solución: usa el Atajo de Registro Rápido o registra el gasto manualmente en la app',
          'Verifica siempre que el gasto no se haya duplicado si reintentaste',
        ],
        tip: '💡 En zonas con mala señal, prefiere registrar manualmente para no perder el gasto',
      },
      {
        id: 'atajos-nombre',
        icon: 'fa-solid fa-triangle-exclamation',
        iconColor: '#FF9F0A',
        title: 'El nombre debe coincidir exactamente',
        summary: 'El error más común al instalar',
        bullets: [
          'Abre Ajustes → Wallet y Apple Pay en tu iPhone',
          'Toca tu tarjeta y copia el nombre tal como aparece (ej: "BBVA Débito")',
          'En Flux, ve a Configuración → Cuentas y asegúrate de que el nombre sea idéntico',
          'Si no coincide, el Atajo no encontrará la cuenta correcta y fallará silenciosamente',
        ],
        tip: 'Puedes cambiar el nombre de la cuenta en Flux en cualquier momento sin perder el historial',
      },
    ],
  },
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
        tip: '⚠️ Para Atajos de iPhone: el nombre de la cuenta debe coincidir EXACTAMENTE con el nombre de tu tarjeta en Wallet. Verifícalo en Ajustes → Wallet y Apple Pay → Tarjetas de pago',
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
          'Los gastos de Apple Pay también entran como "Por confirmar"',
          'Ve a Movimientos → filtro "Por confirmar" para verlos todos',
          'Confirmar valida el movimiento y lo incluye en tus cálculos definitivos',
        ],
        tip: 'Es una red de seguridad — los recurrentes y Atajos no afectan tu saldo hasta que los confirmas',
      },
      {
        id: 'por-pagar',
        icon: 'fa-solid fa-clock',
        iconColor: '#FF9F0A',
        title: 'Por pagar / Por cobrar',
        summary: 'Deudas pendientes de saldar',
        bullets: [
          '"Por pagar": gastos registrados donde otra persona pagó por ti (IOWE) — el dinero aún no sale de tu cuenta',
          '"Por cobrar": ingresos esperados que aún no recibes',
          'Usa el filtro en Movimientos para verlos agrupados',
          'Cuando pagues, abre el movimiento y toca "Ya pagué esta deuda"',
        ],
        tip: 'El saldo de tu cuenta no cambia hasta que marcas la deuda como pagada',
      },
      {
        id: 'filtros',
        icon: 'fa-solid fa-filter',
        iconColor: 'var(--f-text-3)',
        title: 'Filtros y búsqueda',
        summary: 'Encuentra cualquier movimiento rápido',
        bullets: [
          'Filtra por tipo: gastos, ingresos, transferencias, por confirmar, por pagar, por cobrar',
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
          'Servicios de streaming y música, renta, nómina, servicios',
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
        summary: 'Configuración → Planificados',
        bullets: [
          'Ve a Configuración → Planificados y toca "Nuevo"',
          'Define el nombre, monto, categoría, cuenta y frecuencia',
          'Establece la próxima fecha de cobro',
          'Puedes asignarle gastos compartidos o deudas IOWE también',
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
        title: 'Compartir un gasto (tú pagaste)',
        summary: 'Divide lo que tú pagaste con otros',
        bullets: [
          'Al crear un gasto, activa "Compartir gasto" (ícono azul)',
          'Elige a quién asignarle parte del gasto y el monto o porcentaje',
          'Modos: partes iguales o montos personalizados por persona',
          'Si la persona está vinculada a un amigo de Flux, le llega notificación automática',
        ],
        tip: 'Desde Compartidos puedes ver quién te debe y liquidar con un toque',
      },
      {
        id: 'iowe',
        icon: 'fa-solid fa-hand-holding-dollar',
        iconColor: '#FF9F0A',
        title: 'Lo pagó otra persona (IOWE)',
        summary: 'Registra cuando alguien pagó por ti',
        bullets: [
          'Al crear un gasto, activa "Lo pagó otra persona" (ícono naranja)',
          'El monto NO sale de tu cuenta — solo queda registrado como deuda pendiente',
          'Aparece en Movimientos con el filtro "Por pagar"',
          'Cuando pagues, abre el movimiento y toca "Ya pagué esta deuda" — entonces sí afecta tu saldo',
          'Modos: "Todo a él/ella" (monto total) o "Personalizado" (montos por persona)',
        ],
        tip: 'Perfecto para cuando alguien paga la cuenta del restaurante y después cada quien pone su parte',
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
          'FluxApp Finance ofrece 14 días de prueba gratuita',
          'Flux Pro desbloquea recurrentes, compartidos, gráficas y más',
          'Puedes cancelar en cualquier momento desde Configuración → Plan',
          'Al cancelar conservas acceso hasta el final del período pagado',
        ],
      },
    ],
  },
]
