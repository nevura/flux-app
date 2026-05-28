'use client'

export default function ReadOnlyOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-5 text-center animate-fade-up"
        style={{ background: 'var(--f-bg-elevated)', border: '1px solid var(--f-line-strong)' }}>

        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--f-accent-bg)', border: '1px solid var(--f-accent-border)' }}>
          <i className="fa-solid fa-lock text-2xl" style={{ color: 'var(--f-blue)' }} />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--f-text)' }}>Tu prueba terminó</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--f-text-3)' }}>
            Estás en modo lectura. Puedes ver y filtrar tus transacciones, pero no puedes agregar ni editar nada.
          </p>
        </div>

        <div className="w-full space-y-3">
          <a href="/settings?tab=subscription"
            className="flex items-center justify-center w-full py-3.5 rounded-2xl text-white font-semibold text-base transition-all active:scale-95"
            style={{ background: 'var(--f-blue)', boxShadow: 'var(--f-shadow-accent)' }}>
            Ver planes
          </a>
          <p className="text-xs" style={{ color: 'var(--f-text-4)' }}>
            Mensual $89 MXN &nbsp;·&nbsp; Anual $829 MXN
          </p>
        </div>

      </div>
    </div>
  )
}
