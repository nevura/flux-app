'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { requestPasswordReset } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#020617]">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 animate-fade-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#007AFF', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}>
          <i className="fa-solid fa-wallet text-white text-2xl" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">FluxApp Finance</h1>
          <p className="text-slate-400 text-sm mt-0.5">Finanzas que fluyen</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/30 flex items-center justify-center">
              <i className="fa-solid fa-envelope-circle-check text-[#007AFF] text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Revisa tu correo</h2>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Si <strong className="text-slate-300">{email}</strong> está registrado en Flux, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.
              </p>
            </div>
            <a href="/login" className="text-sm font-semibold text-[#007AFF] hover:underline mt-1">
              Volver a iniciar sesión
            </a>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-100">¿Olvidaste tu contraseña?</h2>
              <p className="text-slate-400 text-sm mt-1">Te enviaremos un enlace para restablecerla.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Correo</label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-95"
                style={{ background: '#007AFF', boxShadow: '0 4px 16px rgba(0,122,255,0.3)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin" />
                    Enviando…
                  </span>
                ) : (
                  'Enviar enlace'
                )}
              </button>
            </form>

            <a href="/login" className="block text-center text-sm font-semibold text-slate-400 hover:text-slate-300 mt-5">
              Volver a iniciar sesión
            </a>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-600 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
        Powered by Nevura
      </p>
    </div>
  )
}
