import { Film, Images, NotebookPen, Puzzle, type LucideIcon } from 'lucide-react'
import { useRole } from '../../hooks/useAuth'
import { ui } from '../../lib/uiStore'
import type { Deliverable, Moment, Phase, PhaseCounts } from '../../types'
import { DeliverableCard } from './DeliverableCard'
import { PhaseUploader } from './PhaseUploader'
import { formatDate } from './parts'

interface Props {
  phase: Phase
  moment: Moment
  deliverable: Deliverable | undefined
  counts: PhaseCounts | undefined
}

export function dateRange(phase: Phase): string {
  const a = formatDate(phase.start_date)
  const b = formatDate(phase.end_date)
  if (a && b) return `${a} – ${b}`
  return a ?? b ?? '[Por completar]'
}

export function PhasePanel({ phase, moment, deliverable, counts }: Props) {
  const { isAdmin, session, userName } = useRole()

  const quick: { label: string; count: string; icon: LucideIcon; section: string }[] = [
    { label: 'Recursos interactivos', count: String(counts?.resources ?? 0), icon: Puzzle, section: 'recursos' },
    { label: 'Videos', count: String(counts?.videos ?? 0), icon: Film, section: 'entrevistas' },
    { label: 'Evidencias', count: String(counts?.evidences ?? 0), icon: Images, section: 'galeria' },
    { label: 'Reflexiones', count: `${counts?.reflections ?? 0}/5`, icon: NotebookPen, section: 'bitacora' },
  ]

  return (
    <div className="space-y-6 px-1 pb-6 pt-4 sm:px-4">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
            Resultado de aprendizaje del curso
          </dt>
          <dd className="font-medium" style={{ color: `color-mix(in srgb, ${moment.color} 55%, var(--text))` }}>
            {phase.rac}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Fechas</dt>
          <dd className="text-[var(--text)]">{dateRange(phase)}</dd>
        </div>
      </dl>

      <div>
        <h4 className="font-serif text-xl font-semibold text-[var(--text)]">Actividad</h4>
        <p className="mt-1 leading-relaxed text-[var(--text-muted)]">{phase.description}</p>
      </div>

      <div>
        <h4 className="mb-2 font-serif text-xl font-semibold text-[var(--text)]">Documento de entrega final</h4>
        <DeliverableCard deliverable={deliverable} />
      </div>

      {isAdmin && session && (
        <PhaseUploader phaseId={phase.id} existing={deliverable} userId={session.user.id} userName={userName} />
      )}

      <div>
        <h4 className="mb-2 font-serif text-xl font-semibold text-[var(--text)]">Relacionado con esta fase</h4>
        <ul className="flex flex-wrap gap-2">
          {quick.map(({ label, count, icon: Icon, section }) => (
            <li key={section}>
              <button
                type="button"
                onClick={() => ui.goToSection(section, phase.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                <Icon size={16} aria-hidden style={{ color: moment.color }} />
                {label}
                <span className="rounded-full bg-[var(--border)] px-2 text-xs tabular-nums">{count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border-l-4 bg-[var(--surface)] p-5" style={{ borderColor: moment.color }}>
        <h4 className="font-serif text-xl font-semibold text-[var(--text)]">¿Qué aprendimos en esta fase?</h4>
        <p className="mt-1 leading-relaxed text-[var(--text-muted)]">{phase.que_aprendimos}</p>
      </div>
    </div>
  )
}
