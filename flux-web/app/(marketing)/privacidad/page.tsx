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
      <p className="text-[15px] font-medium mb-12" style={{ color: GRAY }}>Última actualización: 4 de junio de 2026</p>

      <Section title="1. Quiénes somos">
        <p>FluxApp Finance ("nosotros", "la Aplicación") es un servicio de gestión de finanzas personales operado por NEVURA. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos tu información cuando usas FluxApp Finance en <strong style={{ color: DARK }}>fluxappfinance.com</strong>.</p>
        <p>Al usar la Aplicación, aceptas las prácticas descritas en esta política.</p>
      </Section>

      <Section title="2. Información que recopilamos">
        <p>Recopilamos únicamente la información necesaria para brindarte el servicio:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong style={{ color: DARK }}>Datos de cuenta:</strong> nombre completo, correo electrónico y contraseña (almacenada como hash bcrypt — nunca en texto plano).</li>
          <li><strong style={{ color: DARK }}>Datos financieros:</strong> transacciones, cuentas, categorías, presupuestos y notas que registras manualmente o mediante el Atajo de iPhone.</li>
          <li><strong style={{ color: DARK }}>Datos de pago (Stripe):</strong> cuando te suscribes, Stripe gestiona el pago. Nosotros <strong style={{ color: DARK }}>nunca almacenamos</strong> tu número de tarjeta, CVV ni fecha de vencimiento. El único dato de pago que guardamos es el <strong style={{ color: DARK }}>ID de cliente y suscripción de Stripe</strong>, y los últimos 4 dígitos de tu tarjeta tal como Stripe nos los proporciona.</li>
          <li><strong style={{ color: DARK }}>Datos de uso:</strong> información técnica básica (registro de errores, versión del navegador) para mantener la estabilidad del servicio.</li>
          <li><strong style={{ color: DARK }}>Comunicaciones de soporte:</strong> mensajes que nos envíes a través del chat de soporte o por correo electrónico.</li>
        </ul>
      </Section>

      <Section title="3. Cómo usamos tu información">
        <p>Tus datos se usan exclusivamente para:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Proveer, mantener y mejorar el servicio de FluxApp Finance.</li>
          <li>Mostrar tu información financiera personal de forma organizada.</li>
          <li>Procesar y gestionar tu suscripción a través de Stripe.</li>
          <li>Enviarte notificaciones relevantes: recordatorios de pagos, alertas de presupuesto, cobros recurrentes y mensajes de soporte.</li>
          <li>Permitir la función de gastos compartidos (con tu consentimiento explícito al usar esa función).</li>
          <li>Cumplir con obligaciones legales cuando corresponda.</li>
        </ul>
        <p>No usamos tus datos financieros para publicidad, perfilado comercial ni los compartimos con terceros con fines de marketing.</p>
      </Section>

      <Section title="4. Almacenamiento y seguridad">
        <p>Tus datos se almacenan en servidores de <strong style={{ color: DARK }}>Supabase</strong> (PostgreSQL gestionado), protegidos con:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cifrado en tránsito mediante HTTPS/TLS 1.3.</li>
          <li>Cifrado en reposo a nivel de disco.</li>
          <li>Políticas de seguridad a nivel de fila (Row Level Security) que garantizan que cada usuario solo puede acceder a sus propios datos.</li>
          <li>Contraseñas hasheadas — nunca almacenamos tu contraseña original.</li>
        </ul>
        <p>La app se despliega en infraestructura de <strong style={{ color: DARK }}>Vercel</strong>. Todos los proveedores cumplen con estándares de seguridad de la industria (SOC 2, ISO 27001).</p>
      </Section>

      <Section title="5. Stripe y procesamiento de pagos">
        <p>FluxApp Finance utiliza <strong style={{ color: DARK }}>Stripe</strong> como procesador de pagos exclusivo. Stripe está certificado como PCI DSS Level 1, el estándar más alto de seguridad en pagos.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong style={{ color: DARK }}>Datos de tarjeta:</strong> tu número de tarjeta, CVV y fecha de vencimiento son procesados directamente por Stripe. Nosotros nunca vemos ni almacenamos esos datos.</li>
          <li><strong style={{ color: DARK }}>Qué guardamos:</strong> únicamente tu ID de cliente Stripe, el ID de suscripción y los últimos 4 dígitos de la tarjeta que Stripe nos devuelve opcionalmente para mostrarte en la UI.</li>
          <li><strong style={{ color: DARK }}>Consulta la política de privacidad de Stripe</strong> en stripe.com/privacy para más información sobre cómo manejan tus datos de pago.</li>
        </ul>
      </Section>

      <Section title="6. Compartir información con terceros">
        <p>No vendemos, alquilamos ni compartimos tus datos personales con terceros para fines comerciales. Compartimos datos solo en estos casos:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong style={{ color: DARK }}>Gastos compartidos:</strong> al dividir un gasto con otras personas, el concepto y el monto de tu parte se comparten con los participantes que tú invitas explícitamente.</li>
          <li><strong style={{ color: DARK }}>Stripe:</strong> información de facturación necesaria para procesar tu suscripción.</li>
          <li><strong style={{ color: DARK }}>Proveedores de infraestructura:</strong> Supabase (base de datos), Vercel (hosting), Resend (correo). Solo procesan datos bajo nuestras instrucciones y no los usan para fines propios.</li>
          <li><strong style={{ color: DARK }}>Obligación legal:</strong> si una autoridad competente lo requiere mediante proceso legal válido en jurisdicción aplicable.</li>
        </ul>
      </Section>

      <Section title="7. Integración con Apple Pay / Atajos de iPhone">
        <p>La integración con Apple Pay funciona a través de la app nativa de Atajos de iPhone. Cuando realizas una compra con Apple Pay, el Atajo captura el nombre del comercio y el monto de la transacción y los envía a FluxApp Finance.</p>
        <p>En ningún momento tenemos acceso a tus datos bancarios, número de tarjeta ni información sensible de tu Wallet. Apple procesa los pagos de forma completamente independiente. Consulta la <a href="https://www.apple.com/legal/privacy/es-la/" style={{ color: BLUE }} target="_blank" rel="noopener">política de privacidad de Apple</a> para más detalles.</p>
      </Section>

      <Section title="8. Tus derechos">
        <p>Tienes derecho a:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong style={{ color: DARK }}>Acceso:</strong> solicitar una copia de todos los datos que tenemos sobre ti.</li>
          <li><strong style={{ color: DARK }}>Rectificación:</strong> corregir datos incorrectos o desactualizados.</li>
          <li><strong style={{ color: DARK }}>Eliminación:</strong> solicitar la eliminación completa de tu cuenta y todos tus datos.</li>
          <li><strong style={{ color: DARK }}>Portabilidad:</strong> exportar tus datos financieros en formato accesible.</li>
          <li><strong style={{ color: DARK }}>Oposición:</strong> retirar tu consentimiento en cualquier momento para el procesamiento no esencial.</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a>. Respondemos en un plazo máximo de 30 días.</p>
      </Section>

      <Section title="9. Retención de datos">
        <p>Mantenemos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de tu cuenta:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Eliminamos permanentemente tu información en un plazo máximo de 30 días.</li>
          <li>Podemos retener ciertos datos por más tiempo si la ley aplicable lo requiere (por ejemplo, registros de facturación).</li>
          <li>Los datos anonimizados y agregados (sin identificación personal) pueden conservarse indefinidamente para análisis estadístico.</li>
        </ul>
      </Section>

      <Section title="10. Cookies y seguimiento">
        <p>FluxApp Finance usa únicamente:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong style={{ color: DARK }}>Cookies de sesión:</strong> necesarias para mantener tu sesión activa (gestionadas por Supabase Auth).</li>
          <li><strong style={{ color: DARK }}>Cookies técnicas:</strong> para preferencias de la interfaz (tema claro/oscuro).</li>
        </ul>
        <p>No usamos cookies de seguimiento publicitario, píxeles de terceros ni compartimos datos con plataformas de análisis externas.</p>
      </Section>

      <Section title="11. Menores de edad">
        <p>FluxApp Finance no está dirigido a personas menores de 18 años. No recopilamos intencionalmente datos de menores. Si eres padre/madre y crees que tu hijo proporcionó datos, contáctanos para eliminarlos.</p>
      </Section>

      <Section title="12. Cambios a esta política">
        <p>Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos mediante:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Un correo electrónico a la dirección registrada en tu cuenta.</li>
          <li>Un aviso destacado dentro de la aplicación al iniciar sesión.</li>
        </ul>
        <p>La fecha de "última actualización" al inicio de este documento siempre reflejará la versión vigente.</p>
      </Section>

      <Section title="13. Contacto">
        <p>Para cualquier duda sobre esta política, para ejercer tus derechos o para reportar un problema de privacidad:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Email: <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a></li>
          <li>Sitio web: <a href="https://fluxappfinance.com" style={{ color: BLUE }}>fluxappfinance.com</a></li>
        </ul>
      </Section>
    </main>
  )
}
