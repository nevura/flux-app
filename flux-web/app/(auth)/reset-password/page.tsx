'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Contraseña actualizada')
    window.location.href = '/home'
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
        {checking ? (
          <div className="flex items-center justify-center py-6">
            <i className="fa-solid fa-spinner fa-spin text-slate-500" />
          </div>
        ) : !hasSession ? (
          <div className="flex flex-col items-center gap-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <i className="fa-solid fa-link-slash text-red-400 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Enlace inválido o expirado</h2>
              <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                Este enlace de recuperación ya no es válido. Solicita uno nuevo.
              </p>
            </div>
            <a
              href="/forgot-password"
              className="w-full py-3 rounded-2xl text-[15px] font-bold text-white text-center"
              style={{ background: '#007AFF' }}
            >
              Solicitar nuevo enlace
            </a>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-100">Nueva contraseña</h2>
              <p className="text-slate-400 text-sm mt-1">Elige una contraseña nueva para tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  autoFocus
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#007AFF] transition-colors"
                />
                <p className="text-[11px] text-slate-500">Mínimo 8 caracteres</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
                    Guardando…
                  </span>
                ) : (
                  'Guardar nueva contraseña'
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-600 text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
        Powered by Nevura
      </p>
    </div>
  )
}
