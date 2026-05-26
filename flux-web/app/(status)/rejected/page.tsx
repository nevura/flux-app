'use client'

import { createClient } from '@/lib/supabase/client'

export default function RejectedPage() {
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#020617]">
      <div className="mb-8 flex flex-col items-center gap-3 animate-fade-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#007AFF', boxShadow: '0 8px 24px rgba(0,122,255,0.35)' }}>
          <i className="fa-solid fa-wallet text-white text-2xl" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Flux</h1>
          <p className="text-slate-400 text-sm mt-0.5">Finanzas que fluyen</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-6 animate-fade-up flex flex-col items-center gap-4 text-center" style={{ animationDelay: '0.05s' }}>
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
          <i className="fa-solid fa-ban text-rose-400 text-xl" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Acceso no aprobado</h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Tu solicitud no fue aprobada. Contacta directamente si crees que es un error.
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors mt-1"
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
