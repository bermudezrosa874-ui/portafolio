import { AccordionItem } from '../../components/Accordion'
import { ui, useUi } from '../../lib/uiStore'
import type { Deliverable, Moment, Phase, PhaseCounts } from '../../types'
import { PhasePanel } from './PhasePanel'
import { StatusBadge, StopwatchIcon } from './parts'

interface Props {
  moment: Moment
  phases: Phase[]
  deliverables: Deliverable[]
  counts: Record<number, PhaseCounts> | undefined
}

export function MomentBlock({ moment, phases, deliverables, counts }: Props) {
  const { openMoments, openPhases } = useUi()
  const open = openMoments.includes(moment.id)

  return (
    <AccordionItem
      id={`momento-${moment.id}`}
      open={open}
      onToggle={() => ui.toggleMoment(moment.id)}
      headingLevel={3}
      accent={moment.color}
      className="overflow-hidden rounded-2xl border bg-[var(--surface)] backdrop-blur"
      buttonClassName="p-4 sm:p-5"
      header={
        <span className="flex items-center gap-4">
          <span style={{ color: moment.color }} className="text-[var(--text)]">
            <StopwatchIcon moment={moment.id} color={moment.color} />
          </span>
          <span>
            <span className="block font-serif text-2xl font-semibold" style={{ color: `color-mix(in srgb, ${moment.color} 55%, var(--text))` }}>
              {moment.title}
            </span>
            <span className="block text-sm text-[var(--text-muted)]">
              {phases.length === 1 ? '1 fase' : `${phases.length} fases`}
            </span>
          </span>
        </span>
      }
    >
      <div className="space-y-3 px-3 pb-4 sm:px-5" style={{ borderTop: `1px solid ${moment.color}33` }}>
        <div className="pt-4" />
        {phases.map((phase) => (
          <div key={phase.id} id={`fase-${phase.id}`} className="scroll-mt-24">
            <AccordionItem
              id={`acc-fase-${phase.id}`}
              open={openPhases.includes(phase.id)}
              onToggle={() => ui.togglePhase(phase.id)}
              headingLevel={4}
              accent={moment.color}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/40"
              buttonClassName="p-4"
              header={
                <span className="block">
                  <span className="block font-serif text-xl font-semibold text-[var(--text)]">
                    Fase {phase.id} – {phase.title}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium" style={{ color: `color-mix(in srgb, ${moment.color} 55%, var(--text))` }}>
                      {phase.rac}
                    </span>
                    <StatusBadge status={phase.status} />
                  </span>
                </span>
              }
            >
              <PhasePanel
                phase={phase}
                moment={moment}
                deliverable={deliverables.find((d) => d.phase_id === phase.id)}
                counts={counts?.[phase.id]}
              />
            </AccordionItem>
          </div>
        ))}
      </div>
    </AccordionItem>
  )
}
