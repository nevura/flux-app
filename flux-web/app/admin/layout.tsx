export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: 'var(--font-geist-sans)' }}>
      {children}
    </div>
  )
}
