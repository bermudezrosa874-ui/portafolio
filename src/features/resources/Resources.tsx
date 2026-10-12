import { useMemo, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ExternalLink, Puzzle } from 'lucide-react'
import { CountUp } from '../../components/CountUp'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { PhaseFilterBar } from '../../components/PhaseFilterBar'
import { Reveal } from '../../components/Reveal'
import { SafeFrame } from '../../components/SafeFrame'
import { SectionHeading } from '../../components/SectionHeading'
import { resolveEmbed } from '../../lib/embed'
import { useLearningData, useResources } from '../../lib/queries'
import { useUi } from '../../lib/uiStore'
import type { Resource } from '../../types'
import { KIND_META, ResourceCard } from './ResourceCard'

type KindFilter = keyof typeof KIND_META | 'todos'

export function Resources() {
  const { data: all = [] } = useResources()
  const { data: learning } = useLearningData()
  const { phaseFilter } = useUi()
  const [kind, setKind] = useState<KindFilter>('todos')
  const [active, setActive] = useState<Resource | null>(null)

  // La línea de tiempo tiene su propia sección; aquí solo van los demás recursos.
  const resources = useMemo(() => all.filter((r) => r.kind !== 'timeline'), [all])
  const numberOf = (id: string) => resources.findIndex((r) => r.id === id) + 1

  const visible = resources.filter(
    (r) => (kind === 'todos' || r.kind === kind) && (phaseFilter === null || r.phase_id === phaseFilter),
  )
  const kindsPresent = (Object.keys(KIND_META) as (keyof typeof KIND_META)[]).filter((k) => resources.some((r) => r.kind === k))
  const phaseIds = [...new Set(resources.map((r) => r.phase_id).filter((x): x is number => x !== null))]
  const phaseLabel = (id: number | null) => (learning?.phases.some((p) => p.id === id) ? `Fase ${id}` : null)

  const activeInfo = resolveEmbed(active?.url)

  const chip = (on: boolean) =>
    `rounded-full border min-h-10 px-3.5 py-2 text-sm transition-colors ${
      on
        ? 'border-[#f5b942] bg-[#f5b942] font-semibold text-[#071426]'
        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-gold'
    }`

  return (
    <section
      id="recursos"
      aria-labelledby="recursos-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="recursos-titulo"
          kicker="Para explorar"
          title="Recursos digitales interactivos"
          intro="Infografías, presentaciones, actividades y juegos creados durante el curso. Elige uno y explóralo sin salir del portafolio."
        />
        <p className="-mt-6 mb-8 text-center text-sm text-[var(--text-muted)]">
          <CountUp value={resources.length} className="font-serif text-2xl text-gold" />{' '}
          {resources.length === 1 ? 'recurso publicado' : 'recursos publicados'}
        </p>

        {resources.length > 0 && (
          <Reveal className="mb-8 space-y-3">
            <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap justify-center gap-2">
              <button type="button" aria-pressed={kind === 'todos'} className={chip(kind === 'todos')} onClick={() => setKind('todos')}>
                Todos los tipos
              </button>
              {kindsPresent.map((k) => (
                <button key={k} type="button" aria-pressed={kind === k} className={chip(kind === k)} onClick={() => setKind(kind === k ? 'todos' : k)}>
                  {KIND_META[k].plural}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <PhaseFilterBar available={phaseIds} />
            </div>
          </Reveal>
        )}

        {resources.length === 0 ? (
          <EmptyState icon={Puzzle} title="Aún no hay recursos publicados" text="Los recursos interactivos aparecerán aquí." />
        ) : visible.length === 0 ? (
          <EmptyState icon={Puzzle} title="Ningún recurso coincide con estos filtros" text="Prueba con otro tipo u otra fase." />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            <AnimatePresence mode="popLayout">
              {visible.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  number={numberOf(r.id)}
                  info={resolveEmbed(r.url)}
                  phaseLabel={phaseLabel(r.phase_id)}
                  onOpen={() => setActive(r)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <Modal
        open={!!active && !!activeInfo.embedUrl}
        onClose={() => setActive(null)}
        title={active?.title ?? ''}
        actions={
          activeInfo.openUrl ? (
            <a
              href={activeInfo.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--viewer-line)] px-4 py-2 text-sm hover:bg-[var(--viewer-hover)]"
            >
              <ExternalLink size={16} aria-hidden /> <span className="hidden sm:inline">Abrir en pestaña nueva</span>
              <span className="sr-only sm:hidden">Abrir en pestaña nueva</span>
            </a>
          ) : null
        }
      >
        <div className="flex h-full flex-col">
          <p className="bg-[var(--viewer-hover)] px-4 py-1.5 text-xs text-[var(--viewer-muted)]">
            ¿No se ve bien? Ábrelo en una pestaña nueva con el botón de arriba.
          </p>
          <div className="min-h-0 flex-1 bg-white">
            {activeInfo.embedUrl && <SafeFrame src={activeInfo.embedUrl} title={active?.title ?? 'Recurso'} />}
          </div>
        </div>
      </Modal>
    </section>
  )
}
