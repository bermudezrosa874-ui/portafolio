import { useState } from 'react'
import { CheckCircle2, Minus, Plus } from 'lucide-react'
import { TabIntro } from '../../components/ui/forms'
import { useLearningData } from '../../lib/queries'
import { DeliverableCard } from '../learning/DeliverableCard'
import { PhaseSlots, type PanelTarget } from '../learning/PhaseSlots'
import { StatusBadge } from '../learning/parts'

/**
 * «Fases y entregas» para los colaboradores: las cinco fases en una lista. Al abrir una, se ve su documento (si ya existe)
 * y la pregunta «¿Qué hiciste en esta fase?» para subir lo que falta. Cada espacio se ocupa una sola vez.
 */
export function PhasesBoard({ go }: { go: (target: PanelTarget) => void }) {
  const { data: learning, isLoading } = useLearningData()
  const [open, setOpen] = useState<number | null>(null)
  const phases = learning?.phases ?? []
  const colorOf = (momentId: string) => learning?.moments.find((m) => m.id === momentId)?.color ?? '#06B6D4'

  return (
    <div className="space-y-6">
      <TabIntro title="Fases y entregas">
        Elige una fase y sube lo que hiciste: el documento de entrega, un recurso digital, un video o la línea de tiempo. Cada espacio se ocupa una sola vez.
      </TabIntro>

      {isLoading && <p className="text-[var(--text-muted)]">Cargando…</p>}

      <ul className="space-y-3">
        {phases.map((p) => {
          const deliverable = learning?.deliverables.find((d) => d.phase_id === p.id)
          const on = open === p.id
          const color = colorOf(p.moment_id)
          return (
            <li key={p.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <button
                type="button"
                aria-expanded={on}
                onClick={() => setOpen(on ? null : p.id)}
                className="flex w-full items-center gap-3 rounded-2xl p-5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-xl font-semibold text-[var(--text)]">
                    Fase {p.id} – {p.title}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                    <StatusBadge status={p.status} />
                    <span>{deliverable ? `Documento de ${deliverable.uploaded_by_name || 'un integrante'}` : 'Sin documento'}</span>
                    {p.uploads_closed && (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <CheckCircle2 size={14} aria-hidden /> Completa
                      </span>
                    )}
                  </span>
                </span>
                <span aria-hidden style={{ color }}>
                  {on ? <Minus size={22} /> : <Plus size={22} />}
                </span>
              </button>

              {on && (
                <div className="space-y-5 border-t border-[var(--border)] p-5">
                  {deliverable && (
                    <div className="space-y-2">
                      <h4 className="font-serif text-lg font-semibold text-[var(--text)]">Documento de entrega final</h4>
                      <DeliverableCard deliverable={deliverable} />
                    </div>
                  )}
                  <PhaseSlots phase={p} deliverable={deliverable} go={go} />
                  {p.uploads_closed && <p className="text-sm text-[var(--text-muted)]">Esta fase está completa. Si falta algo, pídele a Rosa que la reabra.</p>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
