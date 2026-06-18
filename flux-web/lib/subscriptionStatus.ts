// Client-safe subscription status helpers — no server-only imports (next/headers etc).
// Split out from lib/subscription.ts so client components (e.g. SubscriptionBanner)
// can use this copy logic without pulling in server-only code.

export type SubscriptionStatus = 'trialing' | 'active' | 'grace' | 'expired' | 'canceled'

export interface StatusBanner {
  title: string
  subtitle: string
  color: 'amber' | 'red'
}

/** Shared copy for trial/grace countdown banners — keeps SubscriptionBanner and
 * the Settings list banner in sync so grace is never silently dropped. */
export function getStatusBanner(status: SubscriptionStatus, daysLeft: number | null): StatusBanner | null {
  if (status === 'trialing') {
    if (daysLeft === null || daysLeft > 5) return null
    return {
      title: daysLeft === 0 ? 'Tu período de prueba termina hoy' : `Tu período de prueba termina en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`,
      subtitle: 'Suscríbete para no perder acceso',
      color: 'amber',
    }
  }
  if (status === 'grace') {
    return {
      title: daysLeft !== null && daysLeft > 0
        ? `Período de gracia: ${daysLeft} día${daysLeft !== 1 ? 's' : ''} para suscribirte`
        : 'Tu acceso completo expira pronto',
      subtitle: 'Tu prueba terminó — después de esto, tu cuenta pasa a modo solo lectura',
      color: 'red',
    }
  }
  return null
}
