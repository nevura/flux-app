import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import type { StaticIcon, StaticColor, Category } from './types'
import { STATIC_ICONS, STATIC_COLORS, PAYMENT_METHODS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Formatters ────────────────────────────────────────────────────────────────

const CURRENCY_LOCALE: Record<string, string> = {
  MXN: 'es-MX', USD: 'en-US', EUR: 'es-ES', GBP: 'en-GB',
  CAD: 'en-CA', JPY: 'ja-JP', BRL: 'pt-BR', ARS: 'es-AR',
  COP: 'es-CO', CLP: 'es-CL', AUD: 'en-AU', CHF: 'de-CH',
  CNY: 'zh-CN', CZK: 'cs-CZ', DKK: 'da-DK', HKD: 'zh-HK',
  HUF: 'hu-HU', IDR: 'id-ID', ILS: 'he-IL', INR: 'hi-IN',
  ISK: 'is-IS', KRW: 'ko-KR', MYR: 'ms-MY', NOK: 'nb-NO',
  NZD: 'en-NZ', PHP: 'fil-PH', PLN: 'pl-PL', RON: 'ro-RO',
  SEK: 'sv-SE', SGD: 'en-SG', THB: 'th-TH', TRY: 'tr-TR',
  ZAR: 'en-ZA',
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  const locale = CURRENCY_LOCALE[currency] ?? 'es-MX'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string, fmt = 'd MMM yyyy'): string {
  return format(new Date(dateStr), fmt, { locale: es })
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Hoy'
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return format(d, 'd MMM', { locale: es })
}

// ── Date helpers ──────────────────────────────────────────────────────────────

export function monthRange(year: number, month: number) {
  const base = new Date(year, month - 1, 1)
  return {
    from: startOfMonth(base).toISOString(),
    to:   endOfMonth(base).toISOString(),
  }
}

export function getMexicoNow(): string {
  return new Date().toLocaleString('en-CA', {
    timeZone: 'America/Mexico_City',
    hour12: false,
  }).replace(', ', 'T')
}

export function currentYearMonth() {
  const d = new Date()
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

// ── Static lookup helpers ─────────────────────────────────────────────────────

export function getIcon(id_icon: string): StaticIcon {
  return STATIC_ICONS.find(i => i.id_icon === id_icon) ?? { id_icon, icon_base: 'fa-solid fa-circle-question' }
}

export function getColor(id_color: string): StaticColor {
  return STATIC_COLORS.find(c => c.id_color === id_color) ?? { id_color, hex: '#64748b', tailwind: 'text-slate-500', bg: 'bg-slate-500/20' }
}

export function getPaymentMethod(id: string) {
  return PAYMENT_METHODS.find(m => m.id_metodo_pago === id) ?? PAYMENT_METHODS[0]
}

export function getCategoryDisplay(category: Category | undefined) {
  if (!category) return { icon: 'fa-solid fa-circle-question', color: 'text-slate-500', bg: 'bg-slate-500/20', name: 'Sin categoría' }
  if (category.id === 'CAT-APPLE') {
    return { icon: 'fa-brands fa-apple', color: 'text-white', bg: 'bg-black', name: category.name }
  }
  const icon = getIcon(category.icon_id)
  const color = getColor(category.color_id)
  return { icon: icon.icon_base, color: color.tailwind, bg: color.bg, name: category.name }
}

// ── Transaction helpers ───────────────────────────────────────────────────────

export function parseAmount(value: string | number): number {
  return Math.abs(parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0)
}

export function adjustmentFor(type: string, amount: number): number {
  if (type === 'TR-INGRESO') return amount
  if (type === 'TR-GASTO')   return -amount
  return 0 // Transfer rows handled separately
}

export function nextRecurringDate(
  from: Date,
  num: number,
  unit: string,
  anchorDay?: number | null,
): Date {
  const d = new Date(from)
  if (unit === 'dia')    { d.setDate(d.getDate() + num); return d }
  if (unit === 'semana') { d.setDate(d.getDate() + num * 7); return d }
  if (unit === 'año')    { d.setFullYear(d.getFullYear() + num); return d }
  // month
  d.setDate(1)
  d.setMonth(d.getMonth() + num)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(anchorDay ?? from.getDate(), lastDay))
  return d
}

// ── Category ID generator ─────────────────────────────────────────────────────

export function generateCategoryId(name: string): string {
  const slug = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  return `CAT-${slug}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function generateAccountId(type: string): string {
  const prefix = type === 'MP-TDC' ? 'TDC' : type === 'MP-TDD' ? 'TDD' : 'EFE'
  return `CTA-${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}
