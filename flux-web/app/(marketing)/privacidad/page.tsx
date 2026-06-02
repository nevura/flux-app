export const metadata = {
  title: 'Política de Privacidad — FluxApp Finance',
  description: 'Política de privacidad de FluxApp Finance',
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

export default function PrivacidadPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-[12px] font-black uppercase tracking-[4px] mb-4" style={{ color: BLUE }}>Legal</p>
      <h1 className="text-[40px] font-black tracking-[-1px] mb-2" style={{ color: DARK }}>Política de Privacidad</h1>
      <p className="text-[15px] font-medium mb-12" style={{ color: GRAY }}>Última actualización: 29 de mayo de 2026</p>

      <Section title="1. Información que recopilamos">
        <p>FluxApp Finance recopila únicamente la información necesaria para brindarte el servicio:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong style={{ color: DARK }}>Datos de cuenta:</strong> nombre, correo electrónico y contraseña (encriptada)</li>
          <li><strong style={{ color: DARK }}>Datos financieros:</strong> transacciones, cuentas, categorías y presupuestos que registras manualmente o via Apple Pay</li>
          <li><strong style={{ color: DARK }}>Datos de uso:</strong> información técnica básica sobre cómo usas la app para mejorar el servicio</li>
        </ul>
      </Section>

      <Section title="2. Cómo usamos tu información">
        <p>Usamos tus datos exclusivamente para:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Proveer y mejorar el servicio de FluxApp Finance</li>
          <li>Mostrarte tu información financiera personal</li>
          <li>Enviarte notificaciones relacionadas con tu cuenta y gastos compartidos</li>
          <li>Procesar pagos de suscripción a través de Stripe</li>
          <li>Responder a tus solicitudes de soporte</li>
        </ul>
      </Section>

      <Section title="3. Almacenamiento y seguridad">
        <p>Tus datos se almacenan de forma segura en servidores de Supabase con encriptación en tránsito (HTTPS/TLS) y en reposo. Las contraseñas nunca se almacenan en texto plano.</p>
        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra accesos no autorizados, pérdida o alteración.</p>
      </Section>

      <Section title="4. Compartir información">
        <p>No vendemos, alquilamos ni compartimos tus datos financieros personales con terceros, excepto en los siguientes casos:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong style={{ color: DARK }}>Gastos compartidos:</strong> al dividir un gasto, el nombre del concepto y monto se comparten con los participantes que invites</li>
          <li><strong style={{ color: DARK }}>Stripe:</strong> para procesamiento de pagos (solo datos necesarios para la transacción)</li>
          <li><strong style={{ color: DARK }}>Obligación legal:</strong> si una autoridad competente lo requiere mediante proceso legal válido</li>
        </ul>
      </Section>

      <Section title="5. Integración con Apple Pay">
        <p>La integración con Apple Pay funciona a través de Atajos de iPhone. Flux recibe únicamente el nombre del comercio y el monto de la transacción — nunca tus datos bancarios ni información de tu tarjeta.</p>
        <p>Apple procesa los pagos de forma independiente. Consulta la política de privacidad de Apple para más detalles sobre cómo manejan tus datos de pago.</p>
      </Section>

      <Section title="6. Tus derechos">
        <p>Tienes derecho a:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Acceder a todos los datos que tenemos sobre ti</li>
          <li>Corregir información incorrecta</li>
          <li>Solicitar la eliminación de tu cuenta y todos tus datos</li>
          <li>Exportar tus datos financieros</li>
          <li>Retirar tu consentimiento en cualquier momento</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, contáctanos en <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a></p>
      </Section>

      <Section title="7. Retención de datos">
        <p>Mantenemos tus datos mientras tu cuenta esté activa. Si cierras tu cuenta, eliminamos permanentemente tu información en un plazo máximo de 30 días, excepto donde la ley exija conservarlos por más tiempo.</p>
      </Section>

      <Section title="8. Cookies y seguimiento">
        <p>Flux usa únicamente las cookies necesarias para mantener tu sesión activa. No usamos cookies de seguimiento publicitario ni compartimos datos con plataformas de análisis de terceros.</p>
      </Section>

      <Section title="9. Cambios a esta política">
        <p>Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por correo electrónico o dentro de la aplicación.</p>
      </Section>

      <Section title="10. Contacto">
        <p>Para cualquier duda sobre privacidad o para ejercer tus derechos: <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a></p>
      </Section>
    </main>
  )
}
