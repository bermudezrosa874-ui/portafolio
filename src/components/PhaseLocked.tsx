import { Lock } from 'lucide-react'
import { opensOn } from '../lib/phases'
import type { Phase } from '../types'

/** Aviso de fase cerrada: sustituye al contenido de la fase hasta su fecha de apertura. */
export function PhaseLocked({ phase, compact = false }: { phase: Pick<Phase, 'id' | 'opens_at'>; compact?: boolean }) {
  const date = opensOn(phase)
  return (
    <div
      role="status"
      className={`flex items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] ${
        compact ? 'p-3 text-sm' : 'p-5'
      }`}
    >
      <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--hover)] text-gold">
        <Lock size={18} />
      </span>
      <p>
        <strong className="font-semibold text-[var(--text)]">Fase {phase.id} cerrada.</strong>{' '}
        {date ? `Se abre el ${date}. Hasta entonces no se puede ver ni subir nada.` : 'Todavía no está disponible.'}
      </p>
    </div>
  )
}
