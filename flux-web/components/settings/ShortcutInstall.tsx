'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { SHORTCUT_LINKS } from '@/lib/constants'

export default function ShortcutInstall({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [apiBase, setApiBase] = useState('/api/shortcut/transaction')

  useEffect(() => {
    setApiBase(`${window.location.origin}/api/shortcut/transaction`)
  }, [])

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      toast.success('Token copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Hero */}
      <div className="bg-gradient-to-br from-sky-600/20 to-sky-600/10 border border-sky-500/30 rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center">
            <i className="fa-brands fa-apple text-white text-lg" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Atajos de iPhone</h2>
            <p className="text-xs text-slate-400">Registra gastos al instante</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Conecta Flux con tus Atajos de iPhone para registrar transacciones en segundos — directamente desde Apple Pay o con un toque.
        </p>
      </div>

      {/* API Token */}
      <div className="bg-gradient-to-br from-sky-600/20 to-sky-600/10 border border-sky-500/30 rounded-3xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-key text-amber-400 text-sm" />
          <h3 className="text-sm font-bold text-slate-200">Tu token personal</h3>
        </div>
        <p className="text-xs text-slate-400">
          Este token identifica tu cuenta. Lo necesitas una sola vez al instalar el atajo.
        </p>
        <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2.5">
          <code className="flex-1 text-xs font-mono text-amber-600 font-bold truncate">
            {showToken ? token : token.slice(0, 8) + '••••••••••••••••••••••••'}
          </code>
          <button
            onClick={() => setShowToken(!showToken)}
            className="text-slate-500 hover:text-slate-300 px-1"
          >
            <i className={`fa-solid ${showToken ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
          </button>
          <button
            onClick={copyToken}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-sky-500 text-white' : 'bg-amber-600 text-white hover:bg-sky-500'
              }`}
          >
            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} text-xs`} />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Shortcut 1: Apple Pay */}
      <ShortcutCard
        icon="fa-brands fa-apple-pay"
        iconColor="text-white"
        iconBg="bg-black/80"
        title="Atajo Apple Pay"
        description="Registra automáticamente tus compras con Apple Pay. Se activa cada vez que pagas con tu iPhone o Apple Watch."
        installUrl={SHORTCUT_LINKS.applePay}
        steps={[
          'Toca "Instalar Atajo" abajo',
          'En la pantalla que aparece, toca Agregar',
          'La primera vez que lo uses, ingresa tu token cuando se pida',
          '¡Listo! Ahora cada pago con Apple Pay se registra en Flux',
        ]}
      />

      {/* Shortcut 2: Quick Entry */}
      <ShortcutCard
        icon="fa-solid fa-bolt"
        iconColor="text-white"
        iconBg="bg-sky-600"
        title="Atajo de Registro Rápido"
        description="Un formulario ultra rápido para registrar cualquier gasto o ingreso en 3 toques, sin abrir la app."
        installUrl={SHORTCUT_LINKS.quickEntry}
        steps={[
          'Toca "Instalar Atajo" abajo',
          'En la pantalla que aparece, toca Agregar',
          'La primera vez ingresa tu token',
          'Agrega el atajo a tu pantalla de inicio o a la barra de acciones',
        ]}
      />

      {/* API info for devs */}
      <details className="bg-gradient-to-br from-sky-600/20 to-sky-600/10 border border-sky-500/30 rounded-3xl overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-slate-400 flex items-center gap-2">
          <i className="fa-solid fa-code" />
          API para atajos personalizados
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-slate-500">Puedes crear tus propios atajos usando la API de Flux:</p>
          <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-[12px] text-slate-500 font-mono mb-1">POST</p>
            <code className="text-xs font-mono text-emerald-400 break-all">{apiBase}</code>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 space-y-1">
            <p className="text-[12px] text-slate-500 font-semibold mb-2">HEADERS</p>
            <code className="text-[13px] font-mono text-slate-300 block">Authorization: Bearer {'<tu-token>'}</code>
            <code className="text-[13px] font-mono text-slate-300 block">Content-Type: application/json</code>
          </div>
          <div className="bg-slate-800 rounded-xl p-3">
            <p className="text-[12px] text-slate-500 font-semibold mb-2">BODY (JSON)</p>
            <pre className="text-[13px] font-mono text-slate-300 whitespace-pre-wrap">{JSON.stringify({
              concept: 'Starbucks',
              amount: 89.50,
              type: 'Gasto',
              category: 'Alimentos y bebidas',
              account: 'Tarjeta Débito',
            }, null, 2)}</pre>
          </div>
        </div>
      </details>
    </div>
  )
}

function ShortcutCard({ icon, iconColor, iconBg, title, description, installUrl, steps }: {
  icon: string
  iconColor: string
  iconBg: string
  title: string
  description: string
  installUrl: string
  steps: string[]
}) {
  const [expanded, setExpanded] = useState(false)

  function install() {
    window.open(installUrl, '_blank')
  }

  return (
    <div className="bg-gradient-to-br from-sky-600/20 to-sky-600/10 border border-sky-500/30 rounded-3xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg}`}>
            <i className={`${icon} ${iconColor} text-xl`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">{title}</h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>

        <button
          onClick={install}
          className="w-full bg-sky-600 hover:bg-sky-600 active:scale-95 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
        >
          <i className="fa-solid fa-arrow-down-to-bracket" />
          Instalar Atajo
        </button>
      </div>

      {/* Steps accordion */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 hover:text-slate-400 transition-colors"
      >
        <span className="font-semibold">Cómo configurarlo</span>
        <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-xs transition-transform`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[12px] font-bold text-sky-500">{i + 1}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
