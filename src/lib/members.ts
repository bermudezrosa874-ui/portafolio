import type { Member } from '../types'

/** Paleta del portafolio: cian, violeta, dorado, azul y rosa. Cada integrante conserva la suya en todo el sitio. */
export const MEMBER_PALETTE = ['#06B6D4', '#7C3AED', '#F5B942', '#2563EB', '#EC4899'] as const

export const SYMBOL_SUGGESTIONS = ['π', '∞', '√', 'Σ', '∫', 'θ', 'Δ', 'φ', 'e', 'i'] as const

export const SYMBOL_MAX = 3
export const ABOUT_MAX = 200
export const QUOTE_MAX = 200
export const CONTRIBUTION_MAX = 1000

/** Nombre sin marcadores entre corchetes ([Por completar]). */
export const plainName = (name: string) => name.replace(/\[[^\]]*\]/g, '').trim() || 'Integrante'
export const firstName = (name: string) => plainName(name).split(/\s+/)[0]

export function initialsOf(name: string): string {
  const words = name.replace(/\[[^\]]*\]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

/** Color de la persona: el guardado en su ficha o, si falta, uno de la paleta según su lugar en el equipo. */
export function memberColor(m: Pick<Member, 'color' | 'position'>): string {
  if (m.color) return m.color
  return MEMBER_PALETTE[(Math.max(1, m.position) - 1) % MEMBER_PALETTE.length]
}

/** Texto legible (oscuro o blanco) sobre un fondo de color. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.62 ? '#071426' : '#ffffff'
}

/** Color usable como texto en modo oscuro y claro. */
export const inkOf = (hex: string) => `color-mix(in srgb, ${hex} 55%, var(--text))`
/** Fondo suave del color de la persona. */
export const tintOf = (hex: string, pct = 14) => `color-mix(in srgb, ${hex} ${pct}%, transparent)`

/** Largo en caracteres visibles (un símbolo como «𝜋» cuenta uno, no dos). */
export const charLength = (s: string) => Array.from(s).length

const DAY = 86400000

/** «Activo hoy», «Activo hace 2 días»… a partir de la última fecha de actividad. */
export function activeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return 'Aún no ha publicado'
  const days = Math.floor((now - new Date(iso).getTime()) / DAY)
  if (days <= 0) return 'Activo hoy'
  if (days === 1) return 'Activo ayer'
  if (days < 14) return `Activo hace ${days} días`
  if (days < 60) return `Activo hace ${Math.floor(days / 7)} semanas`
  return `Activo el ${shortDate(iso)}`
}

/** «12 oct» */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')
}
