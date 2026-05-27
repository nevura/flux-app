import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud rechazada — Flux</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F2F2F7; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 20px; padding: 48px 36px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { width: 72px; height: 72px; background: #FFF0F0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 24px; }
    h1 { font-size: 22px; font-weight: 700; color: #1C1C1E; margin-bottom: 10px; letter-spacing: -0.4px; }
    p { font-size: 15px; color: #6D6D72; line-height: 1.6; margin-bottom: 32px; }
    .badge { display: inline-block; background: #FFF0F0; color: #FF3B30; font-size: 12px; font-weight: 600; padding: 5px 14px; border-radius: 20px; margin-bottom: 24px; }
    .footer { margin-top: 32px; font-size: 12px; color: #AEAEB2; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🚫</div>
    <span class="badge">Acción completada</span>
    <h1>Solicitud rechazada</h1>
    <p>Se notificó al usuario que su solicitud no fue aprobada.</p>
    <p class="footer">Puedes cerrar esta ventana.</p>
  </div>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
