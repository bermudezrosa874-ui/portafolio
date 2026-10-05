import { useLearningData, usePhaseCounts } from '../../lib/queries'
import { ui, useUi } from '../../lib/uiStore'
import { AccordionItem } from '../../components/Accordion'
import { Reveal } from '../../components/Reveal'
import { MomentBlock } from './MomentBlock'

function Skeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Cargando aprendizajes">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ))}
    </div>
  )
}

export function Learning() {
  const { mainOpen } = useUi()
  const { data, isLoading, isError, refetch } = useLearningData()
  const { data: counts } = usePhaseCounts()

  return (
    <section
      id="aprendizajes"
      aria-labelledby="aprendizajes-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <Reveal className="mx-auto max-w-4xl">
        <AccordionItem
          id="aprendizajes-principal"
          open={mainOpen}
          onToggle={ui.toggleMain}
          headingLevel={2}
          accent="var(--c-gold)"
          className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur"
          buttonClassName="p-5 sm:p-7"
          header={
            <span className="block">
              <span className="block text-xs font-medium uppercase tracking-[0.3em] text-teal">
                Tres momentos · cinco fases
              </span>
              <span id="aprendizajes-titulo" className="mt-1 block font-serif text-3xl font-semibold text-gold sm:text-5xl">
                Aprendizajes y evaluación
              </span>
              <span className="mt-2 block max-w-xl text-sm text-[var(--text-muted)]">
                Igual que en el aula virtual: elige un momento y despliega cada fase para ver su entrega y sus
                aprendizajes.
              </span>
            </span>
          }
        >
          <div className="space-y-4 px-4 pb-6 sm:px-7">
            {isLoading && <Skeleton />}
            {isError && (
              <div className="rounded-xl border border-[var(--border)] p-6 text-center">
                <p className="text-[var(--text)]">No pudimos cargar los aprendizajes.</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-3 rounded-full bg-[#f5b942] px-5 py-2 text-sm font-semibold text-[#071426]"
                >
                  Reintentar
                </button>
              </div>
            )}
            {data?.moments.map((moment) => (
              <MomentBlock
                key={moment.id}
                moment={moment}
                phases={data.phases.filter((p) => p.moment_id === moment.id)}
                deliverables={data.deliverables}
                counts={counts}
              />
            ))}
          </div>
        </AccordionItem>
      </Reveal>
    </section>
  )
}
