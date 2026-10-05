import { FolderSearch, LineChart, Laptop, Palette, Layers, type LucideIcon } from 'lucide-react'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { useSiteConfig } from '../../lib/queries'

const FALLBACK_OBJECTIVES = [
  'Integrar los productos realizados durante las diferentes fases.',
  'Evidenciar el progreso del aprendizaje.',
  'Utilizar herramientas digitales como medio de comunicación académica.',
  'Facilitar la consulta de los recursos creados.',
  'Promover una presentación visual, organizada e interactiva del conocimiento.',
]
const ICONS: LucideIcon[] = [Layers, LineChart, Laptop, FolderSearch, Palette]
const PURPOSE_FALLBACK =
  'El portafolio tiene como finalidad recopilar, organizar y presentar de manera interactiva los productos académicos desarrollados durante las diferentes fases del curso, permitiendo evidenciar los aprendizajes alcanzados y el proceso de construcción del conocimiento.'
const GENERAL_FALLBACK =
  'Presentar de manera organizada, creativa e interactiva los aprendizajes y productos académicos desarrollados durante el proceso formativo.'

export function About() {
  const { data: cfg } = useSiteConfig()
  const objectives = cfg?.specific_objectives?.length ? cfg.specific_objectives : FALLBACK_OBJECTIVES

  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading id="sobre-titulo" kicker="Propósito" title="Sobre el portafolio" />

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur">
            <h3 className="font-serif text-2xl font-semibold text-gold">Propósito</h3>
            <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{cfg?.purpose || PURPOSE_FALLBACK}</p>
          </Reveal>
          <Reveal delay={0.1} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur">
            <h3 className="font-serif text-2xl font-semibold text-gold">Objetivo general</h3>
            <p className="mt-3 leading-relaxed text-[var(--text-muted)]">
              {cfg?.general_objective || GENERAL_FALLBACK}
            </p>
          </Reveal>
        </div>

        <Reveal className="mb-6 mt-14 text-center">
          <h3 className="font-serif text-3xl font-semibold text-[var(--text)]">Objetivos específicos</h3>
        </Reveal>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {objectives.map((text, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <li key={i}>
                <Reveal
                  delay={i * 0.08}
                  className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal/15 text-teal">
                      <Icon size={22} aria-hidden />
                    </span>
                    <span className="font-serif text-3xl font-semibold text-gold/80" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="mt-3 leading-relaxed text-[var(--text)]">{text}</p>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
