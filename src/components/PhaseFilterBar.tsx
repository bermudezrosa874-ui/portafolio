import { Lock } from 'lucide-react'
import { isPhaseLocked, opensOn } from '../lib/phases'
import { useLearningData } from '../lib/queries'
import { ui, useUi } from '../lib/uiStore'

interface Props {
  /** Fases que tienen contenido; si se omite se muestran las 5. */
  available?: number[]
  dark?: boolean
}

/** Filtro por fase compartido por Recursos, Videos y Galería (se sincroniza con los accesos rápidos). */
export function PhaseFilterBar({ available, dark = false }: Props) {
  const { phaseFilter } = useUi()
  const { data } = useLearningData()
  const phases = (data?.phases ?? []).filter((p) => !available || available.includes(p.id))

  const chip = (active: boolean) =>
    `rounded-full border min-h-10 px-3.5 py-2 text-sm transition-colors ${
      active
        ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]'
        : dark
          ? 'border-[var(--viewer-line)] text-[var(--viewer-text)] hover:border-gold'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
    }`

  return (
    <div role="group" aria-label="Filtrar por fase" className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={phaseFilter === null} className={chip(phaseFilter === null)} onClick={() => ui.setPhaseFilter(null)}>
        Todas las fases
      </button>
      {phases.map((p) => {
        const locked = isPhaseLocked(p)
        return (
          <button
            key={p.id}
            type="button"
            title={locked ? `Cerrada, se abre el ${opensOn(p)}` : p.title}
            aria-pressed={phaseFilter === p.id}
            disabled={locked}
            className={`${chip(phaseFilter === p.id)} disabled:cursor-not-allowed disabled:opacity-50`}
            onClick={() => ui.setPhaseFilter(phaseFilter === p.id ? null : p.id)}
          >
            {locked && <Lock size={13} aria-hidden className="mr-1 inline" />}
            Fase {p.id}
            {locked && <span className="sr-only"> (cerrada)</span>}
          </button>
        )
      })}
    </div>
  )
}
