import { lazy, Suspense, useRef } from 'react'
import { useInView } from 'motion/react'
import { BookOpen, Compass, Wrench, type LucideIcon } from 'lucide-react'
import { Reveal } from '../../components/Reveal'
import { SectionHeading } from '../../components/SectionHeading'
import { useSiteConfig } from '../../lib/queries'

const Quiz = lazy(() => import('./Quiz'))

const TEXT_FALLBACK =
  'La construcción de este portafolio permitió integrar diferentes formas de representar el conocimiento. El desarrollo de líneas de tiempo, entrevistas, recursos interactivos y materiales audiovisuales fortaleció no solamente la comprensión de los contenidos académicos, sino también competencias relacionadas con investigación, comunicación, creatividad, trabajo colaborativo y uso de herramientas digitales.'

export function GroupReflection() {
  const { data: cfg } = useSiteConfig()
  const quizRef = useRef<HTMLDivElement>(null)
  // El quiz (y su código) se descarga solo cuando el visitante se acerca.
  const near = useInView(quizRef, { once: true, margin: '300px 0px' })

  const cards: { title: string; hint: string; text: string | undefined; icon: LucideIcon; color: string }[] = [
    { title: 'Conocimiento', hint: 'Qué aprendimos sobre la temática', text: cfg?.reflection_knowledge, icon: BookOpen, color: '#06B6D4' },
    { title: 'Habilidades', hint: 'Qué aprendimos a hacer', text: cfg?.reflection_skills, icon: Wrench, color: '#7C3AED' },
    { title: 'Experiencia', hint: 'Qué nos dejó el proceso', text: cfg?.reflection_experience, icon: Compass, color: '#F5B942' },
  ]

  return (
    <section
      id="reflexion"
      aria-labelledby="reflexion-titulo"
      className="scroll-mt-24 border-t border-[var(--border)] px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="reflexion-titulo"
          kicker="Reflexión grupal"
          title="Lo que aprendimos"
          intro={cfg?.group_reflection || TEXT_FALLBACK}
        />

        <div className="grid gap-5 md:grid-cols-3">
          {cards.map(({ title, hint, text, icon: Icon, color }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <article
                className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur transition-transform hover:-translate-y-1"
                style={{ borderTop: `3px solid ${color}` }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
                  <Icon size={24} aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-[var(--text)]">{title}</h3>
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{hint}</p>
                <p className="mt-3 leading-relaxed text-[var(--text-muted)]">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-20">
          <Reveal className="mb-6 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-teal">Para jugar</p>
            <h3 className="mt-1 font-serif text-3xl font-semibold text-[var(--text)]">¿Quién lo dijo? ¿Quién lo descubrió?</h3>
            <p className="mt-2 text-[var(--text-muted)]">Pon a prueba lo que sabes de Mesopotamia, Egipto, Tales, Zenón y Arquímedes.</p>
          </Reveal>
          <div ref={quizRef} className="mx-auto max-w-2xl">
            {near ? (
              <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-[var(--surface)]" aria-busy="true" />}>
                <Quiz />
              </Suspense>
            ) : (
              <div className="h-72" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
