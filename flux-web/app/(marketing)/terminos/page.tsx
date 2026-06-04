export const metadata = {
  title: 'Términos y Condiciones — FluxApp Finance',
  description: 'Términos y condiciones de uso de FluxApp Finance',
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
      <p className="text-[15px] font-medium mb-12" style={{ color: GRAY }}>Última actualización: 4 de junio de 2026</p>

      <Section title="1. Aceptación de los términos">
        <p>Al crear una cuenta y usar FluxApp Finance ("el Servicio", "la Aplicación"), aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, por favor no uses la aplicación.</p>
        <p>Estos términos constituyen un acuerdo legalmente vinculante entre tú y NEVURA, operador de FluxApp Finance.</p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>FluxApp Finance es una aplicación web de gestión de finanzas personales que permite:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Registrar y organizar transacciones, ingresos y gastos.</li>
          <li>Gestionar múltiples cuentas (efectivo, débito, crédito).</li>
          <li>Crear presupuestos mensuales por categoría.</li>
          <li>Dividir y registrar gastos compartidos con otros usuarios.</li>
          <li>Programar transacciones recurrentes (suscripciones, gastos fijos).</li>
          <li>Registrar gastos automáticamente mediante Atajos de iPhone y Apple Pay.</li>
          <li>Visualizar estadísticas y análisis de tus finanzas.</li>
        </ul>
        <p>FluxApp Finance es una herramienta de organización personal y <strong style={{ color: DARK }}>no constituye asesoría financiera, fiscal ni de inversión</strong>.</p>
      </Section>

      <Section title="3. Registro y cuenta">
        <p>Para usar el Servicio necesitas crear una cuenta con una dirección de correo electrónico válida. Eres responsable de:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Mantener la confidencialidad de tu contraseña.</li>
          <li>Todas las actividades realizadas desde tu cuenta.</li>
          <li>Notificarnos inmediatamente si detectas acceso no autorizado a tu cuenta.</li>
        </ul>
        <p>El acceso a FluxApp Finance está sujeto a aprobación por parte de nuestro equipo durante el período de acceso anticipado. Nos reservamos el derecho de rechazar o cancelar cuentas a nuestra discreción, especialmente ante conducta que viole estos términos.</p>
      </Section>

      <Section title="4. Planes, suscripción y pagos">
        <p><strong style={{ color: DARK }}>Período de prueba:</strong> FluxApp Finance ofrece un período de prueba gratuita de 14 días. Durante este período tienes acceso completo al Servicio sin necesidad de ingresar datos de pago.</p>
        <p><strong style={{ color: DARK }}>Suscripción:</strong> Tras el período de prueba, el acceso continuo requiere una suscripción de pago. Ofrecemos planes mensuales y anuales. Los precios vigentes se muestran en la aplicación al momento de la suscripción.</p>
        <p><strong style={{ color: DARK }}>Procesamiento de pagos:</strong> Todos los pagos son procesados de forma segura a través de <strong style={{ color: DARK }}>Stripe</strong>. Nunca almacenamos tu número de tarjeta, CVV ni datos bancarios completos. Consulta los <a href="https://stripe.com/es-mx/legal" style={{ color: BLUE }} target="_blank" rel="noopener">Términos de Servicio de Stripe</a> para más información sobre el procesamiento de pagos.</p>
        <p><strong style={{ color: DARK }}>Renovación automática:</strong> Las suscripciones se renuevan automáticamente al final de cada período (mensual o anual) a menos que las canceles antes de la fecha de renovación.</p>
      </Section>

      <Section title="5. Cancelación y política de reembolsos">
        <p><strong style={{ color: DARK }}>Cancelación:</strong> Puedes cancelar tu suscripción en cualquier momento desde Ajustes → Suscripción dentro de la aplicación. La cancelación es efectiva al instante — no se realizarán cargos adicionales en ciclos futuros.</p>
        <p><strong style={{ color: DARK }}>Acceso tras cancelar:</strong> Al cancelar, conservas acceso al Servicio hasta el último día del período ya pagado. Por ejemplo, si cancelas a mitad de un mes, puedes seguir usando la app hasta que termine ese mes.</p>
        <p><strong style={{ color: DARK }}>Reembolsos:</strong> FluxApp Finance no ofrece reembolsos por períodos ya cobrados, ya sean mensuales o anuales. Esto aplica tanto a cancelaciones voluntarias como a suspensiones de cuenta por violación de estos términos. Al suscribirte aceptas esta política.</p>
        <p><strong style={{ color: DARK }}>Excepción:</strong> En casos de cobro duplicado o error técnico demostrable de nuestra parte, estudiaremos el reembolso correspondiente. Contáctanos a <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a>.</p>
      </Section>

      <Section title="6. Uso aceptable">
        <p>Te comprometes a usar FluxApp Finance únicamente para la gestión de tus finanzas personales y a no:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Compartir tus credenciales de acceso con terceros.</li>
          <li>Intentar acceder a datos de otros usuarios.</li>
          <li>Usar la aplicación para actividades ilegales, fraudulentas o que violen derechos de terceros.</li>
          <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente del Servicio.</li>
          <li>Intentar vulnerar, sobrecargar o interferir con la seguridad o funcionamiento de la plataforma.</li>
          <li>Usar bots, scripts o métodos automatizados para acceder al Servicio sin autorización expresa.</li>
        </ul>
        <p>El incumplimiento de estas restricciones puede resultar en la suspensión o terminación inmediata de tu cuenta sin derecho a reembolso.</p>
      </Section>

      <Section title="7. Propiedad intelectual">
        <p>Todo el contenido de FluxApp Finance — incluyendo diseño, código fuente, marca, logotipos, textos, gráficas y funcionalidades — es propiedad exclusiva de NEVURA y está protegido por leyes de propiedad intelectual aplicables.</p>
        <p>No se te concede ningún derecho de copiar, reproducir, modificar, distribuir ni crear obras derivadas de ningún componente del Servicio sin autorización expresa y por escrito.</p>
        <p>Los datos que registras en la aplicación (tus transacciones, categorías, presupuestos) son de tu propiedad. Te concedemos acceso a ellos mientras mantengas una cuenta activa y nos das permiso de almacenarlos para prestarte el Servicio.</p>
      </Section>

      <Section title="8. Disponibilidad del servicio">
        <p>Nos esforzamos por mantener FluxApp Finance disponible de forma continua, pero no garantizamos disponibilidad ininterrumpida. Pueden ocurrir interrupciones por:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Mantenimiento programado (notificaremos con anticipación cuando sea posible).</li>
          <li>Fallos técnicos en la infraestructura de terceros (Supabase, Vercel, Stripe).</li>
          <li>Causas de fuerza mayor.</li>
        </ul>
        <p>Las interrupciones de servicio no dan derecho a compensación ni reembolso salvo que se traten de interrupciones prolongadas (más de 72 horas continuas) causadas directamente por nosotros.</p>
      </Section>

      <Section title="9. Limitación de responsabilidad">
        <p>FluxApp Finance es una herramienta de registro y organización financiera personal. No somos una institución financiera regulada y no ofrecemos asesoría financiera, fiscal, de inversión ni legal.</p>
        <p>En la máxima medida permitida por la ley aplicable:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>No nos responsabilizamos por decisiones financieras tomadas basadas en la información mostrada en la aplicación.</li>
          <li>No garantizamos la exactitud de cálculos derivados de datos que tú mismo ingresas.</li>
          <li>Nuestra responsabilidad máxima ante cualquier reclamación no excederá el monto que hayas pagado por el Servicio en los últimos 3 meses.</li>
        </ul>
      </Section>

      <Section title="10. Terminación">
        <p>Puedes terminar tu cuenta en cualquier momento cancelando tu suscripción y solicitando la eliminación de tus datos a <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a>.</p>
        <p>Nos reservamos el derecho de suspender o terminar tu acceso sin previo aviso si:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Violas estos Términos y Condiciones.</li>
          <li>Tu suscripción entra en mora y no se regulariza en un plazo razonable.</li>
          <li>Detectamos actividad fraudulenta o de seguridad desde tu cuenta.</li>
        </ul>
      </Section>

      <Section title="11. Modificaciones a los términos">
        <p>Podemos actualizar estos términos en cualquier momento. Te notificaremos sobre cambios importantes mediante:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Un correo electrónico a tu dirección registrada con al menos 15 días de anticipación.</li>
          <li>Un aviso dentro de la aplicación al iniciar sesión.</li>
        </ul>
        <p>El uso continuado de FluxApp Finance después de la fecha de entrada en vigor de los nuevos términos implica tu aceptación de los mismos. Si no estás de acuerdo, puedes cancelar tu suscripción antes de esa fecha.</p>
      </Section>

      <Section title="12. Ley aplicable">
        <p>Estos términos se rigen por las leyes de México. Cualquier disputa se resolverá preferiblemente de forma amigable. De no lograrse un acuerdo, las partes se someten a la jurisdicción de los tribunales competentes en la Ciudad de México.</p>
      </Section>

      <Section title="13. Contacto">
        <p>Para cualquier pregunta, solicitud o reclamación relacionada con estos términos:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Email: <a href="mailto:hola@fluxappfinance.com" style={{ color: BLUE }}>hola@fluxappfinance.com</a></li>
          <li>Sitio web: <a href="https://fluxappfinance.com" style={{ color: BLUE }}>fluxappfinance.com</a></li>
        </ul>
      </Section>
    </main>
  )
}
