import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flux — Finanzas personales',
  description: 'Controla tus finanzas personales con Flux',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Flux' },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#020617',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Apply stored theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('flux-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}` }} />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full bg-[#020617] text-slate-50">
        {children}
        <Toaster
          theme="dark"
          position="bottom-center"
          offset={96}
          richColors
          toastOptions={{
            style: {
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#f8fafc',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '700',
              padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
            duration: 2500,
          }}
        />
      </body>
    </html>
  )
}
