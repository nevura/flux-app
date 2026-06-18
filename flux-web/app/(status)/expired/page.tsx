'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const PRICE_MONTHLY = 'price_1TbXRPJ3c9aWVlXAvs1otlmf'
const PRICE_YEARLY = 'price_1TbXTnJ3c9aWVlXA8x3EQobG'

export default function ExpiredPage() {
  const [wasPaying, setWasPaying] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()
      setWasPaying(!!(profile as any)?.stripe_customer_id)
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleSubscribe(priceId: string) {
    setLoading(priceId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setLoading(null)
    } catch {
      setLoading(null)
    }
  }

  const title = wasPaying ? 'Tu suscripción expiró' : 'Tu prueba terminó'
  const message = wasPaying
    ? 'Tu período de acceso ha terminado. Suscríbete de nuevo para recuperar acceso completo a tus datos.'
    : 'Tu período de prueba y de gracia han terminado. Tus datos siguen guardados — suscríbete para recuperar acceso completo.'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#020617]">
      <div className="mb-8 flex flex-col items-center gap-3 animate-fade-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#007AFF', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}>
          <i className="fa-solid fa-wallet text-white text-2xl" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">FluxApp Finance</h1>
          <p className="text-slate-400 text-sm mt-0.5">Finanzas que fluyen</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-6 animate-fade-up flex flex-col items-center gap-4 text-center" style={{ animationDelay: '0.05s' }}>
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <i className="fa-solid fa-clock text-red-400 text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="w-full space-y-2.5">
          <button
            onClick={() => handleSubscribe(PRICE_MONTHLY)}
            disabled={loading !== null}
            className="w-full py-3 rounded-2xl text-[15px] font-bold text-white text-center disabled:opacity-50"
            style={{ background: '#007AFF' }}
          >
            {loading === PRICE_MONTHLY ? <i className="fa-solid fa-spinner fa-spin" /> : 'Suscribirme · $89 MXN/mes'}
          </button>
          <button
            onClick={() => handleSubscribe(PRICE_YEARLY)}
            disabled={loading !== null}
            className="w-full py-3 rounded-2xl text-[15px] font-bold text-center disabled:opacity-50"
            style={{ background: 'transparent', border: '1px solid var(--f-line-strong)', color: 'var(--f-text)' }}
          >
            {loading === PRICE_YEARLY ? <i className="fa-solid fa-spinner fa-spin" /> : 'Suscribirme · $829 MXN/año'}
          </button>
        </div>

        <a
          href="mailto:hola@fluxappfinance.com"
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          ¿Necesitas ayuda? Contactar soporte
        </a>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-600 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
        Powered by Nevura
      </p>
    </div>
  )
}
