// Pure notification copy — shared by the bell/toast (client) and the instant
// email fallback (server) so the three channels never show different text
// for the same notification.
import { formatCurrency } from '@/lib/utils'
import type { NotificationType } from '@/lib/types'

export function notifLabel(type: NotificationType, data: Record<string, unknown>): { icon: string; iconColor: string; text: string } {
  const d = data as Record<string, string>
  switch (type) {
    case 'friend_request':
      return { icon: 'fa-solid fa-user-plus', iconColor: 'var(--f-blue)', text: `@${d.from_username || d.from_name} quiere ser tu amigo en Flux` }
    case 'friend_accepted':
      return { icon: 'fa-solid fa-user-check', iconColor: 'var(--f-income)', text: `@${d.from_username || d.from_name} aceptó — ya pueden dividir gastos juntos` }
    case 'friend_declined':
      return { icon: 'fa-solid fa-user-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username || d.from_name} rechazó tu solicitud de amistad` }
    case 'shared_expense_invite':
      return { icon: 'fa-solid fa-receipt', iconColor: 'var(--f-transfer)', text: `@${d.from_username} pagó "${d.concept}" y dice que le debes tu parte` }
    case 'shared_expense_updated':
      return { icon: 'fa-solid fa-pen-to-square', iconColor: 'var(--f-transfer)', text: `@${d.from_username} cambió un gasto en el que participas: "${d.concept}"` }
    case 'sync_proposal':
      return { icon: 'fa-solid fa-arrows-rotate', iconColor: 'var(--f-blue)', text: `@${d.from_username} dice que participaste en: "${d.concept}" — ¿lo agregas a tu app?` }
    case 'sync_accepted':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `@${d.from_username} aceptó el gasto compartido: "${d.concept}"` }
    case 'sync_declined':
      return { icon: 'fa-solid fa-circle-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username} no reconoce el gasto: "${d.concept}"` }
    case 'shared_expense_sent': {
      const names = Array.isArray((data as any).invited_names) ? ((data as any).invited_names as string[]).join(', ') : ''
      return { icon: 'fa-solid fa-paper-plane', iconColor: 'var(--f-blue)', text: `Le avisaste a ${names} sobre: "${d.concept}" — te avisaremos cuando acepte` }
    }
    case 'shared_expense_accepted':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-transfer)', text: `@${d.from_username} aceptó — te pagará cuando pueda. Revísalo en Compartidos` }
    case 'shared_expense_declined':
      return { icon: 'fa-solid fa-circle-xmark', iconColor: 'var(--f-expense)', text: `@${d.from_username} no aceptó el gasto: "${d.concept}"` }
    case 'expense_settled_confirm':
      return { icon: 'fa-solid fa-hand-holding-dollar', iconColor: 'var(--f-income)', text: `@${d.from_username} dice que ya te pagó "${d.concept}" — ¿lo confirmas?` }
    case 'expense_settled':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `Confirmaste que @${d.from_username} te pagó "${d.concept}"` }
    case 'expense_settle_rejected':
      return { icon: 'fa-solid fa-circle-xmark', iconColor: 'var(--f-expense)', text: `No confirmaste el pago de @${d.from_username} en "${d.concept}"` }
    case 'receivable_invite':
      return { icon: 'fa-solid fa-file-invoice-dollar', iconColor: '#FF9F0A', text: `@${d.from_username} dice que le debes: "${d.concept}" · ${formatCurrency(Number(d.participant_amount))}` }
    case 'receivable_abono':
      return { icon: 'fa-solid fa-coins', iconColor: 'var(--f-income)', text: `@${d.from_username} anotó que les pagaste ${formatCurrency(Number(d.amount))} de: "${d.concept}"` }
    case 'receivable_settled':
      return { icon: 'fa-solid fa-circle-check', iconColor: 'var(--f-income)', text: `@${d.from_username} confirmó que ya les pagaste todo: "${d.concept}"` }
    case 'scheduled_due':
      return { icon: 'fa-solid fa-calendar-exclamation', iconColor: 'var(--f-expense)', text: `Vence hoy: ${d.name} · ${formatCurrency(Number(d.amount))}` }
    case 'tdc_due': {
      const days = Number(d.days_until)
      const when = days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`
      return { icon: 'fa-solid fa-credit-card', iconColor: 'var(--f-transfer)', text: `Pago TDC ${d.name} — vence ${when}` }
    }
    case 'budget_alert': {
      const isRed = d.level === '100'
      return {
        icon: 'fa-solid fa-chart-pie',
        iconColor: isRed ? 'var(--f-expense)' : '#FF9F0A',
        text: isRed
          ? `Presupuesto agotado — ${formatCurrency(Number(d.spent))} de ${formatCurrency(Number(d.limit))}`
          : `Presupuesto al 80% — ${formatCurrency(Number(d.spent))} de ${formatCurrency(Number(d.limit))}`,
      }
    }
    case 'trial_expiring':
      return {
        icon: 'fa-solid fa-hourglass-half',
        iconColor: '#FF9F0A',
        text: `Tu prueba vence en ${d.days_left} ${Number(d.days_left) === 1 ? 'día' : 'días'} — ve a Ajustes`,
      }
    case 'grace_started':
      return {
        icon: 'fa-solid fa-triangle-exclamation',
        iconColor: 'var(--f-expense)',
        text: `Tu prueba terminó — tienes ${d.grace_days} días de gracia para suscribirte`,
      }
    case 'shortcut_reminder':
      return { icon: 'fa-solid fa-bolt', iconColor: 'var(--f-blue)', text: 'Configura el Atajo de iPhone para registrar gastos más rápido' }
    case 'reengagement':
      return { icon: 'fa-solid fa-wallet', iconColor: 'var(--f-blue)', text: 'Hace unos días que no registras movimientos — vuelve a Flux' }
    default:
      return { icon: 'fa-solid fa-bell', iconColor: 'var(--f-text-3)', text: 'Notificación' }
  }
}
