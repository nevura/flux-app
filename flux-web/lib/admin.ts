import { createHmac, timingSafeEqual } from 'crypto'

function secret() {
  const s = process.env.ADMIN_SECRET
  if (!s) throw new Error('ADMIN_SECRET not set')
  return s
}

export function signAdminAction(uid: string, action: 'approve' | 'reject'): string {
  return createHmac('sha256', secret()).update(`${uid}:${action}`).digest('hex')
}

export function verifyAdminAction(uid: string, action: 'approve' | 'reject', sig: string): boolean {
  const expected = Buffer.from(signAdminAction(uid, action))
  const received = Buffer.from(sig)
  if (expected.length !== received.length) return false
  try { return timingSafeEqual(expected, received) } catch { return false }
}
