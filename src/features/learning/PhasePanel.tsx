import { useState } from 'react'
import { Film, Images, NotebookPen, Puzzle, type LucideIcon } from 'lucide-react'
import { SoonText, isSoon } from '../../components/SoonText'
import { useRole } from '../../hooks/useAuth'
import { ui } from '../../lib/uiStore'
import type { Deliverable, Moment, Phase, PhaseCounts } from '../../types'
import { DeliverableCard } from './DeliverableCard'
import { PhaseActivities } from './PhaseActivities'
import { PhaseSlots } from './PhaseSlots'
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
  return a ?? b ?? 'Fechas por confirmar'
}

/**
 * Lo que ve cada quien: quien visita solo ve lo que ya existe (lo demás queda cerrado, sin textos vacíos).
 * la administradora y los colaboradores además ven «¿Qué hiciste en esta fase?» para subir lo que falta.
 */
export function PhasePanel({ phase, moment, deliverable, counts }: Props) {
  const { isAdmin, isCollaborator, session, userName } = useRole()
  const [replacing, setReplacing] = useState(false)
  const isUploader = !!session && (isAdmin || isCollaborator)
  // Solo quien subió el documento (o la administradora) puede reemplazarlo.
  const canReplace = !!session && !!deliverable && (isAdmin || deliverable.uploaded_by === session.user.id)

  const dates = dateRange(phase)
  const showDates = isAdmin || !isSoon(dates)
  const showActivity = isAdmin || !isSoon(phase.description)
  const showLearned = isAdmin || !isSoon(phase.que_aprendimos)

  const quick: { label: string; count: number; text: string; icon: LucideIcon; section: string }[] = [
    { label: 'Recursos interactivos', count: counts?.resources ?? 0, text: String(counts?.resources ?? 0), icon: Puzzle, section: 'recursos' },
    { label: 'Videos', count: counts?.videos ?? 0, text: String(counts?.videos ?? 0), icon: Film, section: 'entrevistas' },
    { label: 'Evidencias', count: counts?.evidences ?? 0, text: String(counts?.evidences ?? 0), icon: Images, section: 'galeria' },
    { label: 'Reflexiones', count: counts?.reflections ?? 0, text: `${counts?.reflections ?? 0}/5`, icon: NotebookPen, section: 'bitacora' },
  ].filter((q) => q.count > 0)

  return (
    <div className="space-y-6 px-1 pb-6 pt-4 sm:px-4">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Resultado de aprendizaje del curso</dt>
          <dd className="font-medium" style={{ color: `color-mix(in srgb, ${moment.color} 55%, var(--text))` }}>
            {phase.rac}
          </dd>
        </div>
        {showDates && (
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">Fechas</dt>
            <dd className="text-[var(--text)]">
              <SoonText value={dates} />
            </dd>
          </div>
        )}
      </dl>

      {showActivity && (
        <div>
          <h4 className="font-serif text-xl font-semibold text-[var(--text)]">Actividad</h4>
          <p className="mt-1 leading-relaxed text-[var(--text-muted)]">
            <SoonText value={phase.description} />
          </p>
        </div>
      )}

      <PhaseActivities phaseId={phase.id} color={moment.color} />

      {deliverable && (
        <div className="space-y-2">
          <h4 className="font-serif text-xl font-semibold text-[var(--text)]">Documento de entrega final</h4>
          <DeliverableCard deliverable={deliverable} />
          {canReplace && session && (
            <>
              <button
                type="button"
                onClick={() => setReplacing((r) => !r)}
                className="text-sm text-teal underline underline-offset-4"
              >
                {replacing ? 'Cancelar' : 'Reemplazar documento'}
              </button>
              {replacing && <PhaseUploader phaseId={phase.id} existing={deliverable} userId={session.user.id} userName={userName} />}
            </>
          )}
        </div>
      )}

      {isUploader && <PhaseSlots phase={phase} deliverable={deliverable} />}

      {quick.length > 0 && (
        <div>
          <h4 className="mb-2 font-serif text-xl font-semibold text-[var(--text)]">Relacionado con esta fase</h4>
          <ul className="flex flex-wrap gap-2">
            {quick.map(({ label, text, icon: Icon, section }) => (
              <li key={section}>
                <button
                  type="button"
                  onClick={() => ui.goToSection(section, phase.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Icon size={16} aria-hidden style={{ color: moment.color }} />
                  {label}
                  <span className="rounded-full bg-[var(--border)] px-2 text-xs tabular-nums">{text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showLearned && (
        <div className="rounded-xl border-l-4 bg-[var(--surface)] p-5" style={{ borderColor: moment.color }}>
          <h4 className="font-serif text-xl font-semibold text-[var(--text)]">¿Qué aprendimos en esta fase?</h4>
          <p className="mt-1 leading-relaxed text-[var(--text-muted)]">
            <SoonText value={phase.que_aprendimos} />
          </p>
        </div>
      )}
    </div>
  )
}
