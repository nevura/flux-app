import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Flux Admin</title></head><body style="font-family:sans-serif;background:#0C0C0E;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">🚫</div><h2 style="margin:0 0 8px;">Solicitud rechazada</h2><p style="color:rgba(255,255,255,0.5);margin:0;">Se notificó al usuario que su solicitud no fue aprobada.</p></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}
