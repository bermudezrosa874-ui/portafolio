import { Clapperboard } from 'lucide-react'
import { CountUp } from '../../components/CountUp'
import { EmptyState } from '../../components/EmptyState'
import { PhaseFilterBar } from '../../components/PhaseFilterBar'
import { Reveal } from '../../components/Reveal'
import { useLearningData, useSiteConfig, useVideos } from '../../lib/queries'
import { useUi } from '../../lib/uiStore'
import { VideoCard } from './VideoCard'

const INTRO_FALLBACK =
  'A través de esta entrevista se presenta una aproximación creativa a los personajes, acontecimientos e ideas estudiadas, utilizando el formato audiovisual como estrategia para comunicar el conocimiento de una manera dinámica y comprensible.'

export function Videos() {
  const { data: cfg } = useSiteConfig()
  const { data: videos = [] } = useVideos()
  const { data: learning } = useLearningData()
  const { phaseFilter } = useUi()

  const visible = videos.filter((v) => phaseFilter === null || v.phase_id === phaseFilter)
  const phaseIds = [...new Set(videos.map((v) => v.phase_id).filter((x): x is number => x !== null))]
  const phaseLabel = (id: number | null) => {
    const p = learning?.phases.find((x) => x.id === id)
    return p ? `Fase ${p.id}` : null
  }

  return (
    <section
      id="entrevistas"
      aria-labelledby="entrevistas-titulo"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--viewer-bg)] px-4 py-24 text-[var(--viewer-text)] sm:px-6"
    >
      <div aria-hidden className="film-strip absolute inset-x-0 top-0 h-5" />
      <div aria-hidden className="film-strip absolute inset-x-0 bottom-0 h-5" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,58,237,0.18),transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-teal">Entrevistas · videos</p>
          <h2 id="entrevistas-titulo" className="mt-2 font-serif text-4xl font-semibold text-gold sm:text-5xl">
            Voces de la historia
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[var(--viewer-muted)]">{cfg?.videos_intro || INTRO_FALLBACK}</p>
          <p className="mt-4 text-sm text-[var(--viewer-muted)]">
            <CountUp value={videos.length} className="font-serif text-2xl text-gold" />{' '}
            {videos.length === 1 ? 'video publicado' : 'videos publicados'}
          </p>
        </Reveal>

        {videos.length > 0 && (
          <div className="mb-8 flex justify-center">
            <PhaseFilterBar dark available={phaseIds} />
          </div>
        )}

        {videos.length === 0 ? (
          <EmptyState dark icon={Clapperboard} title="Aún no hay videos publicados" text="Las entrevistas aparecerán aquí." />
        ) : visible.length === 0 ? (
          <EmptyState dark icon={Clapperboard} title="No hay videos en esta fase" text="Prueba con otra fase o con «Todas las fases»." />
        ) : (
          <div className={`grid gap-8 ${visible.length > 1 ? 'lg:grid-cols-2' : 'mx-auto max-w-3xl'}`}>
            {visible.map((v, i) => (
              <Reveal key={v.id} delay={(i % 2) * 0.1}>
                <VideoCard video={v} phaseLabel={phaseLabel(v.phase_id)} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
