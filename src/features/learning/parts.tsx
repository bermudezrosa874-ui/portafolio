import type { Moment, PhaseStatus } from '../../types'

export const STATUS_LABEL: Record<PhaseStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  entregada: 'Entregada',
}
const STATUS_DOT: Record<PhaseStatus, string> = {
  pendiente: '#94a3b8',
  en_progreso: '#3b82f6',
  entregada: '#10b981',
}

export function StatusBadge({ status }: { status: PhaseStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--text)]">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: STATUS_DOT[status] }} />
      {STATUS_LABEL[status]}
    </span>
  )
}

const PROGRESS: Record<Moment['id'], number> = { inicial: 0.1, intermedio: 0.5, final: 1 }

/** Cronómetro: arranque, mitad y final de la carrera, según el momento. */
export function StopwatchIcon({ moment, color, size = 44 }: { moment: Moment['id']; color: string; size?: number }) {
  const fraction = PROGRESS[moment]
  const r = 15
  const c = 2 * Math.PI * r
  const angle = fraction * 2 * Math.PI - Math.PI / 2
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden focusable="false" fill="none">
      <rect x="16" y="2" width="8" height="3.5" rx="1.2" fill={color} />
      <line x1="31" y1="9" x2="33.5" y2="6.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="20" cy="22" r={r + 2} stroke={color} strokeOpacity="0.35" strokeWidth="2" />
      <circle
        cx="20"
        cy="22"
        r={r}
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${c * fraction} ${c}`}
        transform="rotate(-90 20 22)"
        strokeLinecap="butt"
      />
      <line
        x1="20"
        y1="22"
        x2={20 + Math.cos(angle) * 10}
        y2={22 + Math.sin(angle) * 10}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="2" fill="currentColor" />
    </svg>
  )
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)
}

export function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
