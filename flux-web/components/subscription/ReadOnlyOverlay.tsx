'use client'

export default function ReadOnlyOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-8 flex flex-col items-center gap-5 text-center animate-fade-up">

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,122,255,0.12)', border: '1px solid rgba(0,122,255,0.25)' }}>
          <i className="fa-solid fa-lock text-[#007AFF] text-2xl" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-2">Tu prueba terminó</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Estás en modo lectura. Puedes ver y filtrar tus transacciones, pero no puedes agregar ni editar nada.
          </p>
        </div>

        <div className="w-full space-y-3">
          <a href="/settings?tab=subscription"
            className="flex items-center justify-center w-full py-3.5 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
            style={{ background: '#007AFF', boxShadow: '0 4px 16px rgba(0,122,255,0.3)' }}>
            Ver planes
          </a>
          <p className="text-xs text-slate-600">
            Mensual $89 MXN &nbsp;·&nbsp; Anual $829 MXN
          </p>
        </div>

      </div>
    </div>
  )
}
