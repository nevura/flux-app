export const metadata = {
  title: 'Términos y Condiciones — Flux',
  description: 'Términos y condiciones de uso de Flux App',
}

const BLUE = '#007AFF'
const GRAY = '#6E6E73'
const DARK = '#1D1D1F'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-[22px] font-bold mb-3" style={{ color: DARK }}>{title}</h2>
      <div className="text-[16px] font-medium leading-relaxed space-y-3" style={{ color: GRAY }}>
        {children}
      </div>
    </section>
  )
}

export default function TerminosPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Legal</p>
      <h1 className="text-[40px] font-black tracking-[-1px] mb-2" style={{ color: DARK }}>Términos y Condiciones</h1>
      <p className="text-[15px] font-medium mb-12" style={{ color: GRAY }}>Última actualización: 29 de mayo de 2026</p>

      <Section title="1. Aceptación de los términos">
        <p>Al crear una cuenta y usar Flux ("la Aplicación"), aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no uses la aplicación.</p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>Flux es una aplicación de gestión de finanzas personales que permite registrar transacciones, crear presupuestos, dividir gastos con otras personas y visualizar tu situación financiera.</p>
        <p>El servicio incluye integración con Atajos de iPhone para el registro automático de compras realizadas con Apple Pay.</p>
      </Section>

      <Section title="3. Registro y cuenta">
        <p>Para usar Flux necesitas crear una cuenta con una dirección de correo electrónico válida. Eres responsable de mantener la seguridad de tu contraseña y de todas las actividades realizadas desde tu cuenta.</p>
        <p>El acceso a Flux está sujeto a aprobación por parte del equipo de Flux durante el período de acceso anticipado. Nos reservamos el derecho de rechazar o cancelar cuentas a nuestra discreción.</p>
      </Section>

      <Section title="4. Suscripción y pagos">
        <p>Flux ofrece un período de prueba gratuito de 14 días. Tras ese período, el acceso continuo requiere una suscripción activa.</p>
        <p>Los pagos se procesan a través de Stripe. Puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta. No se realizan reembolsos por períodos ya pagados.</p>
      </Section>

      <Section title="5. Uso aceptable">
        <p>Te comprometes a usar Flux únicamente para la gestión de tus finanzas personales y a no:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Compartir tu cuenta con terceros</li>
          <li>Intentar acceder a datos de otros usuarios</li>
          <li>Usar la aplicación para actividades ilegales o fraudulentas</li>
          <li>Intentar vulnerar la seguridad de la plataforma</li>
        </ul>
      </Section>

      <Section title="6. Propiedad intelectual">
        <p>Todo el contenido de Flux — diseño, código, marca y funcionalidades — es propiedad exclusiva de Flux y está protegido por leyes de propiedad intelectual. No puedes copiar, modificar ni distribuir ningún componente sin autorización expresa.</p>
      </Section>

      <Section title="7. Limitación de responsabilidad">
        <p>Flux es una herramienta de registro y organización financiera personal. No somos una institución financiera y no ofrecemos asesoría financiera, fiscal o de inversión.</p>
        <p>No nos hacemos responsables de decisiones financieras tomadas basadas en la información mostrada en la aplicación, ni de pérdidas económicas derivadas del uso del servicio.</p>
      </Section>

      <Section title="8. Modificaciones">
        <p>Podemos actualizar estos términos en cualquier momento. Te notificaremos sobre cambios importantes a través de la aplicación o por correo electrónico. El uso continuado de Flux después de los cambios implica aceptación de los nuevos términos.</p>
      </Section>

      <Section title="9. Contacto">
        <p>Para cualquier pregunta sobre estos términos, contáctanos en: <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a></p>
      </Section>
    </main>
  )
}
