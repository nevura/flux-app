import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ background: '#fff', color: '#1D1D1F', fontFamily: 'var(--font-geist-sans)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Minimal nav */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-[56px]">
          <Link href="/" className="text-[20px] font-black tracking-tight" style={{ color: '#007AFF' }}>
            fluxapp finance
          </Link>
          <Link
            href={user ? '/home' : '/login'}
            className="text-[14px] font-bold px-4 py-2 rounded-[10px] text-white"
            style={{ background: '#007AFF' }}
          >
            {user ? 'Ir a la app →' : 'Iniciar sesión'}
          </Link>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer style={{ background: '#1D1D1F', marginTop: '80px' }}>
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[18px] font-black tracking-tight" style={{ color: '#007AFF' }}>fluxapp finance</span>
          <div className="flex gap-5 flex-wrap justify-center">
            {[{ label: 'Inicio', href: '/' }, { label: 'Términos', href: '/terminos' }, { label: 'Privacidad', href: '/privacidad' }, { label: 'Guía', href: '/guia' }].map(l => (
              <Link key={l.href} href={l.href} className="text-[13px] font-semibold hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
